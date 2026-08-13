import { appUrl, findOrderByToken, hashToken, json, supabaseRequest, updateOrder } from '../_lib/orders.js';

const findDocument = async (orderNumber: string) => {
  const eventResponse = await supabaseRequest(`events?order_number=eq.${encodeURIComponent(orderNumber)}&select=id&limit=1`);
  const event = ((await eventResponse.json()) as Array<{ id: string }>)[0];
  if (!event) return null;
  const response = await supabaseRequest(`invitation_documents?event_id=eq.${event.id}&select=id,template_id,schema_version,palette_id,locale,workflow_status,sections,content,updated_at&limit=1`);
  return ((await response.json()) as Array<Record<string, unknown>>)[0] || null;
};

const findHistory = async (invitationId: string) => {
  const response = await supabaseRequest(`invitation_review_events?invitation_id=eq.${encodeURIComponent(invitationId)}&select=id,action,comment,actor_type,created_at&order=created_at.desc&limit=50`);
  return await response.json() as Array<Record<string, unknown>>;
};

async function handler(request: Request) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Método no permitido.' }, 405);
  try {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json() as Record<string, unknown> : {};
    const token = String(body.token || url.searchParams.get('token') || '');
    const order = await findOrderByToken('approval_token_hash', await hashToken(token));
    if (!order) return json({ error: 'Enlace administrativo inválido.' }, 403);
    const document = await findDocument(order.order_number);
    if (!document) return json({ error: 'El cliente todavía no creó un borrador modular.' }, 404);
    if (request.method === 'GET') return json({ orderNumber: order.order_number, customerName: order.customer_name, document, history: await findHistory(String(document.id)) });
    const action = String(body.action || '');
    const comment = String(body.comment || '').trim().slice(0, 2000);
    if (action === 'request-changes' && !comment) return json({ error: 'Escribí qué cambios necesita la invitación.' }, 400);
    const current = String(document.workflow_status || '');
    let status = '';
    if (action === 'request-changes' && current === 'in_review') status = 'changes_requested';
    if (action === 'approve' && current === 'in_review') status = 'approved';
    if (action === 'publish' && current === 'approved') status = 'published';
    if (!status) return json({ error: 'La transición solicitada no está permitida.' }, 409);
    const now = new Date().toISOString();
    const timestamps = status === 'approved' ? { approved_at: now } : status === 'published' ? { published_at: now } : {};
    await supabaseRequest(`invitation_documents?id=eq.${document.id}`, { method: 'PATCH', body: JSON.stringify({ workflow_status: status, ...timestamps, updated_at: now }) });
    await supabaseRequest('invitation_review_events', { method: 'POST', body: JSON.stringify({
      invitation_id: document.id,
      action: status,
      comment: comment || null,
      actor_type: 'platform'
    }) });
    let invitationUrl = order.invitation_url;
    if (status === 'published') {
      invitationUrl = `${appUrl()}/i/${encodeURIComponent(order.order_number)}`;
      await updateOrder(order.order_number, { status: 'published', invitation_url: invitationUrl, delivered_at: now });
    }
    return json({ ok: true, status, invitationUrl, history: await findHistory(String(document.id)) });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos revisar la invitación.' }, 500);
  }
}

export default { fetch: handler };
