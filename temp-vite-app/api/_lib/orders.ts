const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta configurar ${name}.`);
  return value;
};

export type OrderStatus =
  | 'pending_payment'
  | 'payment_reported'
  | 'payment_validated'
  | 'published';

export interface StoredOrder {
  order_number: string;
  customer_name: string;
  customer_email: string;
  whatsapp: string;
  plan: string;
  model_name: string;
  language: 'es' | 'en' | 'pt';
  payment_operation: string | null;
  status: OrderStatus;
  status_token_hash: string;
  approval_token_hash: string;
  approval_token_used_at: string | null;
  invitation_url: string | null;
  sheet_url: string | null;
  delivered_at: string | null;
  order_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });

export const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const hashToken = async (token: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

export const approvalTokenFor = async (orderNumber: string) => {
  const secret = requiredEnv('ORDER_APPROVAL_SECRET');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(orderNumber)
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

export const previewTokenFor = async (orderNumber: string) =>
  `${orderNumber}.${await approvalTokenFor(`preview:${orderNumber}`)}`;

export const orderNumberFromPreviewToken = async (token: string) => {
  const [orderNumber, signature, ...rest] = token.split('.');
  if (rest.length || !orderNumber || !signature) return null;
  const expected = await previewTokenFor(orderNumber);
  return expected === token ? orderNumber : null;
};

export const createOrderNumber = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `SYD-${code.slice(0, 4)}-${code.slice(4)}`;
};

const supabaseRequest = async (
  path: string,
  init: RequestInit = {}
): Promise<Response> => {
  const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const headers = new Headers(init.headers);
  headers.set('apikey', serviceKey);
  headers.set('Content-Type', 'application/json');
  if (!serviceKey.startsWith('sb_secret_')) {
    headers.set('Authorization', `Bearer ${serviceKey}`);
  }
  const supabaseUrl = requiredEnv('SUPABASE_URL')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase respondió ${response.status}: ${detail}`);
  }
  return response;
};

export const insertOrder = async (order: Record<string, unknown>) => {
  const response = await supabaseRequest('orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(order)
  });
  const rows = (await response.json()) as StoredOrder[];
  return rows[0];
};

export const findOrderByToken = async (
  field: 'status_token_hash' | 'approval_token_hash',
  tokenHash: string
) => {
  const response = await supabaseRequest(
    `orders?${field}=eq.${encodeURIComponent(tokenHash)}&select=order_number,customer_name,customer_email,whatsapp,plan,model_name,language,payment_operation,status,status_token_hash,approval_token_hash,approval_token_used_at,invitation_url,sheet_url,delivered_at,order_payload,created_at,updated_at&limit=1`
  );
  const rows = (await response.json()) as StoredOrder[];
  return rows[0] || null;
};

export const findOrderByNumber = async (orderNumber: string) => {
  const response = await supabaseRequest(
    `orders?order_number=eq.${encodeURIComponent(orderNumber.toUpperCase())}&select=order_number,customer_name,customer_email,whatsapp,plan,model_name,language,payment_operation,status,status_token_hash,approval_token_hash,approval_token_used_at,invitation_url,sheet_url,delivered_at,order_payload,created_at,updated_at&limit=1`
  );
  const rows = (await response.json()) as StoredOrder[];
  return rows[0] || null;
};

const contactMatchesOrder = (order: StoredOrder, contact: string) => {
  const normalized = contact.trim().toLowerCase();
  return order.customer_email.toLowerCase() === normalized ||
    order.whatsapp.replace(/\D/g, '') === contact.replace(/\D/g, '');
};

export const findOrderForLookup = async (identifier: string, contact: string) => {
  const normalizedIdentifier = identifier.trim();
  const isOrderNumber = normalizedIdentifier.toUpperCase().startsWith('SYD-');
  const field = isOrderNumber ? 'order_number' : 'payment_operation';
  const value = isOrderNumber ? normalizedIdentifier.toUpperCase() : normalizedIdentifier;
  const response = await supabaseRequest(
    `orders?${field}=eq.${encodeURIComponent(value)}&select=order_number,customer_name,customer_email,whatsapp,plan,model_name,language,payment_operation,status,status_token_hash,approval_token_hash,approval_token_used_at,invitation_url,sheet_url,delivered_at,order_payload,created_at,updated_at&limit=1`
  );
  const rows = (await response.json()) as StoredOrder[];
  const order = rows[0];
  return order && contactMatchesOrder(order, contact) ? order : null;
};

export const findOrderForPaymentReport = async (
  orderNumber: string,
  contact: string
) => {
  const response = await supabaseRequest(
    `orders?order_number=eq.${encodeURIComponent(orderNumber.toUpperCase())}&select=order_number,customer_name,customer_email,whatsapp,plan,model_name,language,payment_operation,status,status_token_hash,approval_token_hash,approval_token_used_at,invitation_url,sheet_url,delivered_at,order_payload,created_at,updated_at&limit=1`
  );
  const rows = (await response.json()) as StoredOrder[];
  const order = rows[0];
  if (!order) return null;
  return contactMatchesOrder(order, contact) ? order : null;
};

export const updateOrder = async (
  orderNumber: string,
  changes: Record<string, unknown>
) => {
  const response = await supabaseRequest(
    `orders?order_number=eq.${encodeURIComponent(orderNumber)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ...changes, updated_at: new Date().toISOString() })
    }
  );
  const rows = (await response.json()) as StoredOrder[];
  return rows[0];
};

export const appUrl = () =>
  (process.env.PUBLIC_APP_URL || 'https://www.saveyourdate.site').replace(/\/$/, '');

export const customerHelpHtml = (
  language: 'es' | 'en' | 'pt',
  orderNumber: string
) => {
  const question = language === 'en'
    ? 'Questions or changes?'
    : language === 'pt'
      ? 'Dúvidas ou alterações?'
      : '¿Dudas o cambios?';
  const whatsapp = language === 'en' ? 'Chat on WhatsApp' : language === 'pt' ? 'Falar pelo WhatsApp' : 'Escribir por WhatsApp';
  const form = language === 'en' ? 'Contact form' : language === 'pt' ? 'Formulário de contato' : 'Formulario de contacto';
  const whatsappUrl = `https://wa.me/59899134504?text=${encodeURIComponent(`Save Your Date · ${orderNumber}`)}`;
  const formUrl = `${appUrl()}/?pedido=${encodeURIComponent(orderNumber)}#contacto`;
  return `<p style="margin-top:22px;font-size:13px;color:#765f69"><strong>${question}</strong><br>
    <a href="${whatsappUrl}" style="color:#a64064">${whatsapp}</a> ·
    <a href="${formUrl}" style="color:#a64064">${form}</a></p>`;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  idempotencyKey
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) => {
  const apiKey = requiredEnv('RESEND_API_KEY');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      from: process.env.ORDER_EMAIL_FROM || 'Save Your Date <hello@saveyourdate.site>',
      reply_to: process.env.ORDER_ADMIN_EMAIL || 'saveyourdate.invite@gmail.com',
      to: [to],
      subject,
      html
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend respondió ${response.status}: ${detail}`);
  }
};

export const emailShell = (title: string, body: string) => `
  <div style="background:#fff5f8;padding:32px 16px;font-family:Arial,sans-serif;color:#402f38">
    <div style="max-width:580px;margin:auto;background:white;border:1px solid #f1d6df;border-radius:20px;padding:32px">
      <p style="margin:0 0 8px;color:#c85f83;font-weight:700">SAVE YOUR DATE</p>
      <h1 style="font-size:26px;margin:0 0 20px">${title}</h1>
      ${body}
    </div>
  </div>
`;

export const emailButton = (label: string, href: string) =>
  `<p style="margin:28px 0"><a href="${href}" style="display:inline-block;background:#d85f87;color:white;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700">${label}</a></p>`;

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character] || character);
