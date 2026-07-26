import {
  appUrl,
  approvalTokenFor,
  createOrderNumber,
  emailButton,
  emailShell,
  escapeHtml,
  hashToken,
  insertOrder,
  json,
  randomToken,
  sendEmail
} from '../_lib/orders.js';

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const whatsapp = String(body.whatsapp || '').trim();
    if (!name || !email.includes('@') || !whatsapp) {
      return json({ error: 'Faltan los datos de contacto.' }, 400);
    }

    const orderNumber = createOrderNumber();
    const statusToken = randomToken();
    const approvalToken = await approvalTokenFor(orderNumber);
    const paymentOperation = String(body.paymentOperation || '').trim();
    const status = paymentOperation ? 'payment_reported' : 'pending_payment';
    const modelName = String(body.modelName || body.modelId || 'A definir');
    const plan = String(body.plan || 'Básico');
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeWhatsapp = escapeHtml(whatsapp);
    const safePlan = escapeHtml(plan);
    const safeModelName = escapeHtml(modelName);
    const safePaymentOperation = escapeHtml(paymentOperation);
    await insertOrder({
      order_number: orderNumber,
      customer_name: name,
      customer_email: email,
      whatsapp,
      plan,
      model_name: modelName,
      payment_operation: paymentOperation || null,
      status,
      status_token_hash: await hashToken(statusToken),
      approval_token_hash: await hashToken(approvalToken),
      order_payload: body
    });

    const statusUrl = `${appUrl()}/estado?token=${statusToken}`;
    const approvalUrl = `${appUrl()}/validar-pago?token=${approvalToken}`;
    const adminEmail = process.env.ORDER_ADMIN_EMAIL || 'saveyourdate.invite@gmail.com';

    const emailResults = await Promise.allSettled([
      sendEmail({
        to: email,
        subject: `Recibimos tu pedido ${orderNumber}`,
        idempotencyKey: `order-customer-${orderNumber}`,
        html: emailShell(
          '¡Recibimos tu pedido!',
          `<p>Hola ${safeName}, tu número de pedido es <strong>${orderNumber}</strong>.</p>
           <p>Estado actual: <strong>${paymentOperation ? 'Pago informado' : 'Pago pendiente'}</strong>.</p>
           ${emailButton('Consultar mi pedido', statusUrl)}
           <p style="font-size:13px;color:#765f69">Guardá este correo: el enlace es privado.</p>`
        )
      }),
      sendEmail({
        to: adminEmail,
        subject: `${paymentOperation ? 'Pago para revisar' : 'Nuevo pedido'} ${orderNumber}`,
        idempotencyKey: `order-admin-${orderNumber}`,
        html: emailShell(
          `Pedido ${orderNumber}`,
          `<p><strong>Cliente:</strong> ${safeName}<br>
           <strong>Email:</strong> ${safeEmail}<br>
           <strong>WhatsApp:</strong> ${safeWhatsapp}<br>
           <strong>Plan:</strong> ${safePlan}<br>
           <strong>Modelo:</strong> ${safeModelName}<br>
           <strong>Operación:</strong> ${safePaymentOperation || 'No informada'}</p>
           <p>Revisá primero el cobro en Mercado Pago.</p>
           ${emailButton('Revisar y validar pago', approvalUrl)}`
        )
      })
    ]);

    emailResults.forEach((result) => {
      if (result.status === 'rejected') console.error(result.reason);
    });
    return json({
      orderNumber,
      statusUrl,
      emailSent: emailResults.every((result) => result.status === 'fulfilled')
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos registrar el pedido.' }, 500);
  }
}
