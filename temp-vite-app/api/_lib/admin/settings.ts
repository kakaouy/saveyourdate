import { findSession, readSessionToken } from '../admin-auth.js';
import { findOrderByNumber, json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

const validCode = (value: string) => /^\+\d{1,4}$/.test(value);

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method !== 'GET' && session.access_role !== 'owner') return json({ error: 'Sólo el propietario puede modificar la configuración.' }, 403);

    if (request.method === 'GET') {
      const order = await findOrderByNumber(session.order_number);
      return json({
        defaultPhoneCountryCode: order?.default_phone_country_code || '+598',
        eventName: String(order?.customer_name || order?.order_payload.eventTitle || ''),
        eventDate: String(order?.order_payload.eventDate || ''),
        reminderDaysBefore: Math.max(1, Math.min(60, Number(order?.order_payload.reminderDaysBefore) || 7)),
        automaticRemindersEnabled: order?.order_payload.automaticRemindersEnabled === true
      });
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const code = String(body.defaultPhoneCountryCode || '').trim();
      const reminderDaysBefore = Math.max(1, Math.min(60, Number(body.reminderDaysBefore) || 7));
      const automaticRemindersEnabled = body.automaticRemindersEnabled === true;
      const eventName = String(body.eventName || '').trim().slice(0, 160);
      const eventDate = String(body.eventDate || '').trim();
      if (!validCode(code)) return json({ error: 'El código de país no es válido.' }, 400);
      if (!eventName) return json({ error: 'Ingresá el nombre que se mostrará en el panel.' }, 400);
      if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return json({ error: 'La fecha del evento no es válida.' }, 400);
      const order = await findOrderByNumber(session.order_number);
      if (!order) return json({ error: 'No encontramos el evento.' }, 404);
      await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(session.order_number)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          default_phone_country_code: code,
          customer_name: eventName,
          order_payload: { ...order.order_payload, eventTitle: eventName, eventDate, reminderDaysBefore, automaticRemindersEnabled },
          updated_at: new Date().toISOString()
        })
      });
      await logAdminActivity(session, 'settings.updated', 'settings', session.order_number, { defaultPhoneCountryCode: code, reminderDaysBefore, automaticRemindersEnabled });
      return json({ defaultPhoneCountryCode: code, eventName, eventDate, reminderDaysBefore, automaticRemindersEnabled });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos guardar la configuración.' }, 500);
  }
}

export default { fetch: handler };
