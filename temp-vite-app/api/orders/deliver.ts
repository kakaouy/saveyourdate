import {
  emailButton,
  emailShell,
  escapeHtml,
  findOrderByToken,
  hashToken,
  json,
  sendEmail,
  updateOrder
} from '../_lib/orders.js';

const validHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = String(body.token || '');
    const invitationUrl = String(body.invitationUrl || '').trim();
    const sheetUrl = String(body.sheetUrl || '').trim();
    if (token.length < 32) return json({ error: 'Enlace administrativo inválido.' }, 400);
    if (!validHttpsUrl(invitationUrl)) {
      return json({ error: 'Ingresá un enlace HTTPS válido para la invitación.' }, 400);
    }
    if (sheetUrl && !validHttpsUrl(sheetUrl)) {
      return json({ error: 'El enlace de Google Sheets debe ser HTTPS.' }, 400);
    }

    const order = await findOrderByToken('approval_token_hash', await hashToken(token));
    if (!order) return json({ error: 'Pedido no encontrado.' }, 404);
    if (order.status !== 'payment_validated' && order.status !== 'published') {
      return json({ error: 'El pago debe estar validado antes de entregar la invitación.' }, 409);
    }

    const safeName = escapeHtml(order.customer_name);
    const safeInvitationUrl = escapeHtml(invitationUrl);
    const safeSheetUrl = escapeHtml(sheetUrl);
    const copy = {
      es: {
        subject: `Tu invitación está lista — ${order.order_number}`,
        title: '¡Tu invitación está lista!',
        hello: `Hola ${safeName}, terminamos tu invitación personalizada.`,
        open: 'Abrir mi invitación',
        guideTitle: 'Cómo compartirla',
        guide: `<ul style="padding-left:20px;line-height:1.7">
          <li><strong>WhatsApp:</strong> copiá el enlace y envialo a tus invitados.</li>
          <li><strong>Correo:</strong> pegá el enlace en el mensaje que quieras enviar.</li>
          <li><strong>Instagram:</strong> compartilo por mensaje directo o agregalo temporalmente a tu biografía.</li>
        </ul>`,
        sheet: 'Abrir planilla de respuestas',
        sheetHelp: 'La planilla reúne automáticamente las respuestas de tus invitados.',
        note: 'Guardá este correo: contiene los accesos de tu evento.'
      },
      en: {
        subject: `Your invitation is ready — ${order.order_number}`,
        title: 'Your invitation is ready!',
        hello: `Hi ${safeName}, your personalized invitation is ready.`,
        open: 'Open my invitation',
        guideTitle: 'How to share it',
        guide: `<ul style="padding-left:20px;line-height:1.7">
          <li><strong>WhatsApp:</strong> copy the link and send it to your guests.</li>
          <li><strong>Email:</strong> paste the link into the message you want to send.</li>
          <li><strong>Instagram:</strong> share it by direct message or temporarily add it to your bio.</li>
        </ul>`,
        sheet: 'Open response spreadsheet',
        sheetHelp: 'The spreadsheet automatically collects your guests’ responses.',
        note: 'Keep this email: it contains your event links.'
      },
      pt: {
        subject: `Seu convite está pronto — ${order.order_number}`,
        title: 'Seu convite está pronto!',
        hello: `Olá ${safeName}, seu convite personalizado está pronto.`,
        open: 'Abrir meu convite',
        guideTitle: 'Como compartilhar',
        guide: `<ul style="padding-left:20px;line-height:1.7">
          <li><strong>WhatsApp:</strong> copie o link e envie aos convidados.</li>
          <li><strong>E-mail:</strong> cole o link na mensagem que deseja enviar.</li>
          <li><strong>Instagram:</strong> compartilhe por mensagem direta ou adicione temporariamente à sua bio.</li>
        </ul>`,
        sheet: 'Abrir planilha de respostas',
        sheetHelp: 'A planilha reúne automaticamente as respostas dos convidados.',
        note: 'Guarde este e-mail: ele contém os acessos do seu evento.'
      }
    }[order.language];

    await sendEmail({
      to: order.customer_email,
      subject: copy.subject,
      idempotencyKey: `delivery-${order.order_number}-${(await hashToken(`${invitationUrl}|${sheetUrl}`)).slice(0, 20)}`,
      html: emailShell(
        copy.title,
        `<p>${copy.hello}</p>
         ${emailButton(copy.open, safeInvitationUrl)}
         <h2 style="font-size:18px;margin-top:30px">${copy.guideTitle}</h2>
         ${copy.guide}
         ${sheetUrl ? `<p>${copy.sheetHelp}</p>${emailButton(copy.sheet, safeSheetUrl)}` : ''}
         <p style="font-size:13px;color:#765f69;margin-top:28px">${copy.note}</p>`
      )
    });

    const deliveredAt = new Date().toISOString();
    await updateOrder(order.order_number, {
      status: 'published',
      invitation_url: invitationUrl,
      sheet_url: sheetUrl || null,
      delivered_at: deliveredAt
    });
    return json({ ok: true, orderNumber: order.order_number, deliveredAt });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos entregar la invitación.' }, 500);
  }
}

export default { fetch: handler };
