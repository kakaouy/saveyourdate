import { findSession, readSessionToken } from '../admin-auth.js';
import { findOrderByNumber, json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (session.access_role !== 'owner') return json({ error: 'Sólo el propietario puede descargar respaldos.' }, 403);

    const [order, guestsResponse, tablesResponse, accessesResponse, activityResponse] = await Promise.all([
      findOrderByNumber(session.order_number),
      supabaseRequest(
        `event_guests?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,invite_token,name,group_name,email,phone,phone_country_code,identification_type,identification_number,seats,confirmed,status,food,song,companions,table_id,reminded_at,created_at,updated_at&order=created_at.asc`
      ),
      supabaseRequest(
        `event_tables?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,name,capacity,note,created_at,updated_at&order=created_at.asc`
      ),
      supabaseRequest(
        `event_admins?order_number=eq.${encodeURIComponent(session.order_number)}&select=email,role,created_at&order=created_at.asc`
      ),
      supabaseRequest(
        `admin_activity_log?order_number=eq.${encodeURIComponent(session.order_number)}&select=actor_email,actor_role,action,entity_type,entity_id,details,created_at&order=created_at.asc`
      )
    ]);
    if (!order) return json({ error: 'No encontramos el evento.' }, 404);

    const backup = {
      format: 'save-your-date-admin-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      event: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        whatsapp: order.whatsapp,
        plan: order.plan,
        modelName: order.model_name,
        language: order.language,
        status: order.status,
        invitationUrl: order.invitation_url,
        configuration: order.order_payload
      },
      guests: await guestsResponse.json(),
      tables: await tablesResponse.json(),
      collaborators: await accessesResponse.json(),
      activity: await activityResponse.json()
    };
    await logAdminActivity(session, 'backup.exported', 'backup', session.order_number);
    return json({ backup });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos generar el respaldo.' }, 500);
  }
}

export default { fetch: handler };
