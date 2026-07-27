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
        reminderDaysBefore: Math.max(1, Math.min(60, Number(order?.order_payload.reminderDaysBefore) || 7))
      });
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const code = String(body.defaultPhoneCountryCode || '').trim();
      const reminderDaysBefore = Math.max(1, Math.min(60, Number(body.reminderDaysBefore) || 7));
      if (!validCode(code)) return json({ error: 'El código de país no es válido.' }, 400);
      const order = await findOrderByNumber(session.order_number);
      if (!order) return json({ error: 'No encontramos el evento.' }, 404);
      await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(session.order_number)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          default_phone_country_code: code,
          order_payload: { ...order.order_payload, reminderDaysBefore },
          updated_at: new Date().toISOString()
        })
      });
      await logAdminActivity(session, 'settings.updated', 'settings', session.order_number, { defaultPhoneCountryCode: code, reminderDaysBefore });
      return json({ defaultPhoneCountryCode: code, reminderDaysBefore });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos guardar la configuración.' }, 500);
  }
}

export default { fetch: handler };
