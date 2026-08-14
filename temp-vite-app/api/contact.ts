import { emailShell, escapeHtml, json, sendEmail } from './_lib/orders.js';

const CONTACT_EMAIL = 'saveyourdate.invite@gmail.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const message = String(body.message || '').trim();
    const company = String(body.company || '').trim();

    if (company) return json({ ok: true });
    if (!name || !EMAIL_PATTERN.test(email) || !message) {
      return json({ error: 'Completá tu nombre, un email válido y el mensaje.' }, 400);
    }
    if (name.length > 120 || email.length > 254 || message.length > 5000) {
      return json({ error: 'Alguno de los datos es demasiado largo.' }, 400);
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    await sendEmail({
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Nueva consulta desde la web — ${name}`,
      idempotencyKey: `website-contact-${crypto.randomUUID()}`,
      html: emailShell(
        'Nueva consulta desde la web',
        `<p><strong>Nombre:</strong> ${safeName}</p>
         <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
         <p><strong>Mensaje:</strong><br>${safeMessage}</p>`
      )
    });
    return json({ ok: true });
  } catch (error) {
    console.error('No se pudo enviar el formulario de contacto.', error);
    return json({ error: 'No pudimos enviar tu consulta. Intentá nuevamente.' }, 500);
  }
}

export default { fetch: handler };
