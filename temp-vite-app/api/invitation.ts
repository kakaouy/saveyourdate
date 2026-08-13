import { json, supabaseRequest } from './_lib/orders.js';

async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
  try {
    const orderNumber = String(new URL(request.url).searchParams.get('order') || '').trim().toUpperCase();
    if (!/^SYD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(orderNumber)) return json({ error: 'Invitación inválida.' }, 400);
    const eventResponse = await supabaseRequest(`events?order_number=eq.${encodeURIComponent(orderNumber)}&select=id&limit=1`);
    const event = ((await eventResponse.json()) as Array<{ id: string }>)[0];
    if (!event) return json({ error: 'Invitación no encontrada.' }, 404);
    const documentResponse = await supabaseRequest(`invitation_documents?event_id=eq.${event.id}&workflow_status=eq.published&select=template_id,schema_version,palette_id,locale,workflow_status,sections,content,updated_at&limit=1`);
    const document = ((await documentResponse.json()) as unknown[])[0];
    if (!document) return json({ error: 'Invitación no publicada.' }, 404);
    return json({ document });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos abrir la invitación.' }, 500);
  }
}

export default { fetch: handler };
