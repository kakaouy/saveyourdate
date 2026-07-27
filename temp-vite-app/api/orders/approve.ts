import {
  appUrl,
  customerHelpHtml,
  emailButton,
  emailShell,
  escapeHtml,
  findOrderByToken,
  hashToken,
  json,
  previewTokenFor,
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
        status: order.status,
        invitationUrl: order.invitation_url
      });
    }

    if (order.status === 'payment_validated' || order.status === 'published') {
      return json({ ok: true, alreadyValidated: true, orderNumber: order.order_number });
    }
    if (!order.payment_operation) {
      return json({ error: 'El cliente todavía no informó un número de operación.' }, 409);
    }
    await updateOrder(order.order_number, {
      status: 'payment_validated',
      approval_token_used_at: new Date().toISOString()
    });
    const previewUrl = `${appUrl()}/preparando?token=${encodeURIComponent(await previewTokenFor(order.order_number))}`;
    const customerCopy = {
      es: {
        subject: `[${order.order_number}] Pago validado — comenzamos tu invitación`,
        title: '¡Tu pago fue validado!',
        hello: `Hola ${escapeHtml(order.customer_name)}, confirmamos el pago de tu pedido`,
        message: 'Ya estamos preparando tu invitación. Mientras tanto, podés volver a ver el modelo que elegiste y avisarnos si necesitás cambiar o agregar información.',
        button: 'Ver modelo en preparación'
      },
      en: {
        subject: `[${order.order_number}] Payment validated — we are starting your invitation`,
        title: 'Your payment was validated!',
        hello: `Hi ${escapeHtml(order.customer_name)}, we confirmed payment for your order`,
        message: 'We are now preparing your invitation. In the meantime, you can review your chosen template and tell us if you need to change or add information.',
        button: 'View template in preparation'
      },
      pt: {
        subject: `[${order.order_number}] Pagamento validado — começamos seu convite`,
        title: 'Seu pagamento foi validado!',
        hello: `Olá ${escapeHtml(order.customer_name)}, confirmamos o pagamento do seu pedido`,
        message: 'Já estamos preparando seu convite. Enquanto isso, você pode rever o modelo escolhido e nos avisar se precisar alterar ou adicionar informações.',
        button: 'Ver modelo em preparação'
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
           <p>${customerCopy.message}</p>
           ${emailButton(customerCopy.button, previewUrl)}
           ${customerHelpHtml(order.language, order.order_number)}`
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
