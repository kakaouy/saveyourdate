import {
  appUrl,
  approvalTokenFor,
  customerHelpHtml,
  emailButton,
  emailShell,
  findOrderForPaymentReport,
  json,
  sendEmail,
  updateOrder
} from '../_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const orderNumber = String(body.orderNumber || '').trim().toUpperCase();
    const operation = String(body.paymentOperation || '').trim();
    const contact = String(body.contact || '').trim();
    if (!orderNumber || !operation || !contact) {
      return json({ error: 'Completá todos los datos.' }, 400);
    }
    const order = await findOrderForPaymentReport(orderNumber, contact);
    if (!order) return json({ error: 'Los datos no coinciden con el pedido.' }, 404);
    if (order.status === 'payment_validated' || order.status === 'published') {
      return json({ ok: true, alreadyValidated: true });
    }
    if (order.approval_token_used_at) {
      await updateOrder(orderNumber, { status: 'payment_validated' });
      return json({ ok: true, alreadyValidated: true });
    }
    await updateOrder(orderNumber, {
      payment_operation: operation,
      status: 'payment_reported'
    });
    const approvalToken = await approvalTokenFor(orderNumber);
    const approvalTokenNotice =
      `${appUrl()}/validar-pago?token=${approvalToken}`;
    const customerCopy = order.language === 'en'
      ? {
          subject: `[${orderNumber}] Payment reported — verification in progress`,
          title: 'We received your payment number',
          message: 'We will check the transaction and email you when the payment is validated.',
          button: 'Check my order'
        }
      : order.language === 'pt'
        ? {
            subject: `[${orderNumber}] Pagamento informado — estamos verificando`,
            title: 'Recebemos o número do pagamento',
            message: 'Vamos verificar a operação e avisaremos por e-mail quando o pagamento for validado.',
            button: 'Consultar meu pedido'
          }
        : {
            subject: `[${orderNumber}] Pago informado — estamos verificándolo`,
            title: 'Recibimos el número de pago',
            message: 'Vamos a verificar la operación y te avisaremos por email cuando el pago quede validado.',
            button: 'Consultar mi pedido'
          };
    const emailResults = await Promise.allSettled([
      sendEmail({
        to: order.customer_email,
        subject: customerCopy.subject,
        idempotencyKey: `payment-report-customer-${orderNumber}-${operation}`,
        html: emailShell(
          customerCopy.title,
          `<p>${customerCopy.message}</p>
           <p><strong>${orderNumber}</strong></p>
           ${emailButton(customerCopy.button, `${appUrl()}/consultar`)}
           ${customerHelpHtml(order.language, orderNumber)}`
        )
      }),
      sendEmail({
        to: process.env.ORDER_ADMIN_EMAIL || 'saveyourdate.invite@gmail.com',
        subject: `[${orderNumber}] Pago informado — revisar en Mercado Pago`,
        idempotencyKey: `payment-report-${orderNumber}-${operation}`,
        html: emailShell(
          `Pago informado: ${orderNumber}`,
          `<p><strong>Cliente:</strong> ${order.customer_name}<br>
           <strong>Operación:</strong> ${operation}</p>
           <p>Revisá primero el cobro en Mercado Pago.</p>
           ${emailButton('Revisar y validar pago', approvalTokenNotice)}`
        )
      })
    ]);
    emailResults.forEach((result) => {
      if (result.status === 'rejected') console.error(result.reason);
    });
    return json({ ok: true, emailSent: emailResults.every((result) => result.status === 'fulfilled') });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos informar el pago.' }, 500);
  }
}

export default { fetch: handler };
