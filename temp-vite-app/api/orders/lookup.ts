import {
  appUrl,
  findOrderForLookup,
  json,
  previewTokenFor
} from '../_lib/orders.js';

const labels = {
  es: {
    pending_payment: ['Pedido recibido', 'Realizá el pago y luego informá el número de operación.'],
    payment_reported: ['Pago informado', 'Estamos verificando el pago. Te avisaremos por email cuando quede validado.'],
    payment_validated: ['Invitación en preparación', 'Tu pago está confirmado y estamos preparando la invitación.'],
    published: ['Invitación entregada', 'Tu invitación definitiva ya está disponible.']
  },
  en: {
    pending_payment: ['Order received', 'Complete the payment and then report the transaction number.'],
    payment_reported: ['Payment reported', 'We are checking the payment. We will email you when it is validated.'],
    payment_validated: ['Invitation in preparation', 'Your payment is confirmed and we are preparing the invitation.'],
    published: ['Invitation delivered', 'Your final invitation is now available.']
  },
  pt: {
    pending_payment: ['Pedido recebido', 'Faça o pagamento e depois informe o número da operação.'],
    payment_reported: ['Pagamento informado', 'Estamos verificando o pagamento. Avisaremos por e-mail quando for validado.'],
    payment_validated: ['Convite em preparação', 'Seu pagamento está confirmado e estamos preparando o convite.'],
    published: ['Convite entregue', 'Seu convite definitivo já está disponível.']
  }
} as const;

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const identifier = String(body.identifier || '').trim();
    const contact = String(body.contact || '').trim();
    if (!identifier || !contact) return json({ error: 'Completá los dos datos.' }, 400);
    const order = await findOrderForLookup(identifier, contact);
    if (!order) return json({ error: 'No encontramos un pedido que coincida con esos datos.' }, 404);
    const [statusLabel, nextStep] = labels[order.language][order.status];
    return json({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      plan: order.plan,
      modelName: order.model_name,
      language: order.language,
      status: order.status,
      statusLabel,
      nextStep,
      paymentOperation: order.payment_operation,
      previewUrl: order.status === 'payment_validated'
        ? `${appUrl()}/preparando?token=${encodeURIComponent(await previewTokenFor(order.order_number))}`
        : null,
      invitationUrl: order.status === 'published' ? order.invitation_url : null,
      updatedAt: order.updated_at
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos consultar el pedido.' }, 500);
  }
}

export default { fetch: handler };
