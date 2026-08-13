import { findSession, readSessionToken } from '../admin-auth.js';
import type { AdminAccessRole } from '../admin-auth.js';
import { findOrderByNumber, json, supabaseRequest } from '../orders.js';

type EventSummary = { id: string; order_number: string | null; name: string; event_date: string | null; owner_account_id: string };

const accessibleEvents = async (loginEmail: string, currentOrderNumber: string) => {
  const memberResponse = await supabaseRequest(`account_members?email=eq.${encodeURIComponent(loginEmail.toLowerCase())}&select=account_id,role`);
  const memberships = (await memberResponse.json()) as Array<{ account_id: string; role: AdminAccessRole }>;
  const accountIds = memberships.map(({ account_id }) => account_id);
  let events: EventSummary[] = [];
  if (accountIds.length) {
    const encoded = accountIds.map(encodeURIComponent).join(',');
    const accessResponse = await supabaseRequest(`event_account_access?account_id=in.(${encoded})&select=event_id,account_id,access_role`);
    const access = (await accessResponse.json()) as Array<{ event_id: string; account_id: string; access_role: AdminAccessRole }>;
    const eventIds = [...new Set(access.map(({ event_id }) => event_id))];
    if (eventIds.length) {
      const eventResponse = await supabaseRequest(`events?id=in.(${eventIds.map(encodeURIComponent).join(',')})&select=id,order_number,name,event_date,owner_account_id&order=event_date.asc.nullslast`);
      events = await eventResponse.json() as EventSummary[];
    }
  }
  const current = await supabaseRequest(`events?order_number=eq.${encodeURIComponent(currentOrderNumber)}&select=id,order_number,name,event_date,owner_account_id&limit=1`);
  const currentEvent = ((await current.json()) as EventSummary[])[0];
  if (currentEvent && !events.some(({ id }) => id === currentEvent.id)) events.unshift(currentEvent);
  return { events, accountIds, memberships };
};

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    const portfolio = await accessibleEvents(session.login_email, session.order_number);
    if (request.method === 'GET') return json({
      events: portfolio.events.map(({ id, order_number, name, event_date }) => ({ id, orderNumber: order_number, name, eventDate: event_date })),
      currentOrderNumber: session.order_number
    });
    if (request.method === 'PATCH') {
      const body = await request.json() as { orderNumber?: string };
      const targetOrder = String(body.orderNumber || '').toUpperCase();
      const event = portfolio.events.find(({ order_number }) => order_number === targetOrder);
      if (!event?.order_number) return json({ error: 'No tenés acceso a ese evento.' }, 403);
      const order = await findOrderByNumber(event.order_number);
      if (!order) return json({ error: 'No encontramos el evento.' }, 404);
      let accessRole: AdminAccessRole = event.order_number === session.order_number ? session.access_role : 'viewer';
      if (portfolio.accountIds.includes(event.owner_account_id)) {
        accessRole = portfolio.memberships.find(({ account_id }) => account_id === event.owner_account_id)?.role || 'viewer';
      } else {
        const accessResponse = await supabaseRequest(`event_account_access?event_id=eq.${event.id}&account_id=in.(${portfolio.accountIds.map(encodeURIComponent).join(',')})&select=access_role&limit=1`);
        accessRole = ((await accessResponse.json()) as Array<{ access_role: AdminAccessRole }>)[0]?.access_role || 'viewer';
      }
      await supabaseRequest(`admin_sessions?id=eq.${session.id}`, { method: 'PATCH', body: JSON.stringify({ order_number: event.order_number, access_role: accessRole }) });
      return json({ ok: true, orderNumber: event.order_number });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos cargar los eventos.' }, 500);
  }
}

export default { fetch: handler };
