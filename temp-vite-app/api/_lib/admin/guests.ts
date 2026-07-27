import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

type GuestRow = {
  id: string; invite_token: string; name: string; group_name: string; phone: string; phone_country_code: string; seats: number;
  identification_type: string; identification_number: string;
  confirmed: number; status: 'Confirmado' | 'Pendiente' | 'No asiste';
  food: string; song: string; reminded_at: string | null; updated_at: string;
  companions: Array<{ name: string; food: string; identificationType: string; identificationNumber: string }>;
};

const clientGuest = (row: GuestRow) => ({
  id: row.id,
  inviteToken: row.invite_token,
  name: row.name,
  group: row.group_name,
  phone: row.phone,
  phoneCountryCode: row.phone_country_code,
  identificationType: row.identification_type,
  identificationNumber: row.identification_number,
  seats: row.seats,
  confirmed: row.confirmed,
  status: row.status,
  food: row.food,
  song: row.song,
  companions: Array.isArray(row.companions) ? row.companions : [],
  reminded: row.reminded_at || '—',
  updatedAt: row.updated_at
});

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method !== 'GET' && session.access_role === 'viewer') return json({ error: 'Tu acceso es de solo lectura.' }, 403);
    if (request.method === 'GET') {
      const response = await supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&select=*&order=created_at.asc`
      );
      return json({ guests: ((await response.json()) as GuestRow[]).map(clientGuest) });
    }
    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      if (Array.isArray(body.guests)) {
        if (body.guests.length === 0 || body.guests.length > 500) {
          return json({ error: 'El archivo debe contener entre 1 y 500 invitados.' }, 400);
        }
        const fallbackCode = String(body.defaultPhoneCountryCode || '+598').trim();
        const rows = body.guests.map((item) => {
          const guest = item as Record<string, unknown>;
          const name = String(guest.name || '').trim();
          const phoneCountryCode = String(guest.phoneCountryCode || fallbackCode).trim();
          if (!name) throw new Error('Todos los invitados deben tener nombre.');
          if (!/^\+\d{1,4}$/.test(phoneCountryCode)) throw new Error(`Código de país inválido para ${name}.`);
          const phoneDigits = String(guest.phone || '').replace(/\D/g, '').replace(/^0+/, '');
          return {
            order_number: session.order_number,
            name,
            group_name: String(guest.group || '').trim(),
            email: String(guest.email || '').trim().toLowerCase(),
            phone: phoneDigits ? `${phoneCountryCode}${phoneDigits}` : '',
            phone_country_code: phoneCountryCode,
            identification_type: String(guest.identificationType || '').trim(),
            identification_number: String(guest.identificationNumber || '').trim(),
            seats: Math.max(1, Math.min(20, Number(guest.seats) || 1))
          };
        });
        const response = await supabaseRequest('event_guests', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(rows)
        });
        const createdGuests = (await response.json()) as GuestRow[];
        await logAdminActivity(session, 'guests.imported', 'guest', '', { count: createdGuests.length });
        return json({ guests: createdGuests.map(clientGuest) }, 201);
      }
      const name = String(body.name || '').trim();
      if (!name) return json({ error: 'Ingresá el nombre del invitado.' }, 400);
      const phoneCountryCode = String(body.phoneCountryCode || '+598').trim();
      const phoneDigits = String(body.phone || '').replace(/\D/g, '').replace(/^0+/, '');
      if (!/^\+\d{1,4}$/.test(phoneCountryCode)) return json({ error: 'El código de país no es válido.' }, 400);
      const response = await supabaseRequest('event_guests', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          order_number: session.order_number,
          name,
          group_name: String(body.group || '').trim(),
          email: String(body.email || '').trim().toLowerCase(),
          phone: phoneDigits ? `${phoneCountryCode}${phoneDigits}` : '',
          phone_country_code: phoneCountryCode,
          identification_type: String(body.identificationType || '').trim(),
          identification_number: String(body.identificationNumber || '').trim(),
          seats: Math.max(1, Math.min(20, Number(body.seats) || 1))
        })
      });
      const createdGuest = ((await response.json()) as GuestRow[])[0];
      await logAdminActivity(session, 'guest.created', 'guest', createdGuest.id, { name: createdGuest.name });
      return json({ guest: clientGuest(createdGuest) }, 201);
    }
    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const id = String(body.id || '');
      if (body.action === 'remind') {
        if (!id) return json({ error: 'Falta identificar al invitado.' }, 400);
        const remindedAt = new Date().toISOString();
        const response = await supabaseRequest(
          `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Pendiente`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({ reminded_at: remindedAt, updated_at: remindedAt })
          }
        );
        const rows = await response.json() as GuestRow[];
        if (!rows[0]) return json({ error: 'El invitado ya respondió o no existe.' }, 404);
        await logAdminActivity(session, 'guest.reminded', 'guest', rows[0].id, { name: rows[0].name });
        return json({ guest: clientGuest(rows[0]) });
      }
      const status = String(body.status || '');
      if (!id || !['Confirmado', 'Pendiente', 'No asiste'].includes(status)) {
        return json({ error: 'Los datos de la confirmación no son válidos.' }, 400);
      }
      const guestResponse = await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=seats,phone,phone_country_code,identification_type,identification_number`
      );
      const existingGuests = await guestResponse.json() as Pick<GuestRow, 'seats'>[];
      if (!existingGuests[0]) return json({ error: 'No encontramos ese invitado.' }, 404);
      const confirmed = status === 'Confirmado'
        ? Math.max(1, Math.min(existingGuests[0].seats, Number(body.confirmed) || existingGuests[0].seats))
        : 0;
      const phoneCountryCode = String(body.phoneCountryCode || existingGuests[0].phone_country_code || '+598').trim();
      const suppliedPhone = body.phone === undefined ? null : String(body.phone).replace(/\D/g, '').replace(/^0+/, '');
      if (!/^\+\d{1,4}$/.test(phoneCountryCode)) return json({ error: 'El código de país no es válido.' }, 400);
      const response = await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            status,
            confirmed,
            food: String(body.food ?? '—').trim() || '—',
            song: String(body.song ?? '—').trim() || '—',
            phone_country_code: phoneCountryCode,
            phone: suppliedPhone === null ? existingGuests[0].phone : suppliedPhone ? `${phoneCountryCode}${suppliedPhone}` : '',
            identification_type: body.identificationType === undefined ? existingGuests[0].identification_type : String(body.identificationType).trim(),
            identification_number: body.identificationNumber === undefined ? existingGuests[0].identification_number : String(body.identificationNumber).trim(),
            updated_at: new Date().toISOString()
          })
        }
      );
      const rows = await response.json() as GuestRow[];
      if (!rows[0]) return json({ error: 'No encontramos ese invitado.' }, 404);
      await logAdminActivity(session, 'guest.updated', 'guest', rows[0].id, { name: rows[0].name, status: rows[0].status });
      return json({ guest: clientGuest(rows[0]) });
    }
    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: 'DELETE' }
      );
      await logAdminActivity(session, 'guest.deleted', 'guest', id);
      return json({ ok: true });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar los invitados.' }, 500);
  }
}

export default { fetch: handler };
