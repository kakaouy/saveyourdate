import {
  createChallenge,
  createSixDigitCode,
  recentChallengeCount
} from '../admin-auth.js';
import {
  emailShell,
  escapeHtml,
  findOrderByNumber,
  findOrderForLookup,
  json,
  sendEmail,
  supabaseRequest
} from '../orders.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const orderNumber = String(body.orderNumber || '').trim().toUpperCase();
    const contact = String(body.contact || '').trim();
    const genericError = 'No encontramos un pedido activo con esos datos.';
    if (!orderNumber.startsWith('SYD-') || !contact) return json({ error: genericError }, 400);
    let order = await findOrderForLookup(orderNumber, contact);
    let loginEmail = order?.customer_email || '';
    let accessRole: 'owner' | 'editor' | 'viewer' = 'owner';
    if (!order && contact.includes('@')) {
      const response = await supabaseRequest(
        `event_admins?order_number=eq.${encodeURIComponent(orderNumber)}&email=eq.${encodeURIComponent(contact.toLowerCase())}&select=email,role&limit=1`
      );
      const access = ((await response.json()) as Array<{ email: string; role: 'editor' | 'viewer' }>)[0];
      if (access) {
        order = await findOrderByNumber(orderNumber);
        loginEmail = access.email;
        accessRole = access.role;
      }
    }
    if (!order) return json({ error: genericError }, 404);
    if (await recentChallengeCount(order.order_number, loginEmail) >= 3) {
      return json({ error: 'Alcanzaste el límite de envíos. Probá nuevamente en 15 minutos.' }, 429);
    }
    const code = createSixDigitCode();
    const challenge = await createChallenge(order.order_number, code, loginEmail, accessRole);
    await sendEmail({
      to: loginEmail,
      subject: `${code} · Código de acceso a tu evento`,
      idempotencyKey: `admin-login-${challenge.id}`,
      html: emailShell(
        'Tu código de acceso',
        `<p>Usá este código para ingresar al panel de administración del pedido <strong>${escapeHtml(order.order_number)}</strong>:</p>
         <p style="font-size:34px;letter-spacing:8px;font-weight:800;text-align:center">${code}</p>
         <p>El código vence en 10 minutos y solo puede utilizarse una vez.</p>
         <p style="font-size:13px;color:#765f69">Si no solicitaste este acceso, podés ignorar el mensaje.</p>`
      )
    });
    const [name, domain] = loginEmail.split('@');
    const maskedEmail = `${name.slice(0, 2)}***@${domain}`;
    return json({ challengeId: challenge.id, maskedEmail, expiresIn: 600 });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos enviar el código. Intentá nuevamente.' }, 500);
  }
}

export default { fetch: handler };
