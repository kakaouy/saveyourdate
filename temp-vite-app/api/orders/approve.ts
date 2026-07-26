import {
  emailShell,
  escapeHtml,
  findOrderByToken,
  hashToken,
  json,
  sendEmail,
  updateOrder
} from '../_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405);
  }
  try {
    const url = new URL(request.url);
    const body = request.method === 'POST'
      ? await request.json() as Record<string, unknown>
      : {};
    const token = String(body.token || url.searchParams.get('token') || '');
    if (token.length < 32) return json({ error: 'Enlace inválido.' }, 400);
    const order = await findOrderByToken('approval_token_hash', await hashToken(token));
    if (!order) return json({ error: 'Pedido no encontrado.' }, 404);

    if (request.method === 'GET') {
      return json({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        plan: order.plan,
        modelName: order.model_name,
        paymentOperation: order.payment_operation,
        status: order.status
      });
    }

    if (order.status === 'payment_validated' || order.approval_token_used_at) {
      return json({ ok: true, alreadyValidated: true, orderNumber: order.order_number });
    }
    if (!order.payment_operation) {
      return json({ error: 'El cliente todavía no informó un número de operación.' }, 409);
    }
    await updateOrder(order.order_number, {
      status: 'payment_validated',
      approval_token_used_at: new Date().toISOString()
    });
    const customerCopy = {
      es: {
        subject: `Pago validado — ${order.order_number}`,
        title: '¡Tu pago fue validado!',
        hello: `Hola ${escapeHtml(order.customer_name)}, confirmamos el pago de tu pedido`,
        message: 'Ya podemos comenzar a preparar tu invitación. Podés consultar el estado desde el enlace privado que recibiste con el pedido.'
      },
      en: {
        subject: `Payment validated — ${order.order_number}`,
        title: 'Your payment was validated!',
        hello: `Hi ${escapeHtml(order.customer_name)}, we confirmed payment for your order`,
        message: 'We can now start preparing your invitation. You can check its status using the private link from your order email.'
      },
      pt: {
        subject: `Pagamento validado — ${order.order_number}`,
        title: 'Seu pagamento foi validado!',
        hello: `Olá ${escapeHtml(order.customer_name)}, confirmamos o pagamento do seu pedido`,
        message: 'Já podemos começar a preparar seu convite. Você pode consultar o status pelo link privado recebido no e-mail do pedido.'
      }
    }[order.language];
    let emailSent = true;
    try {
      await sendEmail({
        to: order.customer_email,
        subject: customerCopy.subject,
        idempotencyKey: `payment-approved-${order.order_number}`,
        html: emailShell(
          customerCopy.title,
          `<p>${customerCopy.hello} <strong>${order.order_number}</strong>.</p>
           <p>${customerCopy.message}</p>`
        )
      });
    } catch (emailError) {
      emailSent = false;
      console.error(emailError);
    }
    return json({ ok: true, emailSent, orderNumber: order.order_number });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos validar el pago.' }, 500);
  }
}

export default { fetch: handler };
