import {
  findSession,
  readSessionToken,
  sessionCookie
} from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const session = await findSession(readSessionToken(request));
    if (session) {
      await supabaseRequest(`admin_sessions?id=eq.${encodeURIComponent(session.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ revoked_at: new Date().toISOString() })
      });
    }
    const response = json({ ok: true });
    response.headers.set('Set-Cookie', sessionCookie('', 0));
    return response;
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos cerrar la sesión.' }, 500);
  }
}

export default { fetch: handler };
