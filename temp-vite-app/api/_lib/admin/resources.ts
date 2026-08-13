import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';

const kinds = new Set(['invitation_setup', 'venue', 'schedule', 'supplier', 'copy', 'gifts']);

const resourceAccount = async (email: string, orderNumber: string) => {
  const eventResponse = await supabaseRequest(`events?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,owner_account_id&limit=1`);
  const event = ((await eventResponse.json()) as Array<{ id: string; owner_account_id: string }>)[0];
  if (!event) return null;
  const memberResponse = await supabaseRequest(`account_members?email=eq.${encodeURIComponent(email.toLowerCase())}&select=account_id,role`);
  const members = (await memberResponse.json()) as Array<{ account_id: string; role: string }>;
  if (!members.length) return event.owner_account_id;
  const ids = members.map(({ account_id }) => account_id);
  const accountResponse = await supabaseRequest(`accounts?id=in.(${ids.map(encodeURIComponent).join(',')})&can_manage_multiple_events=eq.true&select=id&limit=1`);
  const reusable = ((await accountResponse.json()) as Array<{ id: string }>)[0];
  return reusable?.id || event.owner_account_id;
};

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    const accountId = await resourceAccount(session.login_email, session.order_number);
    if (!accountId) return json({ error: 'El evento todavía no fue convertido al nuevo sistema.' }, 409);
    if (request.method === 'GET') {
      const kind = new URL(request.url).searchParams.get('kind') || 'invitation_setup';
      if (!kinds.has(kind)) return json({ error: 'Tipo de recurso inválido.' }, 400);
      const response = await supabaseRequest(`account_resources?account_id=eq.${accountId}&kind=eq.${kind}&select=id,kind,name,payload,updated_at&order=name.asc`);
      return json({ resources: await response.json() });
    }
    if (session.access_role === 'viewer') return json({ error: 'Tu acceso es de sólo lectura.' }, 403);
    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const kind = String(body.kind || '');
      const name = String(body.name || '').trim().slice(0, 100);
      const payload = body.payload;
      if (!kinds.has(kind) || !name || !payload || typeof payload !== 'object') return json({ error: 'Completá un nombre y contenido válidos.' }, 400);
      if (JSON.stringify(payload).length > 250_000) return json({ error: 'La configuración es demasiado grande.' }, 413);
      const response = await supabaseRequest('account_resources?on_conflict=account_id,kind,name', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ account_id: accountId, kind, name, payload, created_by_email: session.login_email, updated_at: new Date().toISOString() }) });
      return json({ resource: ((await response.json()) as unknown[])[0] }, 201);
    }
    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      await supabaseRequest(`account_resources?id=eq.${encodeURIComponent(id)}&account_id=eq.${accountId}`, { method: 'DELETE' });
      return json({ ok: true });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar la biblioteca.' }, 500);
  }
}

export default { fetch: handler };
