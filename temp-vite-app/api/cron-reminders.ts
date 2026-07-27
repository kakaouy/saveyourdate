import { appUrl, json, sendEmail, supabaseRequest } from './_lib/orders.js';
import { reminderEmailHtml } from './_lib/reminder-email.js';
import { isReminderDue, reminderDaysFor } from './_lib/reminder-rules.js';

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
    const dueOrders = orders.filter((order) => isReminderDue(order.order_payload));

    let sent = 0;
    let failed = 0;
    for (const order of dueOrders) {
      if (sent >= 100) break;
      const guestsResponse = await supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(order.order_number)}&status=eq.Pendiente&email=neq.&reminded_at=is.null&select=id,invite_token,name,email&order=created_at.asc&limit=${100 - sent}`
      );
      const guests = await guestsResponse.json() as PendingGuest[];
      const eventTitle = String(order.order_payload.eventTitle || order.customer_name);
      const daysBefore = reminderDaysFor(order.order_payload);
      for (const guest of guests) {
        try {
          const confirmationUrl = `${appUrl()}/confirmar?token=${encodeURIComponent(guest.invite_token)}`;
          await sendEmail({
            to: guest.email,
            subject: `Recordatorio de confirmación · ${eventTitle}`,
            idempotencyKey: `rsvp-reminder-${guest.id}-${daysBefore}`,
            html: reminderEmailHtml({ recipientName: guest.name, eventTitle, actionUrl: confirmationUrl })
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
