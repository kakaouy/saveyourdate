const bytesToBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');
const base64ToBytes = (value: string) => new Uint8Array(Buffer.from(value, 'base64url'));

const encryptionKey = async () => {
  const encoded = process.env.WHATSAPP_CONNECTION_ENCRYPTION_KEY || '';
  if (!encoded) throw new Error('Falta configurar WHATSAPP_CONNECTION_ENCRYPTION_KEY.');
  const raw = base64ToBytes(encoded);
  if (raw.byteLength !== 32) throw new Error('WHATSAPP_CONNECTION_ENCRYPTION_KEY debe contener 32 bytes en base64url.');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

export const encryptEventWhatsAppToken = async (token: string, orderNumber: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(orderNumber) },
    await encryptionKey(),
    new TextEncoder().encode(token),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
};

export const decryptEventWhatsAppToken = async (payload: string, orderNumber: string) => {
  const [version, encodedIv, encodedCiphertext] = payload.split('.');
  if (version !== 'v1' || !encodedIv || !encodedCiphertext) throw new Error('Credencial cifrada inválida.');
  const clear = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(encodedIv), additionalData: new TextEncoder().encode(orderNumber) },
    await encryptionKey(),
    base64ToBytes(encodedCiphertext),
  );
  return new TextDecoder().decode(clear);
};

