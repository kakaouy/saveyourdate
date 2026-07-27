import { findSession, readSessionToken } from '../_lib/admin-auth.js';
import { json, supabaseRequest } from '../_lib/orders.js';

type GuestRow = {
  id: string; name: string; group_name: string; phone: string; seats: number;
  confirmed: number; status: 'Confirmado' | 'Pendiente' | 'No asiste';
  food: string; song: string; reminded_at: string | null;
};

const clientGuest = (row: GuestRow) => ({
  id: row.id,
  name: row.name,
  group: row.group_name,
  phone: row.phone,
  seats: row.seats,
  confirmed: row.confirmed,
  status: row.status,
  food: row.food,
  song: row.song,
  reminded: row.reminded_at || '—'
});

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method === 'GET') {
      const response = await supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&select=*&order=created_at.asc`
      );
      return json({ guests: ((await response.json()) as GuestRow[]).map(clientGuest) });
    }
    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const name = String(body.name || '').trim();
      if (!name) return json({ error: 'Ingresá el nombre del invitado.' }, 400);
      const response = await supabaseRequest('event_guests', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          order_number: session.order_number,
          name,
          group_name: String(body.group || '').trim(),
          email: String(body.email || '').trim().toLowerCase(),
          phone: String(body.phone || '').trim(),
          seats: Math.max(1, Math.min(20, Number(body.seats) || 1))
        })
      });
      return json({ guest: clientGuest(((await response.json()) as GuestRow[])[0]) }, 201);
    }
    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: 'DELETE' }
      );
      return json({ ok: true });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar los invitados.' }, 500);
  }
}

export default { fetch: handler };
