import {
  appUrl,
  approvalTokenFor,
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
    if (order.status === 'payment_validated') {
      return json({ ok: true, alreadyValidated: true });
    }
    await updateOrder(orderNumber, {
      payment_operation: operation,
      status: 'payment_reported'
    });
    const approvalToken = await approvalTokenFor(orderNumber);
    const approvalTokenNotice =
      `${appUrl()}/validar-pago?token=${approvalToken}`;
    let emailSent = true;
    try {
      await sendEmail({
        to: process.env.ORDER_ADMIN_EMAIL || 'saveyourdate.invite@gmail.com',
        subject: `Pago informado para ${orderNumber}`,
        idempotencyKey: `payment-report-${orderNumber}-${operation}`,
        html: emailShell(
          `Pago informado: ${orderNumber}`,
          `<p><strong>Cliente:</strong> ${order.customer_name}<br>
           <strong>Operación:</strong> ${operation}</p>
           <p>Revisá primero el cobro en Mercado Pago.</p>
           ${emailButton('Revisar y validar pago', approvalTokenNotice)}`
        )
      });
    } catch (emailError) {
      emailSent = false;
      console.error(emailError);
    }
    return json({ ok: true, emailSent });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos informar el pago.' }, 500);
  }
}

export default { fetch: handler };
