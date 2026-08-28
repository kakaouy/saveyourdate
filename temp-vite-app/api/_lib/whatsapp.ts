export const normalizeWhatsAppPhone = (value: string) =>
  value.replace(/\D/g, '').replace(/^00/, '').replace(/^5980/, '598');

export const whatsappConfigured = () =>
  Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_TEMPLATE_NAME &&
    process.env.WHATSAPP_GRAPH_VERSION
  );

export const sendWhatsAppTemplate = async ({
  phone,
  recipientName,
  eventTitle,
  confirmationUrl
}: {
  phone: string;
  recipientName: string;
  eventTitle: string;
  confirmationUrl: string;
}) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (normalizedPhone.length < 8) throw new Error('El número de WhatsApp no es válido.');
  if (!whatsappConfigured()) return { sent: false as const, reason: 'not_configured' as const };
  const version = process.env.WHATSAPP_GRAPH_VERSION!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es' },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: recipientName },
            { type: 'text', text: eventTitle },
            { type: 'text', text: confirmationUrl }
          ]
        }]
      }
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`WhatsApp respondió ${response.status}: ${detail}`);
  }
  const result = await response.json() as { messages?: Array<{ id: string }> };
  return { sent: true as const, messageId: result.messages?.[0]?.id || '' };
};

type ScheduledCommunicationKind = 'invite' | 'reminder' | 'notice' | 'thanks';

export const sendScheduledWhatsAppTemplate = async ({
  kind,
  phone,
  recipientName,
  eventTitle,
  message,
  closing,
  actionUrl,
  imageUrl,
}: {
  kind: ScheduledCommunicationKind;
  phone: string;
  recipientName: string;
  eventTitle: string;
  message: string;
  closing: string;
  actionUrl: string;
  imageUrl?: string;
}) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (normalizedPhone.length < 8) throw new Error('El número de WhatsApp no es válido.');
  const envName = `WHATSAPP_${kind.toUpperCase()}_TEMPLATE_NAME`;
  const templateName = process.env[envName] || ((kind === 'invite' || kind === 'reminder') ? process.env.WHATSAPP_TEMPLATE_NAME : '');
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_GRAPH_VERSION || !templateName) {
    return { sent: false as const, reason: `missing_${envName.toLowerCase()}` };
  }
  const usesLegacyTemplate = templateName === process.env.WHATSAPP_TEMPLATE_NAME && !process.env[envName];
  const components: Array<Record<string, unknown>> = [];
  if (!usesLegacyTemplate && imageUrl) components.push({ type: 'header', parameters: [{ type: 'image', image: { link: imageUrl } }] });
  components.push({
    type: 'body',
    parameters: usesLegacyTemplate
      ? [
          { type: 'text', text: recipientName },
          { type: 'text', text: eventTitle },
          { type: 'text', text: actionUrl },
        ]
      : [
          { type: 'text', text: recipientName },
          { type: 'text', text: eventTitle },
          { type: 'text', text: message },
          { type: 'text', text: closing || '-' },
          { type: 'text', text: actionUrl || '-' },
        ],
  });
  const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(process.env.WHATSAPP_GRAPH_VERSION)}/${encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: { name: templateName, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es' }, components },
    }),
  });
  if (!response.ok) throw new Error(`WhatsApp respondió ${response.status}: ${(await response.text()).slice(0, 700)}`);
  const result = await response.json() as { messages?: Array<{ id: string }> };
  return { sent: true as const, messageId: result.messages?.[0]?.id || '' };
};
