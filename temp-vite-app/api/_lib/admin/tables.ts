import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';

type TableRow = {
  id: string;
  name: string;
  capacity: number;
  note: string;
};

type AssignmentRow = {
  id: string;
  table_id: string | null;
  confirmed?: number;
};

const clientTable = (row: TableRow, assignments: AssignmentRow[] = []) => ({
  id: row.id,
  name: row.name,
  capacity: row.capacity,
  note: row.note,
  guests: assignments.filter((guest) => guest.table_id === row.id).map((guest) => guest.id)
});

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method !== 'GET' && session.access_role === 'viewer') return json({ error: 'Tu acceso es de solo lectura.' }, 403);

    if (request.method === 'GET') {
      const [tablesResponse, assignmentsResponse] = await Promise.all([
        supabaseRequest(`event_tables?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,name,capacity,note&order=created_at.asc`),
        supabaseRequest(`event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=not.is.null&select=id,table_id`)
      ]);
      const tables = await tablesResponse.json() as TableRow[];
      const assignments = await assignmentsResponse.json() as AssignmentRow[];
      return json({ tables: tables.map((table) => clientTable(table, assignments)) });
    }

    const body = await request.json() as Record<string, unknown>;
    if (request.method === 'POST') {
      const name = String(body.name || '').trim();
      const capacity = Math.max(1, Math.min(30, Number(body.capacity) || 8));
      if (!name) return json({ error: 'Ingresá un nombre o número para la mesa.' }, 400);
      const response = await supabaseRequest('event_tables', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          order_number: session.order_number,
          name,
          capacity,
          note: String(body.note || '').trim()
        })
      });
      return json({ table: clientTable(((await response.json()) as TableRow[])[0]) }, 201);
    }

    if (request.method === 'PATCH' && body.action === 'assign') {
      const guestId = String(body.guestId || '');
      const tableId = String(body.tableId || '');
      if (tableId) {
        const [tableResponse, guestResponse, occupantsResponse] = await Promise.all([
          supabaseRequest(
            `event_tables?id=eq.${encodeURIComponent(tableId)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=id,capacity&limit=1`
          ),
          supabaseRequest(
            `event_guests?id=eq.${encodeURIComponent(guestId)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Confirmado&select=id,confirmed,table_id&limit=1`
          ),
          supabaseRequest(
            `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=eq.${encodeURIComponent(tableId)}&status=eq.Confirmado&select=id,confirmed`
          )
        ]);
        const table = (await tableResponse.json() as Pick<TableRow, 'id' | 'capacity'>[])[0];
        const guest = (await guestResponse.json() as AssignmentRow[])[0];
        if (!table) {
          return json({ error: 'La mesa seleccionada no pertenece a este evento.' }, 400);
        }
        if (!guest) {
          return json({ error: 'El invitado debe estar confirmado para asignarle una mesa.' }, 400);
        }
        const occupied = (await occupantsResponse.json() as AssignmentRow[])
          .filter((occupant) => occupant.id !== guestId)
          .reduce((total, occupant) => total + Number(occupant.confirmed || 0), 0);
        if (occupied + Number(guest.confirmed || 0) > table.capacity) {
          return json({ error: `No hay lugar suficiente en esta mesa. Quedan ${Math.max(0, table.capacity - occupied)} lugares.` }, 409);
        }
      }
      const response = await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(guestId)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Confirmado`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ table_id: tableId || null, updated_at: new Date().toISOString() })
        }
      );
      if (!(await response.json() as AssignmentRow[])[0]) {
        return json({ error: 'El invitado debe estar confirmado para asignarle una mesa.' }, 400);
      }
      return json({ ok: true });
    }

    if (request.method === 'PATCH') {
      const id = String(body.id || '');
      const name = String(body.name || '').trim();
      const capacity = Math.max(1, Math.min(30, Number(body.capacity) || 8));
      const occupantsResponse = await supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=eq.${encodeURIComponent(id)}&status=eq.Confirmado&select=confirmed`
      );
      const occupied = (await occupantsResponse.json() as AssignmentRow[])
        .reduce((total, occupant) => total + Number(occupant.confirmed || 0), 0);
      if (capacity < occupied) {
        return json({ error: `La mesa ya tiene ${occupied} personas. Quitá invitados antes de reducir su capacidad.` }, 409);
      }
      const response = await supabaseRequest(
        `event_tables?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            name,
            capacity,
            note: String(body.note || '').trim(),
            updated_at: new Date().toISOString()
          })
        }
      );
      const rows = await response.json() as TableRow[];
      if (!rows[0]) return json({ error: 'No encontramos esa mesa.' }, 404);
      return json({ table: clientTable(rows[0]) });
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      await supabaseRequest(
        `event_tables?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: 'DELETE' }
      );
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar la organización de mesas.' }, 500);
  }
}

export default { fetch: handler };
