import { findOrderByToken, hashToken, json } from '../_lib/orders.js';

const labels = {
  es: {
    pending_payment: 'Pago pendiente',
    payment_reported: 'Pago informado',
    payment_validated: 'Pago validado'
  },
  en: {
    pending_payment: 'Payment pending',
    payment_reported: 'Payment reported',
    payment_validated: 'Payment validated'
  },
  pt: {
    pending_payment: 'Pagamento pendente',
    payment_reported: 'Pagamento informado',
    payment_validated: 'Pagamento validado'
  }
};

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  try {
    const token = new URL(request.url).searchParams.get('token') || '';
    if (token.length < 32) return json({ error: 'Enlace inválido.' }, 400);
    const order = await findOrderByToken('status_token_hash', await hashToken(token));
    if (!order) return json({ error: 'Pedido no encontrado.' }, 404);
    return json({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      plan: order.plan,
      modelName: order.model_name,
      language: order.language,
      status: order.status,
      statusLabel: labels[order.language][order.status],
      updatedAt: order.updated_at
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos consultar el pedido.' }, 500);
  }
}

export default { fetch: handler };
