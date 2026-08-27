import { findSession, readSessionToken } from '../admin-auth.js';
import { validateBackup } from '../backup-validation.js';
import { json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

const countRows = async (table: string, orderNumber: string) => {
  const response = await supabaseRequest(
    `${table}?order_number=eq.${encodeURIComponent(orderNumber)}&select=id`
  );
  return (await response.json() as Array<{ id: string }>).length;
};

const countLayoutSpaces = async (orderNumber: string) => {
  const response = await supabaseRequest(`event_layout_spaces?order_number=eq.${encodeURIComponent(orderNumber)}&select=space_name`);
  return (await response.json() as Array<{ space_name: string }>).length;
};

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  let restoringOrderNumber = '';
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (session.access_role !== 'owner') return json({ error: 'Sólo el propietario puede restaurar respaldos.' }, 403);
    const body = await request.json() as Record<string, unknown>;
    const validation = validateBackup(body.backup, session.order_number);
    if ('error' in validation) return json({ error: validation.error }, 400);
    const [guestCount, tableCount, elementCount, spaceCount, collaboratorCount] = await Promise.all([
      countRows('event_guests', session.order_number),
      countRows('event_tables', session.order_number),
      countRows('event_layout_elements', session.order_number),
      countLayoutSpaces(session.order_number),
      countRows('event_admins', session.order_number)
    ]);
    const summary = {
      guests: validation.guests.length,
      tables: validation.tables.length,
      layoutElements: validation.layoutElements.length,
      layoutSpaces: validation.layoutSpaces.length,
      collaborators: validation.collaborators.length
    };
    if (body.apply !== true) {
      return json({ valid: true, canRestore: guestCount + tableCount + elementCount + spaceCount + collaboratorCount === 0, current: { guests: guestCount, tables: tableCount, layoutElements: elementCount, layoutSpaces: spaceCount, collaborators: collaboratorCount }, summary });
    }
    if (guestCount + tableCount + elementCount + spaceCount + collaboratorCount > 0) {
      return json({ error: 'El evento contiene datos. Para evitar sobrescrituras, la restauración sólo se permite sobre un evento vacío.' }, 409);
    }
    if (String(body.confirmation || '').trim().toUpperCase() !== session.order_number) {
      return json({ error: 'Escribí el número de pedido completo para confirmar.' }, 400);
    }
    restoringOrderNumber = session.order_number;
    if (validation.tables.length) {
      await supabaseRequest('event_tables', {
        method: 'POST',
        body: JSON.stringify(validation.tables.map((table) => ({
          id: String(table.id),
          order_number: session.order_number,
          name: String(table.name).trim().slice(0, 120),
          capacity: Number(table.capacity),
          note: String(table.note || '').trim().slice(0, 500),
          space_name: String(table.space_name || 'Espacio 1').trim().slice(0, 120),
          position_x: Math.max(0, Number(table.position_x) || 24),
          position_y: Math.max(0, Number(table.position_y) || 24),
          layout_width: Math.max(100, Number(table.layout_width) || 140),
          layout_height: Math.max(60, Number(table.layout_height) || 70),
          table_shape: ['round', 'rectangular', 'square', 'living'].includes(String(table.table_shape)) ? table.table_shape : 'round',
          rotation_degrees: Number(table.rotation_degrees) || 0,
          is_locked: Boolean(table.is_locked)
        })))
      });
    }
    if (validation.layoutSpaces.length) {
      await supabaseRequest('event_layout_spaces', { method: 'POST', body: JSON.stringify(validation.layoutSpaces.map((space) => ({ order_number: session.order_number, space_name: String(space.space_name).trim().slice(0, 120), canvas_width: Math.max(700, Math.min(2400, Number(space.canvas_width) || 1200)), canvas_height: Math.max(480, Math.min(1800, Number(space.canvas_height) || 700)) }))) });
    }
    if (validation.layoutElements.length) {
      await supabaseRequest('event_layout_elements', { method: 'POST', body: JSON.stringify(validation.layoutElements.map((element) => ({ id: String(element.id), order_number: session.order_number, element_type: String(element.element_type || 'custom'), label: String(element.label).trim().slice(0, 120), space_name: String(element.space_name || 'Espacio 1').trim().slice(0, 120), position_x: Math.max(0, Number(element.position_x) || 0), position_y: Math.max(0, Number(element.position_y) || 0), element_width: Math.max(90, Math.min(420, Number(element.element_width) || 150)), element_height: Math.max(55, Math.min(260, Number(element.element_height) || 80)), rotation_degrees: Number(element.rotation_degrees) || 0 }))) });
    }
    if (validation.guests.length) {
      await supabaseRequest('event_guests', {
        method: 'POST',
        body: JSON.stringify(validation.guests.map((guest) => ({
          id: String(guest.id),
          ...(guest.invite_token ? { invite_token: String(guest.invite_token) } : {}),
          order_number: session.order_number,
          name: String(guest.name).trim().slice(0, 120),
          group_name: String(guest.group_name || '').trim().slice(0, 120),
          email: String(guest.email || '').trim().toLowerCase().slice(0, 254),
          phone: String(guest.phone || '').trim().slice(0, 30),
          phone_country_code: String(guest.phone_country_code || '+598').trim().slice(0, 6),
          identification_type: String(guest.identification_type || '').trim().slice(0, 30),
          identification_number: String(guest.identification_number || '').trim().slice(0, 80),
          seats: Number(guest.seats),
          confirmed: Number(guest.confirmed),
          status: ['Confirmado', 'Pendiente', 'No asiste'].includes(String(guest.status)) ? guest.status : 'Pendiente',
          food: String(guest.food || '—').trim().slice(0, 250),
          song: String(guest.song || '—').trim().slice(0, 250),
          companions: Array.isArray(guest.companions) ? guest.companions : [],
          table_id: guest.table_id ? String(guest.table_id) : null,
          seat_number: guest.seat_number ? Number(guest.seat_number) : null,
          reminded_at: guest.reminded_at || null,
          invitation_sent_at: guest.invitation_sent_at || null,
          invitation_opened_at: guest.invitation_opened_at || null,
          responded_at: guest.responded_at || null,
          archived_at: guest.archived_at || null,
          checked_in_at: guest.checked_in_at || null,
          transport_option: String(guest.transport_option || '').slice(0, 80),
          transport_stop: String(guest.transport_stop || '').slice(0, 160),
          menu_choice: String(guest.menu_choice || '').slice(0, 120),
          accessibility_needs: String(guest.accessibility_needs || '').slice(0, 500),
          guest_notes: String(guest.guest_notes || '').slice(0, 1000),
          guest_type: ['adult', 'teen', 'child'].includes(String(guest.guest_type)) ? guest.guest_type : 'adult',
          social_together_with: String(guest.social_together_with || '').trim().slice(0, 120),
          social_separate_from: String(guest.social_separate_from || '').trim().slice(0, 120),
          preferred_table_name: String(guest.preferred_table_name || '').trim().slice(0, 120),
          invited_by: String(guest.invited_by || '').trim().slice(0, 120),
          companion_of_id: guest.companion_of_id ? String(guest.companion_of_id) : null
        })))
      });
    }
    if (validation.collaborators.length) {
      await supabaseRequest('event_admins', {
        method: 'POST',
        body: JSON.stringify(validation.collaborators.map((access) => ({
          order_number: session.order_number,
          email: String(access.email || '').trim().toLowerCase().slice(0, 254),
          role: access.role === 'viewer' ? 'viewer' : 'editor'
        })).filter((access) => access.email))
      });
    }
    await logAdminActivity(session, 'backup.restored', 'backup', session.order_number, summary);
    restoringOrderNumber = '';
    return json({ ok: true, summary });
  } catch (error) {
    console.error(error);
    if (restoringOrderNumber) {
      try {
        await supabaseRequest(`event_guests?order_number=eq.${encodeURIComponent(restoringOrderNumber)}`, { method: 'DELETE' });
        await supabaseRequest(`event_layout_elements?order_number=eq.${encodeURIComponent(restoringOrderNumber)}`, { method: 'DELETE' });
        await supabaseRequest(`event_layout_spaces?order_number=eq.${encodeURIComponent(restoringOrderNumber)}`, { method: 'DELETE' });
        await supabaseRequest(`event_tables?order_number=eq.${encodeURIComponent(restoringOrderNumber)}`, { method: 'DELETE' });
        await supabaseRequest(`event_admins?order_number=eq.${encodeURIComponent(restoringOrderNumber)}`, { method: 'DELETE' });
      } catch (rollbackError) {
        console.error('No pudimos revertir una restauración incompleta.', rollbackError);
      }
    }
    return json({ error: 'No pudimos restaurar el respaldo.' }, 500);
  }
}

export default { fetch: handler };
