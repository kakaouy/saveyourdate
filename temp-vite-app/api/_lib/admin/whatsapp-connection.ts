import { findSession, readSessionToken } from '../admin-auth.js';
import { encryptEventWhatsAppToken } from '../event-whatsapp-crypto.js';
import { json, supabaseRequest } from '../orders.js';
import { logAdminActivity } from './audit.js';

type ConnectionRow = {
  status: 'disconnected' | 'pending' | 'connected' | 'error';
  display_phone_number: string | null;
  verified_name: string | null;
  connected_at: string | null;
  last_verified_at: string | null;
  last_error: string | null;
};

const metaConfiguration = () => ({
  appId: process.env.META_APP_ID || '',
  configId: process.env.META_EMBEDDED_SIGNUP_CONFIG_ID || '',
  appSecret: process.env.META_APP_SECRET || '',
  graphVersion: process.env.META_GRAPH_VERSION || '',
  encryptionKey: process.env.WHATSAPP_CONNECTION_ENCRYPTION_KEY || '',
});

const publicConnection = (row?: ConnectionRow) => ({
  status: row?.status || 'disconnected',
  displayPhoneNumber: row?.display_phone_number || '',
  verifiedName: row?.verified_name || '',
  connectedAt: row?.connected_at || '',
  lastVerifiedAt: row?.last_verified_at || '',
  error: row?.last_error || '',
});

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    const config = metaConfiguration();
    const configured = Boolean(config.appId && config.configId && config.appSecret && config.graphVersion && config.encryptionKey);

    if (request.method === 'GET') {
      const response = await supabaseRequest(
        `event_whatsapp_connections?order_number=eq.${encodeURIComponent(session.order_number)}&select=status,display_phone_number,verified_name,connected_at,last_verified_at,last_error&limit=1`,
      );
      const row = ((await response.json()) as ConnectionRow[])[0];
      return json({
        ...publicConnection(row),
        configured,
        embeddedSignup: configured ? { appId: config.appId, configId: config.configId, graphVersion: config.graphVersion } : null,
      });
    }

    if (!['owner', 'admin'].includes(session.access_role)) return json({ error: 'No tenés permiso para conectar WhatsApp.' }, 403);

    if (request.method === 'POST') {
      if (!configured) return json({ error: 'La conexión de Meta todavía no está configurada en este entorno.' }, 503);
      const body = await request.json() as Record<string, unknown>;
      const code = String(body.code || '').trim();
      const phoneNumberId = String(body.phoneNumberId || '').trim();
      const wabaId = String(body.wabaId || '').trim();
      if (!code || !phoneNumberId || !wabaId) return json({ error: 'Meta no devolvió todos los datos de la conexión.' }, 400);

      const tokenUrl = new URL(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token`);
      tokenUrl.searchParams.set('client_id', config.appId);
      tokenUrl.searchParams.set('client_secret', config.appSecret);
      tokenUrl.searchParams.set('code', code);
      const tokenResponse = await fetch(tokenUrl, { headers: { Accept: 'application/json' } });
      const tokenResult = await tokenResponse.json() as { access_token?: string; expires_in?: number; error?: { message?: string } };
      if (!tokenResponse.ok || !tokenResult.access_token) throw new Error(tokenResult.error?.message || 'Meta no pudo validar la conexión.');

      const phoneResponse = await fetch(
        `https://graph.facebook.com/${config.graphVersion}/${encodeURIComponent(phoneNumberId)}?fields=id,display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${tokenResult.access_token}`, Accept: 'application/json' } },
      );
      const phone = await phoneResponse.json() as { id?: string; display_phone_number?: string; verified_name?: string; error?: { message?: string } };
      if (!phoneResponse.ok || phone.id !== phoneNumberId) throw new Error(phone.error?.message || 'No pudimos verificar el número conectado.');

      const now = new Date().toISOString();
      const expiresAt = tokenResult.expires_in ? new Date(Date.now() + tokenResult.expires_in * 1000).toISOString() : null;
      await supabaseRequest('event_whatsapp_connections?on_conflict=order_number', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          order_number: session.order_number,
          status: 'connected',
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          display_phone_number: phone.display_phone_number || '',
          verified_name: phone.verified_name || '',
          access_token_ciphertext: await encryptEventWhatsAppToken(tokenResult.access_token, session.order_number),
          token_expires_at: expiresAt,
          connected_at: now,
          last_verified_at: now,
          last_error: null,
          updated_at: now,
        }),
      });
      await logAdminActivity(session, 'whatsapp.connected', 'settings', session.order_number, { phoneNumberId, wabaId, displayPhoneNumber: phone.display_phone_number || '' });
      return json({ ...publicConnection({ status: 'connected', display_phone_number: phone.display_phone_number || '', verified_name: phone.verified_name || '', connected_at: now, last_verified_at: now, last_error: null }), configured: true });
    }

    if (request.method === 'DELETE') {
      await supabaseRequest(`event_whatsapp_connections?order_number=eq.${encodeURIComponent(session.order_number)}`, { method: 'DELETE' });
      await logAdminActivity(session, 'whatsapp.disconnected', 'settings', session.order_number, {});
      return json({ ...publicConnection(), configured });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'No pudimos gestionar la conexión de WhatsApp.' }, 500);
  }
}

export default { fetch: handler };
