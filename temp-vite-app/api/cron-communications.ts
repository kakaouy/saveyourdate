import { appUrl, json, supabaseRequest } from './_lib/orders.js';
import { normalizeWhatsAppPhone, sendScheduledWhatsAppTemplate } from './_lib/whatsapp.js';
import { decryptEventWhatsAppToken } from './_lib/event-whatsapp-crypto.js';

type Kind = 'invite' | 'reminder' | 'notice' | 'thanks';
type Activity = { id: string; order_number: string; action: string; entity_id: string | null; details: Record<string, unknown>; created_at: string };
type Guest = { id: string; invite_token: string; name: string; phone: string; status: string; archived_at: string | null; invitation_sent_at: string | null };
type Order = { order_number: string; customer_name: string; invitation_url: string | null; order_payload: Record<string, unknown> };
type WhatsAppConnection = { status: string; phone_number_id: string; access_token_ciphertext: string; token_expires_at: string | null };

const actions = ['communication.scheduled', 'communication.cancelled', 'communication.dispatching', 'communication.auto_sent', 'communication.auto_failed'].join(',');
const maxBatch = 100;

const htmlToText = (html: string) => html
  .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

const scheduledMessage = (kind: Kind, details: Record<string, unknown>) => {
  const sections = [String(details.message || '').trim()];
  if (String(details.extraContent || '') === 'html') {
    const text = htmlToText(String(details.htmlContent || ''));
    if (text) sections.push(text);
  }
  if (kind === 'thanks') {
    const bankDetails = String(details.bankDetails || '').trim();
    if (bankDetails) sections.push(`Si querés hacernos un regalo, te dejamos nuestros datos:\n${bankDetails}`);
  }
  return sections.filter(Boolean).join('\n\n').slice(0, 3000);
};

const deterministicUuid = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('').split('');
  hex[12] = '4';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20, 32).join('')}`;
};

const eligible = (kind: Kind, guest: Guest) => {
  if (guest.archived_at || normalizeWhatsAppPhone(guest.phone).length < 8) return false;
  if (kind === 'reminder') return guest.status === 'Pendiente';
  if (kind === 'thanks') return guest.status === 'Confirmado';
  if (kind === 'invite') return guest.status === 'Pendiente' && !guest.invitation_sent_at;
  return true;
};

const activityBody = (activity: Partial<Activity> & { id?: string; order_number: string; action: string; entity_id?: string; details: Record<string, unknown> }) => ({
  ...(activity.id ? { id: activity.id } : {}),
  order_number: activity.order_number,
  actor_email: 'automation@saveyourdate.site',
  actor_role: 'owner',
  action: activity.action,
  entity_type: 'guest',
  entity_id: activity.entity_id || null,
  details: activity.details,
});

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  const secret = process.env.CRON_SECRET || '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'No autorizado.' }, 401);
  try {
    const response = await supabaseRequest(`admin_activity_log?action=in.(${actions})&select=id,order_number,action,entity_id,details,created_at&order=created_at.asc&limit=5000`);
    const activities = await response.json() as Activity[];
    const cancelled = new Set(activities.filter((row) => row.action === 'communication.cancelled').map((row) => String(row.details.scheduleId || '')));
    const schedules = activities.filter((row) => row.action === 'communication.scheduled'
      && row.details.delivery === 'event-whatsapp-business'
      && !cancelled.has(row.id)
      && new Date(String(row.details.scheduledAt || '')).getTime() <= Date.now());
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const diagnostics = new Set<string>();

    for (const schedule of schedules) {
      if (sent + failed >= maxBatch) break;
      const kind = String(schedule.details.kind || '') as Kind;
      if (!['invite', 'reminder', 'notice', 'thanks'].includes(kind)) continue;
      const recipientIds = Array.isArray(schedule.details.recipientIds) ? schedule.details.recipientIds.map(String) : [];
      const terminal = activities.filter((row) => String(row.details.scheduleId || '') === schedule.id);
      const orderResponse = await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(schedule.order_number)}&select=order_number,customer_name,invitation_url,order_payload&limit=1`);
      const order = (await orderResponse.json() as Order[])[0];
      if (!order) continue;
      const connectionResponse = await supabaseRequest(`event_whatsapp_connections?order_number=eq.${encodeURIComponent(schedule.order_number)}&status=eq.connected&select=status,phone_number_id,access_token_ciphertext,token_expires_at&limit=1`);
      const eventConnection = (await connectionResponse.json() as WhatsAppConnection[])[0];
      const connectionExpired = eventConnection?.token_expires_at && new Date(eventConnection.token_expires_at).getTime() <= Date.now();
      if (!eventConnection?.phone_number_id || !eventConnection.access_token_ciphertext || connectionExpired) {
        diagnostics.add(connectionExpired ? `Conexión de WhatsApp vencida para ${schedule.order_number}` : `WhatsApp no conectado para ${schedule.order_number}`);
        continue;
      }
      let eventAccessToken = '';
      try {
        eventAccessToken = await decryptEventWhatsAppToken(eventConnection.access_token_ciphertext, schedule.order_number);
      } catch {
        diagnostics.add(`No pudimos abrir la conexión de WhatsApp de ${schedule.order_number}`);
        continue;
      }
      const eventTitle = String(order.order_payload.eventTitle || order.customer_name || 'tu evento');
      for (const guestId of recipientIds) {
        if (sent + failed >= maxBatch) break;
        if (terminal.some((row) => row.entity_id === guestId && row.action === 'communication.auto_sent')) continue;
        const failures = terminal.filter((row) => row.entity_id === guestId && row.action === 'communication.auto_failed').length;
        if (failures >= 3) continue;
        const attempt = failures + 1;
        const claimId = await deterministicUuid(`${schedule.id}:${guestId}:${attempt}`);
        if (terminal.some((row) => row.id === claimId && row.action === 'communication.dispatching' && !terminal.some((candidate) => candidate.entity_id === guestId && candidate.action === 'communication.auto_failed' && Number(candidate.details.attempt) === attempt))) continue;
        try {
          await supabaseRequest('admin_activity_log', { method: 'POST', body: JSON.stringify(activityBody({ id: claimId, order_number: schedule.order_number, action: 'communication.dispatching', entity_id: guestId, details: { scheduleId: schedule.id, kind, attempt } })) });
        } catch (error) {
          if (String(error).includes('409') || String(error).includes('duplicate')) continue;
          throw error;
        }
        const guestResponse = await supabaseRequest(`event_guests?id=eq.${encodeURIComponent(guestId)}&order_number=eq.${encodeURIComponent(schedule.order_number)}&select=id,invite_token,name,phone,status,archived_at,invitation_sent_at&limit=1`);
        const guest = (await guestResponse.json() as Guest[])[0];
        if (!guest || !eligible(kind, guest)) {
          skipped += 1;
          await supabaseRequest('admin_activity_log', { method: 'POST', body: JSON.stringify(activityBody({ order_number: schedule.order_number, action: 'communication.auto_sent', entity_id: guestId, details: { scheduleId: schedule.id, kind, attempt, skipped: true, reason: 'recipient_not_eligible' } })) });
          continue;
        }
        try {
          const actionUrl = kind === 'notice' || kind === 'thanks'
            ? (order.invitation_url || appUrl())
            : `${appUrl()}/confirmar?token=${encodeURIComponent(guest.invite_token)}`;
          const result = await sendScheduledWhatsAppTemplate({
            kind,
            phone: guest.phone,
            recipientName: guest.name,
            eventTitle,
            message: scheduledMessage(kind, schedule.details),
            closing: String(schedule.details.closing || ''),
            actionUrl,
            imageUrl: String(schedule.details.extraContent || '') === 'image' ? String(schedule.details.imageUrl || '') || undefined : undefined,
            connection: {
              accessToken: eventAccessToken,
              phoneNumberId: eventConnection.phone_number_id,
              graphVersion: process.env.META_GRAPH_VERSION || '',
            },
          });
          if (!result.sent) throw new Error(result.reason);
          const now = new Date().toISOString();
          await supabaseRequest('whatsapp_message_log', { method: 'POST', body: JSON.stringify({ message_id: result.messageId, order_number: schedule.order_number, guest_id: guest.id, status: 'accepted', status_at: now }) });
          const timestamps: Record<string, string> = { updated_at: now };
          if (kind === 'invite') timestamps.invitation_sent_at = now;
          if (kind === 'reminder') timestamps.reminded_at = now;
          if (kind === 'thanks') timestamps.thanked_at = now;
          await supabaseRequest(`event_guests?id=eq.${encodeURIComponent(guest.id)}&order_number=eq.${encodeURIComponent(schedule.order_number)}`, { method: 'PATCH', body: JSON.stringify(timestamps) });
          await supabaseRequest('admin_activity_log', { method: 'POST', body: JSON.stringify(activityBody({ order_number: schedule.order_number, action: 'communication.auto_sent', entity_id: guest.id, details: { scheduleId: schedule.id, kind, attempt, channel: 'whatsapp_business', messageId: result.messageId } })) });
          sent += 1;
        } catch (error) {
          const detail = error instanceof Error ? error.message.slice(0, 700) : 'Error desconocido';
          diagnostics.add(detail);
          await supabaseRequest('admin_activity_log', { method: 'POST', body: JSON.stringify(activityBody({ order_number: schedule.order_number, action: 'communication.auto_failed', entity_id: guestId, details: { scheduleId: schedule.id, kind, attempt, channel: 'whatsapp_business', error: detail } })) }).catch(() => undefined);
          failed += 1;
        }
      }
    }
    return json({ ok: true, dueSchedules: schedules.length, sent, failed, skipped, diagnostics: [...diagnostics].slice(0, 10) });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos procesar las comunicaciones programadas.', detail: error instanceof Error ? error.message : 'Error desconocido' }, 500);
  }
}

export default { fetch: handler };
