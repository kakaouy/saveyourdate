import { findSession, readSessionToken } from '../admin-auth.js';
import { logAdminActivity } from './audit.js';
import { json, supabaseRequest } from '../orders.js';

type ActivityRow = {
  id: string;
  action: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const communicationActions = [
  'communication.scheduled',
  'communication.cancelled',
  'communication.failed',
  'guest.invitation_prepared',
  'guest.reminder_prepared',
  'guest.communication_prepared',
  'guest.thanked',
  'reminder.auto_sent',
  'reminder.auto_failed',
].join(',');

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method === 'GET') {
      const response = await supabaseRequest(
        `admin_activity_log?order_number=eq.${encodeURIComponent(session.order_number)}&action=in.(${communicationActions})&select=id,action,entity_id,details,created_at&order=created_at.desc&limit=200`,
      );
      const activities = await response.json() as ActivityRow[];
      const cancelled = new Set(activities.filter((item) => item.action === 'communication.cancelled').map((item) => String(item.details?.scheduleId || '')));
      const preparedBySchedule = new Map<string, Set<string>>();
      const failedBySchedule = new Map<string, Set<string>>();
      for (const activity of activities) {
        const scheduleId = String(activity.details?.scheduleId || '');
        if (!scheduleId || !activity.entity_id || activity.action === 'communication.scheduled') continue;
        const target = activity.action === 'communication.failed' ? failedBySchedule : preparedBySchedule;
        const guests = target.get(scheduleId) || new Set<string>();
        guests.add(activity.entity_id);
        target.set(scheduleId, guests);
      }
      const now = Date.now();
      return json({ history: activities.filter((item) => item.action !== 'communication.cancelled').map((item) => {
        const scheduledAt = String(item.details?.scheduledAt || '');
        const isSchedule = item.action === 'communication.scheduled';
        const recipientCount = Number(item.details?.recipientCount || (item.entity_id ? 1 : 0));
        const preparedCount = isSchedule ? preparedBySchedule.get(item.id)?.size || 0 : item.entity_id ? 1 : 0;
        const failedCount = isSchedule ? failedBySchedule.get(item.id)?.size || 0 : item.action.endsWith('failed') ? 1 : 0;
        return {
          id: item.id,
          action: item.action,
          guestId: item.entity_id || '',
          kind: String(item.details?.kind || (item.action.includes('invitation') ? 'invite' : item.action.includes('reminder') ? 'reminder' : item.action.includes('thanked') ? 'thanks' : 'notice')),
          recipientCount,
          preparedCount,
          failedCount,
          pendingCount: Math.max(0, recipientCount - preparedCount - failedCount),
          scheduledAt,
          createdAt: item.created_at,
          status: isSchedule ? cancelled.has(item.id) ? 'cancelled' : recipientCount > 0 && preparedCount >= recipientCount ? 'completed' : scheduledAt && new Date(scheduledAt).getTime() <= now ? 'ready' : 'scheduled' : item.action.endsWith('failed') ? 'failed' : 'prepared',
          title: String(item.details?.title || ''),
          recipientIds: Array.isArray(item.details?.recipientIds) ? item.details.recipientIds.map(String) : [],
          message: String(item.details?.message || ''),
          closing: String(item.details?.closing || ''),
          extraContent: String(item.details?.extraContent || 'none'),
          imageUrl: String(item.details?.imageUrl || ''),
          htmlContent: String(item.details?.htmlContent || ''),
        };
      }) });
    }
    if (request.method === 'POST') {
      if (!['owner', 'admin', 'editor'].includes(session.access_role)) return json({ error: 'No tenés permiso para programar comunicaciones.' }, 403);
      const body = await request.json() as Record<string, unknown>;
      const kind = String(body.kind || '');
      const recipientIds = Array.isArray(body.recipientIds) ? [...new Set(body.recipientIds.map(String).filter(Boolean))].slice(0, 500) : [];
      const scheduledAt = String(body.scheduledAt || '');
      const message = String(body.message || '').trim().slice(0, 3000);
      if (!['invite', 'reminder', 'notice', 'thanks'].includes(kind) || !recipientIds.length || !message || !scheduledAt) return json({ error: 'Completá el tipo, la fecha, el mensaje y los destinatarios.' }, 400);
      const date = new Date(scheduledAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return json({ error: 'Elegí una fecha y hora futuras.' }, 400);
      const before = new Date(Date.now() + 180 * 86400000);
      if (date > before) return json({ error: 'La comunicación puede programarse con hasta 180 días de anticipación.' }, 400);
      const details = {
        kind,
        recipientIds,
        recipientCount: recipientIds.length,
        scheduledAt: date.toISOString(),
        message,
        closing: String(body.closing || '').slice(0, 500),
        extraContent: String(body.extraContent || 'none'),
        imageUrl: String(body.imageUrl || '').slice(0, 1000),
        htmlContent: String(body.htmlContent || '').slice(0, 8000),
        title: String(body.title || '').slice(0, 120),
        delivery: 'manual-whatsapp',
      };
      await logAdminActivity(session, 'communication.scheduled', 'communication', '', details);
      return json({ ok: true, scheduledAt: details.scheduledAt, recipientCount: recipientIds.length });
    }
    if (request.method === 'PATCH') {
      if (!['owner', 'admin', 'editor'].includes(session.access_role)) return json({ error: 'No tenés permiso para cancelar comunicaciones.' }, 403);
      const body = await request.json() as Record<string, unknown>;
      const scheduleId = String(body.scheduleId || '');
      if (!scheduleId) return json({ error: 'Falta identificar la programación.' }, 400);
      if (String(body.action || 'cancel') === 'failed') {
        const guestId = String(body.guestId || '');
        if (!guestId) return json({ error: 'Falta identificar al destinatario.' }, 400);
        await logAdminActivity(session, 'communication.failed', 'guest', guestId, { scheduleId, error: String(body.error || '').slice(0, 500) });
        return json({ ok: true });
      }
      await logAdminActivity(session, 'communication.cancelled', 'communication', '', { scheduleId });
      return json({ ok: true });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos gestionar las comunicaciones.' }, 500);
  }
}

export default { fetch: handler };
