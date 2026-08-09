import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';
import { canAssignGuest, occupiedSeats } from './capacity.js';

type TableRow = {
  id: string;
  name: string;
  capacity: number;
  note: string;
  space_name?: string;
  position_x?: number;
  position_y?: number;
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
  space: row.space_name || 'Espacio 1',
  x: Number(row.position_x ?? 24),
  y: Number(row.position_y ?? 24),
  guests: assignments.filter((guest) => guest.table_id === row.id).map((guest) => guest.id)
});

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method !== 'GET' && session.access_role === 'viewer') return json({ error: 'Tu acceso es de solo lectura.' }, 403);

    if (request.method === 'GET') {
      const [tablesResponse, assignmentsResponse] = await Promise.all([
        supabaseRequest(`event_tables?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,name,capacity,note,space_name,position_x,position_y&order=created_at.asc`),
        supabaseRequest(`event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=not.is.null&select=id,table_id`)
      ]);
      const tables = await tablesResponse.json() as TableRow[];
      const assignments = await assignmentsResponse.json() as AssignmentRow[];
      return json({ tables: tables.map((table) => clientTable(table, assignments)) });
    }

    const body = await request.json() as Record<string, unknown>;
    if (request.method === 'PATCH' && body.action === 'layout') {
      const id = String(body.id || '');
      const response = await supabaseRequest(
        `event_tables?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            space_name: String(body.space || 'Espacio 1').trim() || 'Espacio 1',
            position_x: Math.max(0, Math.min(840, Number(body.x) || 0)),
            position_y: Math.max(0, Math.min(440, Number(body.y) || 0)),
            updated_at: new Date().toISOString(),
          }),
        },
      );
      const rows = await response.json() as TableRow[];
      if (!rows[0]) return json({ error: 'No encontramos esa mesa.' }, 404);
      return json({ table: clientTable(rows[0]) });
    }
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
      const createdTable = ((await response.json()) as TableRow[])[0];
      await logAdminActivity(session, 'table.created', 'table', createdTable.id, { name: createdTable.name, capacity: createdTable.capacity });
      return json({ table: clientTable(createdTable) }, 201);
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
        const occupants = await occupantsResponse.json() as AssignmentRow[];
        const occupied = occupiedSeats(occupants, guestId);
        if (!canAssignGuest(table.capacity, occupants, guestId, Number(guest.confirmed || 0))) {
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
      await logAdminActivity(session, tableId ? 'table.guest_assigned' : 'table.guest_unassigned', 'guest', guestId, { tableId: tableId || null });
      return json({ ok: true });
    }

    if (request.method === 'PATCH') {
      const id = String(body.id || '');
      const name = String(body.name || '').trim();
      const capacity = Math.max(1, Math.min(30, Number(body.capacity) || 8));
      const occupantsResponse = await supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=eq.${encodeURIComponent(id)}&status=eq.Confirmado&select=confirmed`
      );
      const occupied = occupiedSeats(await occupantsResponse.json() as AssignmentRow[]);
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
      await logAdminActivity(session, 'table.updated', 'table', rows[0].id, { name: rows[0].name, capacity: rows[0].capacity });
      return json({ table: clientTable(rows[0]) });
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      await supabaseRequest(
        `event_tables?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: 'DELETE' }
      );
      await logAdminActivity(session, 'table.deleted', 'table', id);
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar la organización de mesas.' }, 500);
  }
}

export default { fetch: handler };
