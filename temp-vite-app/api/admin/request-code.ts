import {
  createChallenge,
  createSixDigitCode,
  recentChallengeCount
} from '../_lib/admin-auth.js';
import {
  emailShell,
  escapeHtml,
  findOrderForLookup,
  json,
  sendEmail
} from '../_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const orderNumber = String(body.orderNumber || '').trim().toUpperCase();
    const contact = String(body.contact || '').trim();
    const genericError = 'No encontramos un pedido activo con esos datos.';
    if (!orderNumber.startsWith('SYD-') || !contact) return json({ error: genericError }, 400);
    const order = await findOrderForLookup(orderNumber, contact);
    if (!order) return json({ error: genericError }, 404);
    if (await recentChallengeCount(order.order_number) >= 3) {
      return json({ error: 'Alcanzaste el límite de envíos. Probá nuevamente en 15 minutos.' }, 429);
    }
    const code = createSixDigitCode();
    const challenge = await createChallenge(order.order_number, code);
    await sendEmail({
      to: order.customer_email,
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
    const [name, domain] = order.customer_email.split('@');
    const maskedEmail = `${name.slice(0, 2)}***@${domain}`;
    return json({ challengeId: challenge.id, maskedEmail, expiresIn: 600 });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos enviar el código. Intentá nuevamente.' }, 500);
  }
}

export default { fetch: handler };
