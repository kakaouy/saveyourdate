import {
  findOrderByNumber,
  json,
  orderNumberFromPreviewToken
} from '../_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  try {
    const token = new URL(request.url).searchParams.get('token') || '';
    const orderNumber = await orderNumberFromPreviewToken(token);
    if (!orderNumber) return json({ error: 'Enlace inválido.' }, 400);
    const order = await findOrderByNumber(orderNumber);
    if (!order) return json({ error: 'Pedido no encontrado.' }, 404);
    if (order.status !== 'payment_validated' && order.status !== 'published') {
      return json({ error: 'La vista previa estará disponible cuando validemos el pago.' }, 409);
    }
    return json({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      modelName: order.model_name,
      modelId: String(order.order_payload?.modelId || ''),
      language: order.language,
      status: order.status,
      invitationUrl: order.status === 'published' ? order.invitation_url : null
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos abrir la vista previa.' }, 500);
  }
}

export default { fetch: handler };
