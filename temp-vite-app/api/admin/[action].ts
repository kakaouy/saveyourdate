import access from '../_lib/admin/access.js';
import activity from '../_lib/admin/activity.js';
import backup from '../_lib/admin/backup.js';
import guests from '../_lib/admin/guests.js';
import logout from '../_lib/admin/logout.js';
import recoverAccess from '../_lib/admin/recover-access.js';
import requestCode from '../_lib/admin/request-code.js';
import session from '../_lib/admin/session.js';
import settings from '../_lib/admin/settings.js';
import tables from '../_lib/admin/tables.js';
import verifyCode from '../_lib/admin/verify-code.js';
import { json } from '../_lib/orders.js';

const handlers: Record<string, { fetch: (request: Request) => Promise<Response> }> = {
  access,
  activity,
  backup,
  guests,
  logout,
  'recover-access': recoverAccess,
  'request-code': requestCode,
  session,
  settings,
  tables,
  'verify-code': verifyCode
};

async function handler(request: Request) {
  const action = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';
  const selected = handlers[action];
  return selected ? selected.fetch(request) : json({ error: 'Acción no encontrada.' }, 404);
}

export default { fetch: handler };
