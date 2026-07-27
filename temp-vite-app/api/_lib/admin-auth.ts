import { hashToken, randomToken, supabaseRequest } from './orders.js';

export type LoginCode = {
  id: string;
  order_number: string;
  code_hash: string;
  login_email: string;
  access_role: 'owner' | 'editor' | 'viewer';
  attempts: number;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

const authSecret = () => {
  const value = process.env.ADMIN_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('Falta configurar ADMIN_AUTH_SECRET.');
  return value;
};

export const codeHash = async (challengeId: string, code: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${challengeId}:${code}`)
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

export const createSixDigitCode = () => {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String(100000 + (bytes[0] % 900000));
};

export const createChallenge = async (orderNumber: string, code: string, loginEmail: string, accessRole: 'owner' | 'editor' | 'viewer') => {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await supabaseRequest('admin_login_codes', {
    method: 'POST',
    body: JSON.stringify({
      id,
      order_number: orderNumber,
      login_email: loginEmail,
      access_role: accessRole,
      code_hash: await codeHash(id, code),
      expires_at: expiresAt
    })
  });
  return { id, expiresAt };
};

export const findChallenge = async (id: string) => {
  const response = await supabaseRequest(
    `admin_login_codes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return ((await response.json()) as LoginCode[])[0] || null;
};

export const updateChallenge = (id: string, changes: Record<string, unknown>) =>
  supabaseRequest(`admin_login_codes?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes)
  });

export const recentChallengeCount = async (orderNumber: string, loginEmail: string) => {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const response = await supabaseRequest(
    `admin_login_codes?order_number=eq.${encodeURIComponent(orderNumber)}&login_email=eq.${encodeURIComponent(loginEmail)}&created_at=gte.${encodeURIComponent(since)}&select=id`
  );
  return ((await response.json()) as Array<{ id: string }>).length;
};

export const createSession = async (orderNumber: string, loginEmail: string, accessRole: 'owner' | 'editor' | 'viewer') => {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabaseRequest('admin_sessions', {
    method: 'POST',
    body: JSON.stringify({
      order_number: orderNumber,
      login_email: loginEmail,
      access_role: accessRole,
      token_hash: await hashToken(token),
      expires_at: expiresAt
    })
  });
  return { token, expiresAt };
};

export const sessionCookie = (token: string, maxAge = 86400) =>
  `syd_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export const readSessionToken = (request: Request) => {
  const cookie = request.headers.get('cookie') || '';
  return cookie.match(/(?:^|;\s*)syd_admin_session=([^;]+)/)?.[1] || '';
};

export const findSession = async (token: string) => {
  if (!token) return null;
  const response = await supabaseRequest(
    `admin_sessions?token_hash=eq.${await hashToken(token)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,order_number,login_email,access_role,expires_at&limit=1`
  );
  return ((await response.json()) as Array<{ id: string; order_number: string; login_email: string; access_role: 'owner' | 'editor' | 'viewer'; expires_at: string }>)[0] || null;
};
