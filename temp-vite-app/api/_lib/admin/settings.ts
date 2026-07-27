import { findSession, readSessionToken } from '../admin-auth.js';
import { findOrderByNumber, json, supabaseRequest } from '../orders.js';

const validCode = (value: string) => /^\+\d{1,4}$/.test(value);

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);

    if (request.method === 'GET') {
      const order = await findOrderByNumber(session.order_number);
      return json({ defaultPhoneCountryCode: order?.default_phone_country_code || '+598' });
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const code = String(body.defaultPhoneCountryCode || '').trim();
      if (!validCode(code)) return json({ error: 'El código de país no es válido.' }, 400);
      await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(session.order_number)}`, {
        method: 'PATCH',
        body: JSON.stringify({ default_phone_country_code: code, updated_at: new Date().toISOString() })
      });
      return json({ defaultPhoneCountryCode: code });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos guardar la configuración.' }, 500);
  }
}

export default { fetch: handler };
