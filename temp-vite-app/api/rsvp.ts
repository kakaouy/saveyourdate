import { findOrderByNumber, json, supabaseRequest } from './_lib/orders.js';

type GuestRow = {
  id: string;
  order_number: string;
  name: string;
  group_name: string;
  seats: number;
  confirmed: number;
  status: 'Confirmado' | 'Pendiente' | 'No asiste';
  food: string;
  song: string;
};

const findGuest = async (token: string) => {
  const response = await supabaseRequest(
    `event_guests?invite_token=eq.${encodeURIComponent(token)}&select=id,order_number,name,group_name,seats,confirmed,status,food,song&limit=1`
  );
  const rows = await response.json() as GuestRow[];
  return rows[0] || null;
};

async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
      return json({ error: 'El enlace no es válido.' }, 400);
    }
    const guest = await findGuest(token);
    if (!guest) return json({ error: 'El enlace no existe o fue desactivado.' }, 404);

    if (request.method === 'GET') {
      const order = await findOrderByNumber(guest.order_number);
      if (!order) return json({ error: 'No encontramos el evento.' }, 404);
      return json({
        event: {
          title: String(order.order_payload.eventTitle || order.customer_name),
          date: String(order.order_payload.eventDate || '')
        },
        guest: {
          name: guest.name,
          group: guest.group_name,
          seats: guest.seats,
          confirmed: guest.confirmed,
          status: guest.status,
          food: guest.food,
          song: guest.song
        }
      });
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const status = String(body.status || '');
      if (!['Confirmado', 'No asiste'].includes(status)) {
        return json({ error: 'Elegí si vas a asistir.' }, 400);
      }
      const confirmed = status === 'Confirmado'
        ? Math.max(1, Math.min(guest.seats, Number(body.confirmed) || 1))
        : 0;
      await supabaseRequest(`event_guests?id=eq.${encodeURIComponent(guest.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          confirmed,
          food: String(body.food || '').trim() || 'Ninguna',
          song: String(body.song || '').trim() || '—',
          updated_at: new Date().toISOString()
        })
      });
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos procesar la confirmación.' }, 500);
  }
}

export default { fetch: handler };
