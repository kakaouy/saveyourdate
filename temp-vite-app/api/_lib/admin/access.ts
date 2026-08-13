import { findSession, readSessionToken } from '../admin-auth.js';
import { emailShell, escapeHtml, json, sendEmail, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

type AccessRow = { id: string; email: string; role: 'admin' | 'editor' | 'viewer'; created_at: string };

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    if (request.method === 'GET') {
      const response = await supabaseRequest(
        `event_admins?order_number=eq.${encodeURIComponent(session.order_number)}&select=id,email,role,created_at&order=created_at.asc`
      );
      return json({ accesses: await response.json(), currentRole: session.access_role });
    }
    if (!['owner', 'admin'].includes(session.access_role)) return json({ error: 'No tenés permiso para administrar accesos.' }, 403);

    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const email = String(body.email || '').trim().toLowerCase();
      const role = String(body.role || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['admin', 'editor', 'viewer'].includes(role)) {
        return json({ error: 'Ingresá un email y un rol válidos.' }, 400);
      }
      const response = await supabaseRequest('event_admins', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ order_number: session.order_number, email, role })
      });
      const access = ((await response.json()) as AccessRow[])[0];
      await sendEmail({
        to: email,
        subject: 'Te invitaron a administrar un evento',
        idempotencyKey: `admin-access-${access.id}`,
        html: emailShell(
          'Acceso al panel Save Your Date',
          `<p>Te invitaron como <strong>${role === 'admin' ? 'administrador' : role === 'editor' ? 'editor' : 'solo lectura'}</strong> del pedido <strong>${escapeHtml(session.order_number)}</strong>.</p>
           <p>Ingresá en <a href="https://www.saveyourdate.site/admin">saveyourdate.site/admin</a> usando este email y el número de pedido.</p>`
        )
      });
      await logAdminActivity(session, 'access.created', 'access', access.id, { email: access.email, role: access.role });
      return json({ access }, 201);
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const id = String(body.id || '');
      const role = String(body.role || '');
      if (!id || !['admin', 'editor', 'viewer'].includes(role)) {
        return json({ error: 'Seleccioná un rol válido.' }, 400);
      }
      const response = await supabaseRequest(
        `event_admins?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ role })
        }
      );
      const access = ((await response.json()) as AccessRow[])[0];
      if (!access) return json({ error: 'No encontramos ese colaborador.' }, 404);
      await supabaseRequest(
        `admin_sessions?order_number=eq.${encodeURIComponent(session.order_number)}&login_email=eq.${encodeURIComponent(access.email)}&revoked_at=is.null`,
        { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) }
      );
      await logAdminActivity(session, 'access.role_updated', 'access', access.id, { email: access.email, role: access.role });
      return json({ access });
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      const accessResponse = await supabaseRequest(
        `event_admins?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}&select=email&limit=1`
      );
      const access = ((await accessResponse.json()) as Pick<AccessRow, 'email'>[])[0];
      if (!access) return json({ error: 'No encontramos ese colaborador.' }, 404);
      await Promise.all([
        supabaseRequest(
        `event_admins?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: 'DELETE' }
        ),
        supabaseRequest(
          `admin_sessions?order_number=eq.${encodeURIComponent(session.order_number)}&login_email=eq.${encodeURIComponent(access.email)}&revoked_at=is.null`,
          { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) }
        )
      ]);
      await logAdminActivity(session, 'access.deleted', 'access', id, { email: access.email });
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar los accesos.' }, 500);
  }
}

export default { fetch: handler };
