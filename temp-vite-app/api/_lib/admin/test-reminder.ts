import { findSession, readSessionToken } from '../admin-auth.js';
import { appUrl, findOrderByNumber, hashToken, json, sendEmail } from '../orders.js';
import { reminderEmailHtml } from '../reminder-email.js';
import { logAdminActivity } from './audit.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (session.access_role !== 'owner') return json({ error: 'Sólo el propietario puede probar recordatorios.' }, 403);
    const order = await findOrderByNumber(session.order_number);
    if (!order) return json({ error: 'No encontramos el evento.' }, 404);
    const eventTitle = String(order.order_payload.eventTitle || order.customer_name);
    const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
    const recipientHash = (await hashToken(session.login_email)).slice(0, 20);
    await sendEmail({
      to: session.login_email,
      subject: `[Prueba] Recordatorio de confirmación · ${eventTitle}`,
      idempotencyKey: `reminder-test-${recipientHash}-${bucket}`,
      html: reminderEmailHtml({
        recipientName: order.customer_name,
        eventTitle,
        actionUrl: `${appUrl()}/admin`,
        isTest: true
      })
    });
    await logAdminActivity(session, 'reminder.test_sent', 'settings', session.order_number);
    return json({ message: `Enviamos la prueba a ${session.login_email}.` });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos enviar el correo de prueba.' }, 500);
  }
}

export default { fetch: handler };
