import { findSession, readSessionToken } from '../admin-auth.js';
import { emailShell, escapeHtml, json, sendEmail, supabaseRequest } from '../orders.js';

type AccessRow = { id: string; email: string; role: 'editor' | 'viewer'; created_at: string };

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
    if (session.access_role !== 'owner') return json({ error: 'Sólo el propietario puede administrar accesos.' }, 403);

    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const email = String(body.email || '').trim().toLowerCase();
      const role = String(body.role || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['editor', 'viewer'].includes(role)) {
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
          `<p>Te invitaron como <strong>${role === 'editor' ? 'editor' : 'solo lectura'}</strong> del pedido <strong>${escapeHtml(session.order_number)}</strong>.</p>
           <p>Ingresá en <a href="https://www.saveyourdate.site/admin">saveyourdate.site/admin</a> usando este email y el número de pedido.</p>`
        )
      });
      return json({ access }, 201);
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      await supabaseRequest(
        `event_admins?id=eq.${encodeURIComponent(id)}&order_number=eq.${encodeURIComponent(session.order_number)}`,
        { method: 'DELETE' }
      );
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos actualizar los accesos.' }, 500);
  }
}

export default { fetch: handler };
