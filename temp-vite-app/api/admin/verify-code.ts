import {
  codeHash,
  createSession,
  findChallenge,
  sessionCookie,
  updateChallenge
} from '../_lib/admin-auth.js';
import { json } from '../_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const challengeId = String(body.challengeId || '');
    const code = String(body.code || '').replace(/\D/g, '');
    const challenge = await findChallenge(challengeId);
    if (!challenge || challenge.used_at || new Date(challenge.expires_at) <= new Date()) {
      return json({ error: 'El código venció. Solicitá uno nuevo.' }, 410);
    }
    if (challenge.attempts >= 5) return json({ error: 'Se alcanzó el límite de intentos.' }, 429);
    if (code.length !== 6 || await codeHash(challenge.id, code) !== challenge.code_hash) {
      await updateChallenge(challenge.id, { attempts: challenge.attempts + 1 });
      return json({ error: 'El código ingresado no es correcto.' }, 401);
    }
    await updateChallenge(challenge.id, { used_at: new Date().toISOString() });
    const session = await createSession(challenge.order_number);
    const response = json({ ok: true, expiresAt: session.expiresAt });
    response.headers.set('Set-Cookie', sessionCookie(session.token));
    return response;
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos validar el código.' }, 500);
  }
}

export default { fetch: handler };
