import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    const response = await supabaseRequest(
      `admin_activity_log?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,actor_email,actor_role,action,entity_type,entity_id,details,created_at&order=created_at.desc&limit=30`
    );
    return json({ activities: await response.json() });
  } catch (error) {
    console.error(error);
    return json({ activities: [] });
  }
}

export default { fetch: handler };
