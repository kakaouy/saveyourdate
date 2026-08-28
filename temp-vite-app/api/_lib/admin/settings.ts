import { findSession, readSessionToken } from '../admin-auth.js';
import { findOrderByNumber, json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

const validCode = (value: string) => /^\+\d{1,4}$/.test(value);

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method !== 'GET' && !['owner', 'admin'].includes(session.access_role)) return json({ error: 'No tenés permiso para modificar la configuración.' }, 403);

    if (request.method === 'GET') {
      const order = await findOrderByNumber(session.order_number);
      return json({
        defaultPhoneCountryCode: order?.default_phone_country_code || '+598',
        eventName: String(order?.customer_name || order?.order_payload.eventTitle || ''),
        eventDate: String(order?.order_payload.eventDate || ''),
        reminderDaysBefore: Math.max(1, Math.min(60, Number(order?.order_payload.reminderDaysBefore) || 7)),
        reminderRepeatDays: Math.max(1, Math.min(30, Number(order?.order_payload.reminderRepeatDays) || 3)),
        reminderMaxAttempts: Math.max(1, Math.min(5, Number(order?.order_payload.reminderMaxAttempts) || 1)),
        automaticRemindersEnabled: order?.order_payload.automaticRemindersEnabled === true,
        automaticRemindersPaused: order?.order_payload.automaticRemindersPaused === true
      });
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      if (body.action === 'invitation-url') {
        const invitationUrl = String(body.invitationUrl || '').trim();
        try {
          const parsed = new URL(invitationUrl);
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        } catch {
          return json({ error: 'El enlace de la invitación no es válido.' }, 400);
        }
        await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(session.order_number)}`, {
          method: 'PATCH',
          body: JSON.stringify({ invitation_url: invitationUrl, updated_at: new Date().toISOString() })
        });
        await logAdminActivity(session, 'settings.invitation_linked', 'settings', session.order_number, {});
        return json({ invitationUrl });
      }
      const code = String(body.defaultPhoneCountryCode || '').trim();
      const reminderDaysBefore = Math.max(1, Math.min(60, Number(body.reminderDaysBefore) || 7));
      const automaticRemindersEnabled = body.automaticRemindersEnabled === true;
      const automaticRemindersPaused = body.automaticRemindersPaused === true;
      const reminderRepeatDays = Math.max(1, Math.min(30, Number(body.reminderRepeatDays) || 3));
      const reminderMaxAttempts = Math.max(1, Math.min(5, Number(body.reminderMaxAttempts) || 1));
      const eventName = String(body.eventName || '').trim().slice(0, 160);
      const eventDate = String(body.eventDate || '').trim();
      if (!validCode(code)) return json({ error: 'El código de país no es válido.' }, 400);
      if (!eventName) return json({ error: 'Ingresá el nombre que se mostrará en el panel.' }, 400);
      if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return json({ error: 'La fecha del evento no es válida.' }, 400);
      const order = await findOrderByNumber(session.order_number);
      if (!order) return json({ error: 'No encontramos el evento.' }, 404);
      await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(session.order_number)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          default_phone_country_code: code,
          customer_name: eventName,
          order_payload: { ...order.order_payload, eventTitle: eventName, eventDate, reminderDaysBefore, reminderRepeatDays, reminderMaxAttempts, automaticRemindersEnabled, automaticRemindersPaused },
          updated_at: new Date().toISOString()
        })
      });
      await logAdminActivity(session, 'settings.updated', 'settings', session.order_number, { defaultPhoneCountryCode: code, reminderDaysBefore, reminderRepeatDays, reminderMaxAttempts, automaticRemindersEnabled, automaticRemindersPaused });
      return json({ defaultPhoneCountryCode: code, eventName, eventDate, reminderDaysBefore, reminderRepeatDays, reminderMaxAttempts, automaticRemindersEnabled, automaticRemindersPaused });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos guardar la configuración.' }, 500);
  }
}

export default { fetch: handler };
