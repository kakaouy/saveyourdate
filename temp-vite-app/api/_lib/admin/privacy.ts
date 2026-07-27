import { findSession, readSessionToken, sessionCookie } from '../admin-auth.js';
import { deleteEventData } from '../delete-event.js';
import { retentionDeadline } from '../event-lifecycle.js';
import { findOrderByNumber, json } from '../orders.js';

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (session.access_role !== 'owner') {
      return json({ error: 'Sólo el propietario puede administrar la eliminación.' }, 403);
    }
    const order = await findOrderByNumber(session.order_number);
    if (!order) return json({ error: 'No encontramos el evento.' }, 404);
    const eventDate = String(order.order_payload.eventDate || '');
    const deadline = retentionDeadline(eventDate);

    if (request.method === 'GET') {
      return json({
        eventDate,
        retentionDays: 30,
        retentionDeadline: deadline?.toISOString() || null
      });
    }
    if (request.method !== 'DELETE') return json({ error: 'Método no permitido.' }, 405);
    const body = await request.json() as Record<string, unknown>;
    if (String(body.confirmation || '').trim().toUpperCase() !== order.order_number) {
      return json({ error: 'Escribí el número de pedido completo para confirmar.' }, 400);
    }
    await deleteEventData(order.order_number, eventDate, 'owner_request');
    const response = json({ ok: true });
    response.headers.set('Set-Cookie', sessionCookie('', 0));
    return response;
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos eliminar los datos del evento.' }, 500);
  }
}

export default { fetch: handler };

