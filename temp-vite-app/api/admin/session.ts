import { findSession, readSessionToken } from '../_lib/admin-auth.js';
import { findOrderByNumber, json } from '../_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ authenticated: false }, 401);
    const order = await findOrderByNumber(session.order_number);
    if (!order) return json({ authenticated: false }, 401);
    return json({
      authenticated: true,
      order: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        plan: order.plan,
        modelName: order.model_name
      },
      expiresAt: session.expires_at
    });
  } catch (error) {
    console.error(error);
    return json({ authenticated: false }, 500);
  }
}

export default { fetch: handler };
