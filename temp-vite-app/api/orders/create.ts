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

async function handler(request: Request) {
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
    const requestedLanguage = String(body.language || body['Código de idioma'] || 'es');
    const language = requestedLanguage === 'en' || requestedLanguage === 'pt'
      ? requestedLanguage
      : 'es';
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
      language,
      payment_operation: paymentOperation || null,
      status,
      status_token_hash: await hashToken(statusToken),
      approval_token_hash: await hashToken(approvalToken),
      order_payload: body
    });

    const statusUrl = `${appUrl()}/estado?token=${statusToken}`;
    const approvalUrl = `${appUrl()}/validar-pago?token=${approvalToken}`;
    const adminEmail = process.env.ORDER_ADMIN_EMAIL || 'saveyourdate.invite@gmail.com';
    const customerCopy = {
      es: {
        subject: `Recibimos tu pedido ${orderNumber}`,
        title: '¡Recibimos tu pedido!',
        hello: `Hola ${safeName}, tu número de pedido es`,
        status: paymentOperation ? 'Pago informado' : 'Pago pendiente',
        button: 'Consultar mi pedido',
        note: 'Guardá este correo: el enlace es privado.'
      },
      en: {
        subject: `We received your order ${orderNumber}`,
        title: 'We received your order!',
        hello: `Hi ${safeName}, your order number is`,
        status: paymentOperation ? 'Payment reported' : 'Payment pending',
        button: 'Check my order',
        note: 'Keep this email: the link is private.'
      },
      pt: {
        subject: `Recebemos seu pedido ${orderNumber}`,
        title: 'Recebemos seu pedido!',
        hello: `Olá ${safeName}, o número do seu pedido é`,
        status: paymentOperation ? 'Pagamento informado' : 'Pagamento pendente',
        button: 'Consultar meu pedido',
        note: 'Guarde este e-mail: o link é privado.'
      }
    }[language];

    const emailResults = await Promise.allSettled([
      sendEmail({
        to: email,
        subject: customerCopy.subject,
        idempotencyKey: `order-customer-${orderNumber}`,
        html: emailShell(
          customerCopy.title,
          `<p>${customerCopy.hello} <strong>${orderNumber}</strong>.</p>
           <p><strong>${customerCopy.status}</strong>.</p>
           ${emailButton(customerCopy.button, statusUrl)}
           <p style="font-size:13px;color:#765f69">${customerCopy.note}</p>`
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

export default { fetch: handler };
