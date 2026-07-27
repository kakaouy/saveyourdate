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

