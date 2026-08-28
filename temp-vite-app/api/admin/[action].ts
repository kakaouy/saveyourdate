import access from '../_lib/admin/access.js';
import activity from '../_lib/admin/activity.js';
import backup from '../_lib/admin/backup.js';
import guests from '../_lib/admin/guests.js';
import health from '../_lib/admin/health.js';
import logout from '../_lib/admin/logout.js';
import privacy from '../_lib/admin/privacy.js';
import recoverAccess from '../_lib/admin/recover-access.js';
import requestCode from '../_lib/admin/request-code.js';
import restore from '../_lib/admin/restore.js';
import session from '../_lib/admin/session.js';
import settings from '../_lib/admin/settings.js';
import tables from '../_lib/admin/tables.js';
import testReminder from '../_lib/admin/test-reminder.js';
import verifyCode from '../_lib/admin/verify-code.js';
import whatsappWebhook from '../_lib/admin/whatsapp-webhook.js';
import invitationBuilder from '../_lib/admin/invitation-builder.js';
import events from '../_lib/admin/events.js';
import resources from '../_lib/admin/resources.js';
import modules from '../_lib/admin/modules.js';
import communications from '../_lib/admin/communications.js';
import { json } from '../_lib/orders.js';

const handlers: Record<string, { fetch: (request: Request) => Promise<Response> }> = {
  access,
  activity,
  backup,
  guests,
  health,
  logout,
  privacy,
  'recover-access': recoverAccess,
  'request-code': requestCode,
  restore,
  session,
  settings,
  tables,
  'test-reminder': testReminder,
  'verify-code': verifyCode,
  'whatsapp-webhook': whatsappWebhook
  , 'invitation-builder': invitationBuilder
  , events
  , resources
  , modules
  , communications
};

async function handler(request: Request) {
  const action = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';
  const selected = handlers[action];
  return selected ? selected.fetch(request) : json({ error: 'Acción no encontrada.' }, 404);
}

export default { fetch: handler };
