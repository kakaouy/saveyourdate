import { findSession, readSessionToken } from "../admin-auth.js";
import {
  appUrl,
  emailShell,
  escapeHtml,
  findOrderByNumber,
  json,
  sendEmail,
  supabaseRequest,
} from "../orders.js";
import { normalizeWhatsAppPhone, sendWhatsAppTemplate } from "../whatsapp.js";
import { logAdminActivity } from "./audit.js";

const confirmationUrlFor = (
  body: Record<string, unknown>,
  inviteToken: string,
  invitationUrl: string | null,
) => {
  const target = String(body.confirmationTarget || "rsvp");
  if (target === "custom") {
    const customUrl = String(body.customConfirmationUrl || "").trim();
    try {
      const parsed = new URL(customUrl);
      if (["http:", "https:"].includes(parsed.protocol)) return parsed.toString();
    } catch { /* handled below */ }
    throw new Error("El enlace alternativo para confirmar no es válido.");
  }
  const invitationOverride = String(body.invitationUrlOverride || "").trim();
  if (target === "invitation" && invitationOverride) {
    try {
      const parsed = new URL(invitationOverride);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error("El enlace de la invitación no es válido.");
    }
  }
  const base = target === "invitation" && (invitationOverride || invitationUrl)
    ? (invitationOverride || invitationUrl)!
    : `${appUrl()}/confirmar`;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(inviteToken)}`;
};

type GuestRow = {
  id: string;
  invite_token: string;
  name: string;
  group_name: string;
  email: string;
  phone: string;
  phone_country_code: string;
  seats: number;
  identification_type: string;
  identification_number: string;
  confirmed: number;
  status: "Confirmado" | "Pendiente" | "No asiste";
  food: string;
  song: string;
  reminded_at: string | null;
  invitation_sent_at: string | null;
  invitation_opened_at: string | null;
  responded_at: string | null;
  archived_at: string | null;
  transport_option: string;
  transport_stop: string;
  menu_choice: string;
  accessibility_needs: string;
  guest_notes: string;
  guest_type: "adult" | "child";
  updated_at: string;
  companions: Array<{
    name: string;
    food: string;
    identificationType: string;
    identificationNumber: string;
  }>;
  invited_by: string;
  companion_of_id: string | null;
  thanked_at?: string | null;
};

const clientGuest = (row: GuestRow, whatsappStatus = "") => ({
  id: row.id,
  inviteToken: row.invite_token,
  name: row.name,
  group: row.group_name,
  email: row.email,
  phone: row.phone,
  phoneCountryCode: row.phone_country_code,
  identificationType: row.identification_type,
  identificationNumber: row.identification_number,
  seats: row.seats,
  confirmed: row.confirmed,
  status: row.status,
  food: row.food,
  song: row.song,
  companions: Array.isArray(row.companions) ? row.companions : [],
  reminded: row.reminded_at || "—",
  invitationSentAt: row.invitation_sent_at || "",
  invitationOpenedAt: row.invitation_opened_at || "",
  respondedAt: row.responded_at || "",
  archivedAt: row.archived_at || "",
  transportOption: row.transport_option || "",
  transportStop: row.transport_stop || "",
  menuChoice: row.menu_choice || "",
  accessibilityNeeds: row.accessibility_needs || "",
  guestNotes: row.guest_notes || "",
  guestType: row.guest_type === "child" ? "child" : "adult",
  updatedAt: row.updated_at,
  whatsappStatus,
  invitedBy: row.invited_by || "",
  companionOfId: row.companion_of_id || "",
  thankedAt: row.thanked_at || "",
});

const currentGuestCount = async (orderNumber: string) => {
  const response = await supabaseRequest(
    `event_guests?order_number=eq.${encodeURIComponent(orderNumber)}&archived_at=is.null&select=id`,
  );
  return ((await response.json()) as Array<{ id: string }>).length;
};

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: "Sesión vencida." }, 401);
    if (request.method !== "GET" && session.access_role === "viewer")
      return json({ error: "Tu acceso es de solo lectura." }, 403);
    if (request.method === "GET") {
      const [response, messagesResponse] = await Promise.all([
        supabaseRequest(
          `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&select=*&order=created_at.asc&limit=500`,
        ),
        supabaseRequest(
          `whatsapp_message_log?order_number=eq.${encodeURIComponent(session.order_number)}&select=guest_id,status&order=created_at.desc&limit=500`,
        ),
      ]);
      const messages = (await messagesResponse.json()) as Array<{
        guest_id: string | null;
        status: string;
      }>;
      const latestStatus = new Map<string, string>();
      messages.forEach((message) => {
        if (message.guest_id && !latestStatus.has(message.guest_id))
          latestStatus.set(message.guest_id, message.status);
      });
      return json({
        guests: ((await response.json()) as GuestRow[]).map((guest) =>
          clientGuest(
            guest,
            latestStatus.get(guest.id) ||
              (guest.status === "Confirmado" ? "sent" : ""),
          ),
        ),
      });
    }
    if (request.method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      if (Array.isArray(body.guests)) {
        if (body.guests.length === 0 || body.guests.length > 500) {
          return json(
            { error: "El archivo debe contener entre 1 y 500 invitados." },
            400,
          );
        }
        if (
          (await currentGuestCount(session.order_number)) + body.guests.length >
          500
        ) {
          return json(
            {
              error:
                "El evento admite hasta 500 invitaciones. Eliminá registros o importá un archivo más pequeño.",
            },
            409,
          );
        }
        const fallbackCode = String(
          body.defaultPhoneCountryCode || "+598",
        ).trim();
        const rows = body.guests.map((item) => {
          const guest = item as Record<string, unknown>;
          const name = String(guest.name || "").trim();
          const phoneCountryCode = String(
            guest.phoneCountryCode || fallbackCode,
          ).trim();
          if (!name) throw new Error("Todos los invitados deben tener nombre.");
          if (!/^\+\d{1,4}$/.test(phoneCountryCode))
            throw new Error(`Código de país inválido para ${name}.`);
          const phoneDigits = String(guest.phone || "")
            .replace(/\D/g, "")
            .replace(/^0+/, "");
          return {
            order_number: session.order_number,
            name,
            group_name: String(guest.group || "").trim(),
            email: String(guest.email || "")
              .trim()
              .toLowerCase(),
            phone: phoneDigits ? `${phoneCountryCode}${phoneDigits}` : "",
            phone_country_code: phoneCountryCode,
            identification_type: String(guest.identificationType || "").trim(),
            identification_number: String(
              guest.identificationNumber || "",
            ).trim(),
            seats: Math.max(1, Math.min(20, Number(guest.seats) || 1)),
            invited_by: String(guest.invitedBy || "").trim(),
            companion_of_id: String(guest.companionOfId || "").trim() || null,
            food: String(guest.food || "").trim() || "—",
            transport_option: String(guest.transportOption || "").trim().slice(0, 80),
            transport_stop: String(guest.transportStop || "").trim().slice(0, 160),
            menu_choice: String(guest.menuChoice || "").trim().slice(0, 120),
            accessibility_needs: String(guest.accessibilityNeeds || "").trim().slice(0, 500),
            guest_notes: String(guest.guestNotes || "").trim().slice(0, 1000),
            guest_type: guest.guestType === "child" ? "child" : "adult",
          };
        });
        const existingResponse = await supabaseRequest(
          `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&select=name,group_name,email,phone&limit=500`,
        );
        const existing = (await existingResponse.json()) as Array<{
          name: string;
          group_name: string;
          email: string;
          phone: string;
        }>;
        const normalizeKey = (value: string) =>
          value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
        const nameKeys = new Set(existing.map((guest) => normalizeKey(`${guest.name}|${guest.group_name}`)));
        const emailKeys = new Set(existing.map((guest) => guest.email.toLowerCase()).filter(Boolean));
        const phoneKeys = new Set(existing.map((guest) => guest.phone.replace(/\D/g, "")).filter(Boolean));
        const hasDuplicate = rows.some((guest) => {
          const nameKey = normalizeKey(`${guest.name}|${guest.group_name}`);
          const emailKey = guest.email.toLowerCase();
          const phoneKey = guest.phone.replace(/\D/g, "");
          const duplicate = nameKeys.has(nameKey) || Boolean(emailKey && emailKeys.has(emailKey)) || Boolean(phoneKey && phoneKeys.has(phoneKey));
          nameKeys.add(nameKey);
          if (emailKey) emailKeys.add(emailKey);
          if (phoneKey) phoneKeys.add(phoneKey);
          return duplicate;
        });
        if (hasDuplicate)
          return json(
            { error: "La lista cambió o contiene duplicados. Volvé a revisar el archivo antes de importar." },
            409,
          );
        const response = await supabaseRequest("event_guests", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(rows),
        });
        const createdGuests = (await response.json()) as GuestRow[];
        await logAdminActivity(session, "guests.imported", "guest", "", {
          count: createdGuests.length,
        });
        return json({ guests: createdGuests.map((guest) => clientGuest(guest)) }, 201);
      }
      const name = String(body.name || "").trim();
      if (!name) return json({ error: "Ingresá el nombre del invitado." }, 400);
      if ((await currentGuestCount(session.order_number)) >= 500) {
        return json(
          { error: "El evento alcanzó el máximo de 500 invitaciones." },
          409,
        );
      }
      const phoneCountryCode = String(body.phoneCountryCode || "+598").trim();
      const phoneDigits = String(body.phone || "")
        .replace(/\D/g, "")
        .replace(/^0+/, "");
      if (!/^\+\d{1,4}$/.test(phoneCountryCode))
        return json({ error: "El código de país no es válido." }, 400);
      const response = await supabaseRequest("event_guests", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          order_number: session.order_number,
          name,
          group_name: String(body.group || "").trim(),
          email: String(body.email || "")
            .trim()
            .toLowerCase(),
          phone: phoneDigits ? `${phoneCountryCode}${phoneDigits}` : "",
          phone_country_code: phoneCountryCode,
          identification_type: String(body.identificationType || "").trim(),
          identification_number: String(body.identificationNumber || "").trim(),
          seats: Math.max(1, Math.min(20, Number(body.seats) || 1)),
          invited_by: String(body.invitedBy || "").trim(),
          companion_of_id: String(body.companionOfId || "").trim() || null,
          transport_option: String(body.transportOption || "").trim().slice(0, 80),
          transport_stop: String(body.transportStop || "").trim().slice(0, 160),
          menu_choice: String(body.menuChoice || "").trim().slice(0, 120),
          accessibility_needs: String(body.accessibilityNeeds || "").trim().slice(0, 500),
          guest_notes: String(body.guestNotes || "").trim().slice(0, 1000),
          guest_type: body.guestType === "child" ? "child" : "adult",
        }),
      });
      const createdGuest = ((await response.json()) as GuestRow[])[0];
      await logAdminActivity(
        session,
        "guest.created",
        "guest",
        createdGuest.id,
        { name: createdGuest.name },
      );
      return json({ guest: clientGuest(createdGuest) }, 201);
    }
    if (request.method === "PATCH") {
      const body = (await request.json()) as Record<string, unknown>;
      const id = String(body.id || "");
      if (body.action === "mark-invitation-sent") {
        if (!id) return json({ error: "Falta identificar al invitado." }, 400);
        const sentAt = new Date().toISOString();
        const response = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({ invitation_sent_at: sentAt, updated_at: sentAt }),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        if (!rows[0]) return json({ error: "No encontramos al invitado." }, 404);
        await logAdminActivity(session, "guest.invitation_sent", "guest", id, {
          channel: String(body.channel || "manual"),
        });
        return json({ guest: clientGuest(rows[0], "sent") });
      }
      if (["archive", "restore"].includes(String(body.action))) {
        if (!id) return json({ error: "Falta identificar al invitado." }, 400);
        const archivedAt = body.action === "archive" ? new Date().toISOString() : null;
        const response = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({ archived_at: archivedAt, updated_at: new Date().toISOString() }),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        if (!rows[0]) return json({ error: "No encontramos al invitado." }, 404);
        await logAdminActivity(session, body.action === "archive" ? "guest.archived" : "guest.restored", "guest", id);
        return json({ guest: clientGuest(rows[0]) });
      }
      if (["bulk-archive", "bulk-restore"].includes(String(body.action))) {
        const ids = Array.isArray(body.ids)
          ? body.ids.map(String).filter(Boolean).slice(0, 500)
          : [];
        if (!ids.length) return json({ error: "Seleccioná al menos un invitado." }, 400);
        const archivedAt = body.action === "bulk-archive" ? new Date().toISOString() : null;
        const response = await supabaseRequest(
          `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&id=in.(${ids.map(encodeURIComponent).join(",")})`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({ archived_at: archivedAt, updated_at: new Date().toISOString() }),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        await logAdminActivity(session, body.action === "bulk-archive" ? "guests.bulk_archived" : "guests.bulk_restored", "guest", "", { count: rows.length });
        return json({ guests: rows.map((guest) => clientGuest(guest)) });
      }
      if (body.action === "remind-email") {
        const guestResponse = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&archived_at=is.null&select=*&limit=1`,
        );
        const guest = ((await guestResponse.json()) as GuestRow[])[0];
        if (!guest?.email)
          return json({ error: "El invitado no tiene un email válido." }, 400);
        const order = await findOrderByNumber(session.order_number);
        if (!order) return json({ error: "No encontramos el evento." }, 404);
        const eventTitle = String(
          order.order_payload.eventTitle || order.customer_name,
        );
        const confirmationUrl = confirmationUrlFor(body, guest.invite_token, order.invitation_url);
        const eventDate = String(
          order.order_payload.eventDate || "Fecha a confirmar",
        );
        const eventType = String(
          order.order_payload["Tipo de evento"] || "Evento",
        );
        const gifts = String(
          order.order_payload.giftDetails ||
            order.order_payload["Regalos"] ||
            order.order_payload["Datos bancarios"] ||
            "Consultá la invitación para ver las opciones de regalo.",
        );
        const customHtml = String(body.customHtml || "").slice(0, 8000);
        const messageText = String(body.message || "").slice(0, 3000);
        const giftText = String(body.giftText || gifts).slice(0, 1500);
        const bodyHtml =
          body.template === "message" && messageText
            ? `<p>Hola <strong>${escapeHtml(guest.name)}</strong>.</p><p>${escapeHtml(messageText).replaceAll("\n", "<br>")}</p><p><a href="${confirmationUrl}">Confirmar asistencia</a></p>${giftText ? `<hr><p><strong>Si querés hacerme un regalo te dejo mis datos:</strong><br>${escapeHtml(giftText).replaceAll("\n", "<br>")}</p>` : ""}`
            : body.template === "custom" && customHtml
            ? customHtml
                .replaceAll("{{nombre}}", escapeHtml(guest.name))
                .replaceAll("{{evento}}", escapeHtml(eventTitle))
                .replaceAll("{{fecha}}", escapeHtml(eventDate))
                .replaceAll("{{confirmacion}}", confirmationUrl)
                .replaceAll("{{regalos}}", escapeHtml(gifts))
            : `<p>Hola <strong>${escapeHtml(guest.name)}</strong>.</p><p>Te recordamos que se acerca <strong>${escapeHtml(eventTitle)}</strong>.</p><p><strong>${escapeHtml(eventType)}</strong> · ${escapeHtml(eventDate)}</p><p>Si ya confirmaste, ¡muchas gracias! Si todavía no lo hiciste, completá tu confirmación:</p><p style="text-align:center;margin:28px 0"><a href="${confirmationUrl}" style="display:inline-block;padding:13px 22px;border-radius:9px;background:#0aabb0;color:#fff;text-decoration:none;font-weight:800">Confirmar asistencia</a></p><hr><p><strong>Regalos</strong><br>${escapeHtml(gifts)}</p>`;
        await sendEmail({
          to: guest.email,
          subject: `Recordatorio · ${eventTitle}`,
          html: emailShell(`Recordatorio de ${eventTitle}`, bodyHtml),
          idempotencyKey: `admin-reminder-${guest.id}-${new Date().toISOString().slice(0, 10)}`,
        });
        const remindedAt = new Date().toISOString();
        const response = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({
              reminded_at: remindedAt,
              updated_at: remindedAt,
            }),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        await logAdminActivity(session, "guest.reminded", "guest", id, {
          channel: "email",
          template: body.template === "message" ? "message" : body.template === "custom" ? "custom" : "predefined",
        });
        return json({ guest: clientGuest(rows[0]), mode: "email" });
      }
      if (body.action === "bulk-delete") {
        const ids = Array.isArray(body.ids)
          ? body.ids.map(String).filter(Boolean).slice(0, 500)
          : [];
        if (!ids.length)
          return json({ error: "Seleccioná al menos un invitado." }, 400);
        await supabaseRequest(
          `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&id=in.(${ids.map(encodeURIComponent).join(",")})`,
          { method: "DELETE" },
        );
        await logAdminActivity(session, "guests.bulk_deleted", "guest", "", {
          count: ids.length,
        });
        return json({ ok: true, ids });
      }
      if (body.action === "bulk-update") {
        const ids = Array.isArray(body.ids)
          ? body.ids.map(String).filter(Boolean).slice(0, 500)
          : [];
        if (!ids.length)
          return json({ error: "Seleccioná al menos un invitado." }, 400);
        const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.status) {
          const status = String(body.status);
          if (!["Confirmado", "Pendiente", "No asiste"].includes(status))
            return json({ error: "El estado seleccionado no es válido." }, 400);
          changes.status = status;
          if (status !== "Confirmado") changes.confirmed = 0;
        }
        if (body.group !== undefined) changes.group_name = String(body.group).trim();
        if (body.invitedBy !== undefined)
          changes.invited_by = String(body.invitedBy).trim();
        const response = await supabaseRequest(
          `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&id=in.(${ids.map(encodeURIComponent).join(",")})`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(changes),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        await logAdminActivity(session, "guests.bulk_updated", "guest", "", {
          count: rows.length,
        });
        return json({ guests: rows.map((guest) => clientGuest(guest)) });
      }
      if (body.action === "thank-you") {
        if (!id) return json({ error: "Falta identificar al invitado." }, 400);
        const guestResponse = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&archived_at=is.null&select=*&limit=1`,
        );
        const guest = ((await guestResponse.json()) as GuestRow[])[0];
        if (!guest) return json({ error: "No encontramos al invitado." }, 404);
        const phone = normalizeWhatsAppPhone(guest.phone);
        if (phone.length < 8)
          return json({ error: "El invitado no tiene un número de WhatsApp válido." }, 400);
        const honoree = String(body.honoree || "").trim().slice(0, 160);
        const attendanceText = guest.status === "Confirmado"
          ? String(body.attendedText || "").trim().slice(0, 2000)
          : String(body.absentText || "").trim().slice(0, 2000);
        const bankDetails = String(body.bankDetails || "").trim().slice(0, 1500);
        const accountBlock = bankDetails
          ? `\n\nSi querés hacerme un regalo, te dejo mis datos:\n${bankDetails}`
          : "";
        const template = String(body.message || "").trim().slice(0, 3500);
        const message = (template || "Hola {{nombre}}.\n\n{{asistencia}}\n\nCon cariño, {{homenajeado}}.")
          .replaceAll("{{nombre}}", guest.name)
          .replaceAll("{{asistencia}}", attendanceText)
          .replaceAll("{{homenajeado}}", honoree)
          .replaceAll("{{cuenta}}", accountBlock);
        const thankedAt = new Date().toISOString();
        const response = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({ thanked_at: thankedAt, updated_at: thankedAt }),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        await logAdminActivity(session, "guest.thanked", "guest", id, { channel: "whatsapp" });
        return json({
          guest: clientGuest(rows[0]),
          url: `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`,
        });
      }
      if (body.action === "remind") {
        if (!id) return json({ error: "Falta identificar al invitado." }, 400);
        const guestResponse = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Pendiente&archived_at=is.null&select=*&limit=1`,
        );
        const guest = ((await guestResponse.json()) as GuestRow[])[0];
        if (!guest)
          return json({ error: "El invitado ya respondió o no existe." }, 404);
        const phone = normalizeWhatsAppPhone(guest.phone);
        if (phone.length < 8)
          return json(
            { error: "El invitado no tiene un número de WhatsApp válido." },
            400,
          );
        const order = await findOrderByNumber(session.order_number);
        if (!order) return json({ error: "No encontramos el evento." }, 404);
        const confirmationUrl = confirmationUrlFor(body, guest.invite_token, order.invitation_url);
        const reminderText = String(body.message || "").trim().slice(0, 3000);
        const giftText = String(body.giftText || "").trim().slice(0, 1500);
        const delivery = await sendWhatsAppTemplate({
          phone,
          recipientName: guest.name,
          eventTitle: String(
            order.order_payload.eventTitle || order.customer_name,
          ),
          confirmationUrl,
        });
        if (!delivery.sent) {
          const remindedAt = new Date().toISOString();
          const updateResponse = await supabaseRequest(
            `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
            {
              method: "PATCH",
              headers: { Prefer: "return=representation" },
              body: JSON.stringify({ reminded_at: remindedAt, updated_at: remindedAt }),
            },
          );
          const updatedRows = (await updateResponse.json()) as GuestRow[];
          const baseMessage = reminderText
            ? `Hola ${guest.name}.\n\n${reminderText}\n\nConfirmar asistencia: ${confirmationUrl}`
            : `Hola ${guest.name}, te recordamos que se acerca ${String(order.order_payload.eventTitle || order.customer_name)}. Si ya confirmaste, ¡muchas gracias! Si todavía no, completá tu confirmación: ${confirmationUrl}`;
          const manualMessage = `${baseMessage}${giftText ? `\n\nSi querés hacerme un regalo te dejo mis datos:\n${giftText}` : ""}`;
          return json({
            mode: "manual",
            guest: clientGuest(updatedRows[0], "sent"),
            url: `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(manualMessage)}&type=phone_number&app_absent=0`,
          });
        }
        await supabaseRequest("whatsapp_message_log", {
          method: "POST",
          body: JSON.stringify({
            order_number: session.order_number,
            guest_id: guest.id,
            message_id: delivery.messageId,
            status: "accepted",
          }),
        });
        const remindedAt = new Date().toISOString();
        const response = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Pendiente&archived_at=is.null`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({
              reminded_at: remindedAt,
              updated_at: remindedAt,
            }),
          },
        );
        const rows = (await response.json()) as GuestRow[];
        if (!rows[0])
          return json({ error: "El invitado ya respondió o no existe." }, 404);
        await logAdminActivity(session, "guest.reminded", "guest", rows[0].id, {
          name: rows[0].name,
          channel: "whatsapp_business",
          messageId: delivery.messageId,
        });
        return json({ guest: clientGuest(rows[0]), mode: "business" });
      }
      const status = String(body.status || "");
      if (!id || !["Confirmado", "Pendiente", "No asiste"].includes(status)) {
        return json(
          { error: "Los datos de la confirmación no son válidos." },
          400,
        );
      }
      const guestResponse = await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=seats,email,phone,phone_country_code,identification_type,identification_number,name,group_name,invited_by,companion_of_id,transport_option,transport_stop,menu_choice,accessibility_needs,guest_notes,guest_type`,
      );
      const existingGuests = (await guestResponse.json()) as GuestRow[];
      if (!existingGuests[0])
        return json({ error: "No encontramos ese invitado." }, 404);
      const confirmed =
        status === "Confirmado"
          ? Math.max(
              1,
              Math.min(
                existingGuests[0].seats,
                Number(body.confirmed) || existingGuests[0].seats,
              ),
            )
          : 0;
      const phoneCountryCode = String(
        body.phoneCountryCode || existingGuests[0].phone_country_code || "+598",
      ).trim();
      const suppliedPhone =
        body.phone === undefined
          ? null
          : String(body.phone).replace(/\D/g, "").replace(/^0+/, "");
      if (!/^\+\d{1,4}$/.test(phoneCountryCode))
        return json({ error: "El código de país no es válido." }, 400);
      const response = await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            status,
            confirmed,
            seats: body.seats === undefined
              ? existingGuests[0].seats
              : Math.max(1, Math.min(20, Number(body.seats) || 1)),
            email: body.email === undefined
              ? existingGuests[0].email
              : String(body.email).trim().toLowerCase(),
            food: String(body.food ?? "—").trim() || "—",
            song: String(body.song ?? "—").trim() || "—",
            phone_country_code: phoneCountryCode,
            phone:
              suppliedPhone === null
                ? existingGuests[0].phone
                : suppliedPhone
                  ? `${phoneCountryCode}${suppliedPhone}`
                  : "",
            identification_type:
              body.identificationType === undefined
                ? existingGuests[0].identification_type
                : String(body.identificationType).trim(),
            identification_number:
              body.identificationNumber === undefined
                ? existingGuests[0].identification_number
                : String(body.identificationNumber).trim(),
            name:
              body.name === undefined
                ? existingGuests[0].name
                : String(body.name).trim(),
            group_name:
              body.group === undefined
                ? existingGuests[0].group_name
                : String(body.group).trim(),
            invited_by:
              body.invitedBy === undefined
                ? existingGuests[0].invited_by
                : String(body.invitedBy).trim(),
            companion_of_id:
              body.companionOfId === undefined
                ? existingGuests[0].companion_of_id
                : String(body.companionOfId).trim() || null,
            transport_option:
              body.transportOption === undefined
                ? existingGuests[0].transport_option
                : String(body.transportOption).trim().slice(0, 80),
            transport_stop:
              body.transportStop === undefined
                ? existingGuests[0].transport_stop
                : String(body.transportStop).trim().slice(0, 160),
            menu_choice:
              body.menuChoice === undefined
                ? existingGuests[0].menu_choice
                : String(body.menuChoice).trim().slice(0, 120),
            accessibility_needs:
              body.accessibilityNeeds === undefined
                ? existingGuests[0].accessibility_needs
                : String(body.accessibilityNeeds).trim().slice(0, 500),
            guest_notes:
              body.guestNotes === undefined
                ? existingGuests[0].guest_notes
                : String(body.guestNotes).trim().slice(0, 1000),
            guest_type:
              body.guestType === undefined
                ? existingGuests[0].guest_type || "adult"
                : body.guestType === "child" ? "child" : "adult",
            updated_at: new Date().toISOString(),
          }),
        },
      );
      const rows = (await response.json()) as GuestRow[];
      if (!rows[0]) return json({ error: "No encontramos ese invitado." }, 404);
      await logAdminActivity(session, "guest.updated", "guest", rows[0].id, {
        name: rows[0].name,
        status: rows[0].status,
      });
      return json({ guest: clientGuest(rows[0]) });
    }
    if (request.method === "DELETE") {
      const id = new URL(request.url).searchParams.get("id") || "";
      await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: "DELETE" },
      );
      await logAdminActivity(session, "guest.deleted", "guest", id);
      return json({ ok: true });
    }
    return json({ error: "Método no permitido." }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: "No pudimos actualizar los invitados." }, 500);
  }
}

export default { fetch: handler };
