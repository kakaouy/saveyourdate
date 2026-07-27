import guests from '../_lib/admin/guests.js';
import logout from '../_lib/admin/logout.js';
import requestCode from '../_lib/admin/request-code.js';
import session from '../_lib/admin/session.js';
import tables from '../_lib/admin/tables.js';
import verifyCode from '../_lib/admin/verify-code.js';
import { json } from '../_lib/orders.js';

const handlers: Record<string, { fetch: (request: Request) => Promise<Response> }> = {
  guests,
  logout,
  'request-code': requestCode,
  session,
  tables,
  'verify-code': verifyCode
};

async function handler(request: Request) {
  const action = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';
  const selected = handlers[action];
  return selected ? selected.fetch(request) : json({ error: 'Acción no encontrada.' }, 404);
}

export default { fetch: handler };
