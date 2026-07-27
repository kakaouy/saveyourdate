import { appUrl, emailShell, escapeHtml, json, sendEmail, supabaseRequest } from './_lib/orders.js';

type ReminderOrder = {
  order_number: string;
  customer_name: string;
  order_payload: Record<string, unknown>;
};

type PendingGuest = {
  id: string;
  invite_token: string;
  name: string;
  email: string;
};

const utcDate = (value: Date) => Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  const secret = process.env.CRON_SECRET || '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'No autorizado.' }, 401);
  }
  try {
    const ordersResponse = await supabaseRequest(
      'orders?status=eq.published&select=order_number,customer_name,order_payload&order=created_at.asc&limit=500'
    );
    const orders = await ordersResponse.json() as ReminderOrder[];
    const today = utcDate(new Date());
    const dueOrders = orders.filter((order) => {
      const eventDate = String(order.order_payload.eventDate || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return false;
      const event = new Date(`${eventDate}T00:00:00Z`);
      const daysBefore = Math.max(1, Math.min(60, Number(order.order_payload.reminderDaysBefore) || 7));
      return Math.round((utcDate(event) - today) / 86400000) === daysBefore;
    });

    let sent = 0;
    let failed = 0;
    for (const order of dueOrders) {
      if (sent >= 100) break;
      const guestsResponse = await supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(order.order_number)}&status=eq.Pendiente&email=neq.&reminded_at=is.null&select=id,invite_token,name,email&order=created_at.asc&limit=${100 - sent}`
      );
      const guests = await guestsResponse.json() as PendingGuest[];
      const eventTitle = String(order.order_payload.eventTitle || order.customer_name);
      const daysBefore = Math.max(1, Math.min(60, Number(order.order_payload.reminderDaysBefore) || 7));
      for (const guest of guests) {
        try {
          const confirmationUrl = `${appUrl()}/confirmar?token=${encodeURIComponent(guest.invite_token)}`;
          await sendEmail({
            to: guest.email,
            subject: `Recordatorio de confirmación · ${eventTitle}`,
            idempotencyKey: `rsvp-reminder-${guest.id}-${daysBefore}`,
            html: emailShell(
              '¿Nos acompañás?',
              `<p>Hola <strong>${escapeHtml(guest.name)}</strong>, falta poco para <strong>${escapeHtml(eventTitle)}</strong>.</p>
               <p>Tu respuesta todavía está pendiente. Podés confirmar asistencia, acompañantes y preferencias desde este enlace:</p>
               <p style="text-align:center;margin:28px 0"><a href="${confirmationUrl}" style="display:inline-block;padding:13px 22px;border-radius:9px;background:#0aabb0;color:#fff;text-decoration:none;font-weight:800">Confirmar asistencia</a></p>
               <p style="font-size:13px;color:#765f69">Si ya respondiste por otro medio, podés ignorar este mensaje.</p>`
            )
          });
          const remindedAt = new Date().toISOString();
          await supabaseRequest(
            `event_guests?id=eq.${encodeURIComponent(guest.id)}&order_number=eq.${encodeURIComponent(order.order_number)}&status=eq.Pendiente&reminded_at=is.null`,
            { method: 'PATCH', body: JSON.stringify({ reminded_at: remindedAt, updated_at: remindedAt }) }
          );
          sent += 1;
        } catch (error) {
          console.error('No pudimos enviar un recordatorio automático.', error);
          failed += 1;
        }
      }
    }
    return json({ ok: true, checkedOrders: orders.length, dueOrders: dueOrders.length, sent, failed });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos procesar los recordatorios automáticos.' }, 500);
  }
}

export default { fetch: handler };
