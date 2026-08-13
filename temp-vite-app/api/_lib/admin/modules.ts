import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';

const validModules = new Set(['invitation', 'guests_rsvp', 'tables', 'check_in', 'messaging', 'collaborative_album', 'suppliers']);

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    const eventResponse = await supabaseRequest(`events?order_number=eq.${encodeURIComponent(session.order_number)}&select=owner_account_id&limit=1`);
    const event = ((await eventResponse.json()) as Array<{ owner_account_id: string }>)[0];
    if (!event) return json({ error: 'No encontramos la cuenta del evento.' }, 404);
    const path = `account_modules?account_id=eq.${event.owner_account_id}`;
    if (request.method === 'GET') {
      const response = await supabaseRequest(`${path}&select=module,source,enabled&order=module.asc`);
      return json({ modules: await response.json() });
    }
    if (request.method === 'PATCH') {
      if (!['owner', 'admin'].includes(session.access_role)) return json({ error: 'No tenés permiso para cambiar módulos.' }, 403);
      const body = await request.json() as { module?: string; enabled?: boolean };
      const module = String(body.module || '');
      if (!validModules.has(module) || typeof body.enabled !== 'boolean') return json({ error: 'Configuración inválida.' }, 400);
      const existingResponse = await supabaseRequest(`${path}&module=eq.${encodeURIComponent(module)}&select=module&limit=1`);
      if (!((await existingResponse.json()) as unknown[]).length) return json({ error: 'Este módulo no forma parte del plan contratado.' }, 403);
      await supabaseRequest(`${path}&module=eq.${encodeURIComponent(module)}`, { method: 'PATCH', body: JSON.stringify({ enabled: body.enabled }) });
      return json({ ok: true, module, enabled: body.enabled });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar los módulos.' }, 500);
  }
}

export default { fetch: handler };
