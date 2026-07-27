import { json, supabaseRequest } from '../orders.js';

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

const validSignature = async (rawBody: string, signature: string) => {
  const secret = process.env.WHATSAPP_APP_SECRET || '';
  if (!secret || !signature.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = `sha256=${hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)))}`;
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return difference === 0;
};

async function handler(request: Request) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const valid = url.searchParams.get('hub.mode') === 'subscribe' &&
      url.searchParams.get('hub.verify_token') === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    return valid
      ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 })
      : json({ error: 'Verificación inválida.' }, 403);
  }
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  const rawBody = await request.text();
  if (!await validSignature(rawBody, request.headers.get('x-hub-signature-256') || '')) {
    return json({ error: 'Firma inválida.' }, 401);
  }
  const payload = JSON.parse(rawBody) as {
    entry?: Array<{ changes?: Array<{ value?: { statuses?: Array<{ id?: string; status?: string; timestamp?: string; errors?: unknown }> } }> }>;
  };
  const statuses = payload.entry?.flatMap((entry) =>
    entry.changes?.flatMap((change) => change.value?.statuses || []) || []
  ) || [];
  for (const status of statuses) {
    if (!status.id || !['sent', 'delivered', 'read', 'failed'].includes(String(status.status))) continue;
    await supabaseRequest(`whatsapp_message_log?message_id=eq.${encodeURIComponent(status.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: status.status,
        status_at: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString(),
        error_detail: status.errors || null
      })
    });
  }
  return json({ ok: true });
}

export default { fetch: handler };

