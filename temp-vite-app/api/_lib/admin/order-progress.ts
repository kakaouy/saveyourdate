import {
  appUrl,
  customerHelpHtml,
  emailButton,
  emailShell,
  findOrderByToken,
  hashToken,
  json,
  previewTokenFor,
  sendEmail
} from '../orders.js';

async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = String(body.token || '');
    const event = String(body.event || '');
    if (!['order_reviewed', 'changes_applied'].includes(event)) {
      return json({ error: 'Novedad inválida.' }, 400);
    }
    const order = await findOrderByToken('approval_token_hash', await hashToken(token));
    if (!order) return json({ error: 'Pedido no encontrado.' }, 404);
    if (order.status !== 'payment_validated') {
      return json({ error: 'El pedido debe estar en preparación.' }, 409);
    }
    const previewUrl = `${appUrl()}/preparando?token=${encodeURIComponent(await previewTokenFor(order.order_number))}`;
    const copy = event === 'order_reviewed'
      ? {
          es: [`[${order.order_number}] Pedido revisado — tu invitación está en preparación`, 'Revisamos tu pedido', 'La información está en revisión y ya estamos preparando tu invitación. El próximo paso será enviarte una actualización o la entrega final.', 'Ver modelo en preparación'],
          en: [`[${order.order_number}] Order reviewed — your invitation is in preparation`, 'We reviewed your order', 'Your information has been reviewed and we are preparing the invitation. Next, we will send an update or the final delivery.', 'View template in preparation'],
          pt: [`[${order.order_number}] Pedido revisado — seu convite está em preparação`, 'Revisamos seu pedido', 'As informações foram revisadas e estamos preparando o convite. Depois, enviaremos uma atualização ou a entrega final.', 'Ver modelo em preparação']
        }[order.language]
      : {
          es: [`[${order.order_number}] Modificaciones realizadas — revisá los cambios`, 'Aplicamos las modificaciones', 'Los cambios solicitados ya fueron realizados. Revisalos y, si está todo bien, no necesitás hacer nada más.', 'Revisar cambios'],
          en: [`[${order.order_number}] Changes completed — review the update`, 'We applied your changes', 'The requested changes are ready. Review them and, if everything looks good, no further action is needed.', 'Review changes'],
          pt: [`[${order.order_number}] Alterações realizadas — revise as mudanças`, 'Aplicamos as alterações', 'As alterações solicitadas foram realizadas. Revise-as e, se estiver tudo certo, não precisa fazer mais nada.', 'Revisar alterações']
        }[order.language];
    await sendEmail({
      to: order.customer_email,
      subject: copy[0],
      idempotencyKey: `progress-${event}-${order.order_number}-${Date.now()}`,
      html: emailShell(copy[1], `<p>${copy[2]}</p>${emailButton(copy[3], previewUrl)}${customerHelpHtml(order.language, order.order_number)}`)
    });
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos enviar la actualización.' }, 500);
  }
}

export default { fetch: handler };
