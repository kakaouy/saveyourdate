import { appUrl, emailShell, escapeHtml, json, sendEmail, supabaseRequest } from './_lib/orders.js';
import { reminderEmailHtml } from './_lib/reminder-email.js';
import { isReminderDue, reminderDaysFor } from './_lib/reminder-rules.js';
import { deleteEventData } from './_lib/delete-event.js';
import { daysBeforeRetentionDeadline, eventAccessExpired, retentionDeadline } from './_lib/event-lifecycle.js';

type ReminderOrder = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  order_payload: Record<string, unknown>;
};

type PendingGuest = {
  id: string;
  invite_token: string;
  name: string;
  email: string;
};

const sendCronAlert = async (subject: string, detail: string, key: string) => {
  try {
    await sendEmail({
      to: process.env.ORDER_ADMIN_EMAIL || 'saveyourdate.invite@gmail.com',
      subject,
      idempotencyKey: key,
      html: emailShell(
        'Alerta de recordatorios automáticos',
        `<p>El proceso automático necesita revisión.</p><p><strong>Detalle:</strong> ${escapeHtml(detail)}</p>`
      )
    });
  } catch (alertError) {
    console.error('Tampoco pudimos enviar la alerta operativa.', alertError);
  }
};

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  const secret = process.env.CRON_SECRET || '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'No autorizado.' }, 401);
  }
  try {
    const ordersResponse = await supabaseRequest(
      'orders?status=eq.published&select=order_number,customer_name,customer_email,order_payload&order=created_at.asc&limit=500'
    );
    const orders = await ordersResponse.json() as ReminderOrder[];
    const activeOrders: ReminderOrder[] = [];
    let deleted = 0;
    let privacyNotices = 0;
    for (const order of orders) {
      const eventDate = String(order.order_payload.eventDate || '');
      if (eventAccessExpired(order.order_payload)) {
        await deleteEventData(order.order_number, eventDate, 'retention_expired');
        deleted += 1;
        continue;
      }
      activeOrders.push(order);
      const noticeDays = daysBeforeRetentionDeadline(order.order_payload);
      if (noticeDays === 30 || noticeDays === 7) {
        const deadline = retentionDeadline(eventDate);
        await sendEmail({
          to: order.customer_email,
          subject: `Aviso de privacidad · ${noticeDays} días para descargar tus datos`,
          idempotencyKey: `privacy-retention-${order.order_number}-${noticeDays}`,
          html: emailShell(
            'Tu evento se eliminará próximamente',
            `<p>Por privacidad, los datos del pedido <strong>${escapeHtml(order.order_number)}</strong> se eliminarán el <strong>${deadline?.toISOString().slice(0, 10)}</strong>.</p>
             <p>Antes de esa fecha podés ingresar al panel y descargar un respaldo JSON. Al vencer el plazo se deshabilitarán por completo el panel, los enlaces y las confirmaciones.</p>`
          )
        });
        privacyNotices += 1;
      }
    }
    const dueOrders = activeOrders.filter((order) => isReminderDue(order.order_payload));

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
    if (failed > 0) {
      await sendCronAlert(
        'Alerta · fallaron recordatorios automáticos',
        `${failed} envío(s) fallaron. Se enviaron correctamente ${sent}.`,
        `cron-reminder-partial-${new Date().toISOString().slice(0, 10)}`
      );
    }
    return json({ ok: true, checkedOrders: orders.length, dueOrders: dueOrders.length, sent, failed, privacyNotices, deleted });
  } catch (error) {
    console.error(error);
    await sendCronAlert(
      'Alerta · no se ejecutaron los recordatorios automáticos',
      error instanceof Error ? error.message : 'Error desconocido.',
      `cron-reminder-failed-${new Date().toISOString().slice(0, 10)}`
    );
    return json({ error: 'No pudimos procesar los recordatorios automáticos.' }, 500);
  }
}

export default { fetch: handler };
