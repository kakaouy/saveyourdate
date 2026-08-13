import {
  createChallenge,
  createSixDigitCode,
  recentChallengeCount
} from '../admin-auth.js';
import type { AdminAccessRole } from '../admin-auth.js';
import {
  emailShell,
  escapeHtml,
  findOrderByNumber,
  findOrderForLookup,
  json,
  sendEmail,
  supabaseRequest
} from '../orders.js';
import { eventAccessExpired } from '../event-lifecycle.js';

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
    let accessRole: AdminAccessRole = 'owner';
    if (!order && contact.includes('@')) {
      const response = await supabaseRequest(
        `event_admins?order_number=eq.${encodeURIComponent(orderNumber)}&email=eq.${encodeURIComponent(contact.toLowerCase())}&select=email,role&limit=1`
      );
      const access = ((await response.json()) as Array<{ email: string; role: Exclude<AdminAccessRole, 'owner'> }>)[0];
      if (access) {
        order = await findOrderByNumber(orderNumber);
        loginEmail = access.email;
        accessRole = access.role;
      }
    }
    if (!order) return json({ error: genericError }, 404);
    if (eventAccessExpired(order.order_payload)) {
      return json({ error: 'El período de acceso finalizó 30 días después del evento.' }, 410);
    }
    if (await recentChallengeCount(order.order_number, loginEmail) >= 3) {
      return json({ error: 'Alcanzaste el límite de envíos. Probá nuevamente en 15 minutos.' }, 429);
    }
    const code = createSixDigitCode();
    const challenge = await createChallenge(order.order_number, code, loginEmail, accessRole);
    const copy = order.language === 'en' ? {
      subject: `${code} · Access code for your event`, title: 'Your access code',
      intro: `Use this code to open the dashboard for order <strong>${escapeHtml(order.order_number)}</strong>:`,
      expires: 'The code expires in 10 minutes and can only be used once.',
      ignore: 'If you did not request access, you can ignore this message.'
    } : order.language === 'pt' ? {
      subject: `${code} · Código de acesso ao seu evento`, title: 'Seu código de acesso',
      intro: `Use este código para acessar o painel do pedido <strong>${escapeHtml(order.order_number)}</strong>:`,
      expires: 'O código expira em 10 minutos e só pode ser usado uma vez.',
      ignore: 'Se você não solicitou este acesso, pode ignorar esta mensagem.'
    } : {
      subject: `${code} · Código de acceso a tu evento`, title: 'Tu código de acceso',
      intro: `Usá este código para ingresar al panel del pedido <strong>${escapeHtml(order.order_number)}</strong>:`,
      expires: 'El código vence en 10 minutos y solo puede utilizarse una vez.',
      ignore: 'Si no solicitaste este acceso, podés ignorar el mensaje.'
    };
    await sendEmail({
      to: loginEmail,
      subject: copy.subject,
      idempotencyKey: `admin-login-${challenge.id}`,
      html: emailShell(
        copy.title,
        `<p>${copy.intro}</p>
         <p style="font-size:34px;letter-spacing:8px;font-weight:800;text-align:center">${code}</p>
         <p>${copy.expires}</p>
         <p style="font-size:13px;color:#765f69">${copy.ignore}</p>`
      )
    });
    const [name, domain] = loginEmail.split('@');
    const maskedEmail = `${name.slice(0, 2)}***@${domain}`;
    return json({ challengeId: challenge.id, maskedEmail, expiresIn: 600, language: order.language });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos enviar el código. Intentá nuevamente.' }, 500);
  }
}

export default { fetch: handler };
