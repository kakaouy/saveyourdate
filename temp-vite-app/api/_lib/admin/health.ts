import { findSession, readSessionToken } from '../admin-auth.js';
import { json, supabaseRequest } from '../orders.js';

type ServiceStatus = {
  status: 'ok' | 'error';
  detail: string;
};

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);

  const session = await findSession(readSessionToken(request));
  if (!session) return json({ error: 'Sesión vencida.' }, 401);
  if (session.access_role !== 'owner') return json({ error: 'Sólo el propietario puede ver el estado del sistema.' }, 403);

  const database: ServiceStatus = { status: 'ok', detail: 'Conexión disponible' };
  try {
    await supabaseRequest(
      `orders?order_number=eq.${encodeURIComponent(session.order_number)}&select=order_number&limit=1`
    );
  } catch (error) {
    console.error('Falló el diagnóstico de Supabase.', error);
    database.status = 'error';
    database.detail = 'No responde';
  }

  return json({
    checkedAt: new Date().toISOString(),
    services: {
      database,
      email: {
        status: process.env.RESEND_API_KEY ? 'ok' : 'error',
        detail: process.env.RESEND_API_KEY ? 'Configurado' : 'Falta configuración'
      },
      scheduler: {
        status: process.env.CRON_SECRET ? 'ok' : 'error',
        detail: process.env.CRON_SECRET ? 'Configurado' : 'Falta configuración'
      }
    }
  });
}

export default { fetch: handler };
