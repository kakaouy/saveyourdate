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
  updated_at: string;
  companions: Array<{
    name: string;
    food: string;
    identificationType: string;
    identificationNumber: string;
  }>;
  invited_by: string;
  companion_of_id: string | null;
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
  updatedAt: row.updated_at,
  whatsappStatus,
  invitedBy: row.invited_by || "",
  companionOfId: row.companion_of_id || "",
});

const currentGuestCount = async (orderNumber: string) => {
  const response = await supabaseRequest(
    `event_guests?order_number=eq.${encodeURIComponent(orderNumber)}&select=id`,
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
          clientGuest(guest, latestStatus.get(guest.id) || ""),
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
          };
        });
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
      if (body.action === "remind-email") {
        const guestResponse = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=*&limit=1`,
        );
        const guest = ((await guestResponse.json()) as GuestRow[])[0];
        if (!guest?.email)
          return json({ error: "El invitado no tiene un email válido." }, 400);
        const order = await findOrderByNumber(session.order_number);
        if (!order) return json({ error: "No encontramos el evento." }, 404);
        const confirmationUrl = `${appUrl()}/confirmar?token=${encodeURIComponent(guest.invite_token)}`;
        const eventTitle = String(
          order.order_payload.eventTitle || order.customer_name,
        );
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
        const customHtml = String(body.customHtml || "")
          .slice(0, 8000)
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
        const bodyHtml =
          body.template === "custom" && customHtml
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
          template: body.template === "custom" ? "custom" : "predefined",
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
      if (body.action === "remind") {
        if (!id) return json({ error: "Falta identificar al invitado." }, 400);
        const guestResponse = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Pendiente&select=*&limit=1`,
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
        const confirmationUrl = `${appUrl()}/confirmar?token=${encodeURIComponent(guest.invite_token)}`;
        const delivery = await sendWhatsAppTemplate({
          phone,
          recipientName: guest.name,
          eventTitle: String(
            order.order_payload.eventTitle || order.customer_name,
          ),
          confirmationUrl,
        });
        if (!delivery.sent) {
          return json({
            mode: "manual",
            url: `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(`Hola ${guest.name}, te recordamos confirmar tu asistencia a ${String(order.order_payload.eventTitle || order.customer_name)}. Podés responder acá: ${confirmationUrl}`)}&type=phone_number&app_absent=0`,
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
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Pendiente`,
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
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=seats,phone,phone_country_code,identification_type,identification_number,name,group_name,invited_by,companion_of_id`,
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
