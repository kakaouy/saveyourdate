import { emailShell, escapeHtml, hashToken, json, sendEmail, supabaseRequest } from '../orders.js';

type OrderReference = { order_number: string; customer_name: string };
type AdminReference = { order_number: string };

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  const genericMessage = 'Si el email está asociado a un evento, vas a recibir los datos de acceso en unos minutos.';
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Ingresá un email válido.' }, 400);
    }
    const [ownedResponse, sharedResponse] = await Promise.all([
      supabaseRequest(
        `orders?customer_email=eq.${encodeURIComponent(email)}&select=order_number,customer_name&order=created_at.desc&limit=20`
      ),
      supabaseRequest(
        `event_admins?email=eq.${encodeURIComponent(email)}&select=order_number&order=created_at.desc&limit=20`
      )
    ]);
    const owned = await ownedResponse.json() as OrderReference[];
    const shared = await sharedResponse.json() as AdminReference[];
    const references = [
      ...owned.map((order) => ({ orderNumber: order.order_number, detail: order.customer_name || 'Evento propio' })),
      ...shared.map((access) => ({ orderNumber: access.order_number, detail: 'Acceso compartido' }))
    ].filter((item, index, all) => all.findIndex((candidate) => candidate.orderNumber === item.orderNumber) === index);

    if (references.length) {
      const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
      const recipientHash = (await hashToken(email)).slice(0, 20);
      await sendEmail({
        to: email,
        subject: 'Tus accesos a Save Your Date',
        idempotencyKey: `admin-recovery-${recipientHash}-${bucket}`,
        html: emailShell(
          'Recuperá el acceso a tus eventos',
          `<p>Estos son los pedidos asociados a tu email:</p>
           <ul>${references.map((reference) => `<li><strong>${escapeHtml(reference.orderNumber)}</strong> · ${escapeHtml(reference.detail)}</li>`).join('')}</ul>
           <p>Ingresá en <a href="https://www.saveyourdate.site/admin">saveyourdate.site/admin</a> con uno de esos números y este mismo email.</p>
           <p style="font-size:13px;color:#765f69">Si no solicitaste esta recuperación, podés ignorar el mensaje.</p>`
        )
      });
    }
    return json({ message: genericMessage });
  } catch (error) {
    console.error(error);
    return json({ message: genericMessage });
  }
}

export default { fetch: handler };
