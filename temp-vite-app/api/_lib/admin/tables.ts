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
  layout_width?: number;
  layout_height?: number;
  table_shape?: 'round' | 'rectangular' | 'square';
  rotation_degrees?: number;
  is_locked?: boolean;
};

type LayoutElementRow = {
  id: string;
  element_type: string;
  label: string;
  space_name: string;
  position_x: number;
  position_y: number;
  element_width: number;
  element_height: number;
};

type SpaceSettingRow = { space_name: string; canvas_width: number; canvas_height: number };

type AssignmentRow = {
  id: string;
  table_id: string | null;
  confirmed?: number;
  seat_number?: number | null;
};

const clientTable = (row: TableRow, assignments: AssignmentRow[] = []) => ({
  id: row.id,
  name: row.name,
  capacity: row.capacity,
  note: row.note,
  space: row.space_name || 'Espacio 1',
  x: Number(row.position_x ?? 24),
  y: Number(row.position_y ?? 24),
  width: Number(row.layout_width ?? 140),
  height: Number(row.layout_height ?? 70),
  shape: row.table_shape || 'round',
  rotation: Number(row.rotation_degrees || 0),
  locked: Boolean(row.is_locked),
  guests: assignments.filter((guest) => guest.table_id === row.id).map((guest) => guest.id)
  ,seatAssignments: Object.fromEntries(
    assignments
      .filter((guest) => guest.table_id === row.id && guest.seat_number)
      .map((guest) => [guest.id, Number(guest.seat_number)]),
  )
});

const clientElement = (row: LayoutElementRow) => ({ id: row.id, kind: row.element_type, label: row.label, space: row.space_name, x: Number(row.position_x), y: Number(row.position_y), width: Number(row.element_width), height: Number(row.element_height) });

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method !== 'GET' && session.access_role === 'viewer') return json({ error: 'Tu acceso es de solo lectura.' }, 403);

    if (request.method === 'GET') {
      const [tablesResponse, assignmentsResponse, elementsResponse, spacesResponse] = await Promise.all([
        supabaseRequest(`event_tables?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,name,capacity,note,space_name,position_x,position_y,layout_width,layout_height,table_shape,rotation_degrees,is_locked&order=created_at.asc`),
        supabaseRequest(`event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=not.is.null&select=id,table_id,seat_number`),
        supabaseRequest(`event_layout_elements?order_number=eq.${encodeURIComponent(session.order_number)}&select=*&order=created_at.asc`),
        supabaseRequest(`event_layout_spaces?order_number=eq.${encodeURIComponent(session.order_number)}&select=space_name,canvas_width,canvas_height`),
      ]);
      const tables = await tablesResponse.json() as TableRow[];
      const assignments = await assignmentsResponse.json() as AssignmentRow[];
      const elements = await elementsResponse.json() as LayoutElementRow[];
      const spaces = await spacesResponse.json() as SpaceSettingRow[];
      return json({ tables: tables.map((table) => clientTable(table, assignments)), layoutElements: elements.map(clientElement), layoutSpaces: spaces.map((space) => ({ name: space.space_name, width: Number(space.canvas_width), height: Number(space.canvas_height) })) });
    }

    const body = request.method === 'DELETE'
      ? {} as Record<string, unknown>
      : await request.json() as Record<string, unknown>;
    if (request.method === 'PATCH' && body.action === 'layout') {
      const id = String(body.id || '');
      const response = await supabaseRequest(
        `event_tables?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            space_name: String(body.space || 'Espacio 1').trim() || 'Espacio 1',
            position_x: Math.round(Math.max(0, Math.min(840, Number(body.x) || 0))),
            position_y: Math.round(Math.max(0, Math.min(440, Number(body.y) || 0))),
            layout_width: Math.round(Math.max(100, Math.min(300, Number(body.width) || 140))),
            layout_height: Math.round(Math.max(60, Math.min(180, Number(body.height) || 70))),
            rotation_degrees: Math.round(Number(body.rotation) || 0) % 360,
            is_locked: Boolean(body.locked),
            updated_at: new Date().toISOString(),
          }),
        },
      );
      const rows = await response.json() as TableRow[];
      if (!rows[0]) return json({ error: 'No encontramos esa mesa.' }, 404);
      return json({ table: clientTable(rows[0]) });
    }
    if (request.method === 'PATCH' && body.action === 'space-settings') {
      const spaceName = String(body.space || 'Espacio 1').trim() || 'Espacio 1';
      const response = await supabaseRequest('event_layout_spaces?on_conflict=order_number,space_name', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ order_number: session.order_number, space_name: spaceName, canvas_width: Math.round(Math.max(700, Math.min(2400, Number(body.width) || 1200))), canvas_height: Math.round(Math.max(480, Math.min(1800, Number(body.height) || 700))), updated_at: new Date().toISOString() }),
      });
      const row = ((await response.json()) as SpaceSettingRow[])[0];
      return json({ space: { name: row.space_name, width: Number(row.canvas_width), height: Number(row.canvas_height) } });
    }
    if (body.action === 'layout-element' && request.method === 'POST') {
      const response = await supabaseRequest('event_layout_elements', {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({
          order_number: session.order_number,
          element_type: String(body.kind || 'custom'), label: String(body.label || 'Texto editable').trim().slice(0, 120), space_name: String(body.space || 'Espacio 1'),
          position_x: Math.round(Number(body.x) || 0), position_y: Math.round(Number(body.y) || 0), element_width: Math.round(Number(body.width) || 150), element_height: Math.round(Number(body.height) || 80),
        }),
      });
      const row = ((await response.json()) as LayoutElementRow[])[0];
      return json({ element: clientElement(row) }, 201);
    }
    if (body.action === 'layout-element' && request.method === 'PATCH') {
      const id = String(body.id || '');
      const response = await supabaseRequest(`event_layout_elements?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({
          label: String(body.label || '').trim().slice(0, 120) || 'Texto editable', space_name: String(body.space || 'Espacio 1'),
          position_x: Math.round(Math.max(0, Number(body.x) || 0)), position_y: Math.round(Math.max(0, Number(body.y) || 0)), element_width: Math.round(Math.max(90, Math.min(420, Number(body.width) || 150))), element_height: Math.round(Math.max(55, Math.min(260, Number(body.height) || 80))), updated_at: new Date().toISOString(),
        }),
      });
      const row = ((await response.json()) as LayoutElementRow[])[0];
      if (!row) return json({ error: 'No encontramos ese elemento.' }, 404);
      return json({ element: clientElement(row) });
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
          ,table_shape: ['round', 'rectangular', 'square'].includes(String(body.shape)) ? String(body.shape) : 'round'
        })
      });
      const createdTable = ((await response.json()) as TableRow[])[0];
      await logAdminActivity(session, 'table.created', 'table', createdTable.id, { name: createdTable.name, capacity: createdTable.capacity });
      return json({ table: clientTable(createdTable) }, 201);
    }

    if (request.method === 'PATCH' && body.action === 'assign') {
      const guestId = String(body.guestId || '');
      const tableId = String(body.tableId || '');
      const seatNumber = Math.max(0, Math.round(Number(body.seatNumber) || 0));
      if (tableId) {
        const [tableResponse, guestResponse, occupantsResponse, individualRowsResponse] = await Promise.all([
          supabaseRequest(
            `event_tables?id=eq.${encodeURIComponent(tableId)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=id,capacity&limit=1`
          ),
          supabaseRequest(
            `event_guests?id=eq.${encodeURIComponent(guestId)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Confirmado&select=id,confirmed,table_id,seat_number&limit=1`
          ),
          supabaseRequest(
            `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&table_id=eq.${encodeURIComponent(tableId)}&status=eq.Confirmado&select=id,confirmed,seat_number`
          ),
          supabaseRequest(
            `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&companion_of_id=not.is.null&select=id&limit=1`
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
        const usesIndividualRows = (await individualRowsResponse.json() as Array<{ id: string }>).length > 0;
        const occupants = (await occupantsResponse.json() as AssignmentRow[]).map((occupant) => ({
          ...occupant,
          confirmed: usesIndividualRows ? 1 : occupant.confirmed,
        }));
        const guestSize = usesIndividualRows ? 1 : Number(guest.confirmed || 0);
        const occupied = occupiedSeats(occupants, guestId);
        if (!canAssignGuest(table.capacity, occupants, guestId, guestSize)) {
          return json({ error: `No hay lugar suficiente en esta mesa. Quedan ${Math.max(0, table.capacity - occupied)} lugares.` }, 409);
        }
        if (seatNumber) {
          const guestSeats = Math.max(1, guestSize);
          if (seatNumber + guestSeats - 1 > table.capacity) {
            return json({ error: `El grupo necesita ${guestSeats} asientos consecutivos desde esa posición.` }, 409);
          }
          const requestedSeats = new Set(
            Array.from({ length: guestSeats }, (_, index) => seatNumber + index),
          );
          const overlaps = occupants
            .filter((occupant) => occupant.id !== guestId && occupant.seat_number)
            .some((occupant) =>
              Array.from(
                { length: Math.max(1, Number(occupant.confirmed || 0)) },
                (_, index) => Number(occupant.seat_number) + index,
              ).some((seat) => requestedSeats.has(seat)),
            );
          if (overlaps) return json({ error: 'Uno o más asientos seleccionados ya están ocupados.' }, 409);
        }
      }
      const response = await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(guestId)}&order_number=eq.${encodeURIComponent(session.order_number)}&status=eq.Confirmado`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ table_id: tableId || null, seat_number: tableId && seatNumber ? seatNumber : null, updated_at: new Date().toISOString() })
        }
      );
      if (!(await response.json() as AssignmentRow[])[0]) {
        return json({ error: 'El invitado debe estar confirmado para asignarle una mesa.' }, 400);
      }
      await logAdminActivity(session, tableId ? 'table.guest_assigned' : 'table.guest_unassigned', 'guest', guestId, { tableId: tableId || null, seatNumber: seatNumber || null });
      return json({ ok: true });
    }

    if (request.method === 'PATCH' && body.action === 'assign-batch') {
      const assignments = Array.isArray(body.assignments)
        ? body.assignments.map((item) => ({
            guest_id: String((item as Record<string, unknown>).guestId || ''),
            table_id: String((item as Record<string, unknown>).tableId || ''),
          }))
        : [];
      if (!assignments.length || assignments.some((item) => !item.guest_id || !item.table_id)) {
        return json({ error: 'La distribución sugerida está vacía o contiene datos inválidos.' }, 400);
      }
      const response = await supabaseRequest('rpc/assign_event_guests_batch', {
        method: 'POST',
        body: JSON.stringify({
          p_order_number: session.order_number,
          p_assignments: assignments,
        }),
      });
      if (!response.ok) {
        const detail = await response.json() as { message?: string };
        const message = String(detail.message || 'No pudimos aplicar la distribución completa.');
        return json({ error: message }, message.includes('capacidad') ? 409 : 400);
      }
      await logAdminActivity(session, 'table.guests_batch_assigned', 'table', session.order_number, {
        assignments: assignments.length,
      });
      return json({ ok: true, assigned: assignments.length });
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
            table_shape: ['round', 'rectangular', 'square'].includes(String(body.shape)) ? String(body.shape) : 'round',
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
      const url = new URL(request.url);
      const elementId = url.searchParams.get('elementId') || '';
      if (elementId) {
        await supabaseRequest(`event_layout_elements?id=eq.${encodeURIComponent(elementId)}&order_number=eq.${encodeURIComponent(session.order_number)}`, { method: 'DELETE' });
        return json({ ok: true });
      }
      const id = url.searchParams.get('id') || '';
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
