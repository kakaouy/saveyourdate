import { useEffect, useState } from 'react';

type StatusResponse = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  language: 'es' | 'en' | 'pt';
  status: 'pending_payment' | 'payment_reported' | 'payment_validated' | 'published';
  statusLabel: string;
  invitationUrl: string | null;
  updatedAt: string;
};

const copy = {
  es: {
    checking: 'Consultando tu pedido…',
    notFound: 'No encontramos el pedido',
    order: 'Pedido',
    hello: 'Hola',
    plan: 'Plan',
    steps: ['Pago pendiente', 'Pago informado', 'Pago validado', 'Invitación entregada'],
    open: 'Abrir mi invitación',
    delivered: 'Tu invitación ya está publicada y lista para compartir.',
    validated: 'Tu pago está confirmado. Ya podemos comenzar a preparar la invitación.',
    reported: 'Recibimos el número de operación y estamos verificándolo.',
    pending: 'Cuando realices el pago, informanos el número de operación desde la página principal.',
    back: 'Volver a Save Your Date'
  },
  en: {
    checking: 'Checking your order…',
    notFound: 'We could not find the order',
    order: 'Order',
    hello: 'Hi',
    plan: 'Plan',
    steps: ['Payment pending', 'Payment reported', 'Payment validated', 'Invitation delivered'],
    open: 'Open my invitation',
    delivered: 'Your invitation is published and ready to share.',
    validated: 'Your payment is confirmed. We can now start preparing your invitation.',
    reported: 'We received the transaction number and are verifying it.',
    pending: 'After paying, report the transaction number from the main page.',
    back: 'Back to Save Your Date'
  },
  pt: {
    checking: 'Consultando seu pedido…',
    notFound: 'Não encontramos o pedido',
    order: 'Pedido',
    hello: 'Olá',
    plan: 'Plano',
    steps: ['Pagamento pendente', 'Pagamento informado', 'Pagamento validado', 'Convite entregue'],
    open: 'Abrir meu convite',
    delivered: 'Seu convite está publicado e pronto para compartilhar.',
    validated: 'Seu pagamento está confirmado. Já podemos começar a preparar o convite.',
    reported: 'Recebemos o número da operação e estamos verificando.',
    pending: 'Após o pagamento, informe o número da operação na página principal.',
    back: 'Voltar ao Save Your Date'
  }
} as const;

export default function OrderStatusPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [order, setOrder] = useState<StatusResponse | null>(null);
  const [error, setError] = useState('');
  const language = order?.language || (
    navigator.language.startsWith('pt')
      ? 'pt'
      : navigator.language.startsWith('en')
        ? 'en'
        : 'es'
  );
  const text = copy[language];
  const steps = [
    { id: 'pending_payment', label: text.steps[0] },
    { id: 'payment_reported', label: text.steps[1] },
    { id: 'payment_validated', label: text.steps[2] },
    { id: 'published', label: text.steps[3] }
  ] as const;

  useEffect(() => {
    fetch(`/api/orders/status?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setOrder(data);
      })
      .catch((reason) => setError(reason.message || 'No pudimos consultar el pedido.'));
  }, [token]);

  const activeIndex = order
    ? steps.findIndex((step) => step.id === order.status)
    : -1;
  const displayPlan = order?.plan === 'Básico' && language === 'en'
    ? 'Basic'
    : order?.plan || '';

  return (
    <main className="private-order-page">
      <section className="private-order-card">
        <a className="private-order-brand" href="/">SAVE YOUR DATE</a>
        {error ? (
          <>
            <span className="private-order-icon private-order-icon-error">!</span>
            <h1>{text.notFound}</h1>
            <p>{error}</p>
          </>
        ) : !order ? (
          <>
            <div className="private-order-loader" />
            <h1>{text.checking}</h1>
          </>
        ) : (
          <>
            <span className="private-order-kicker">{text.order} {order.orderNumber}</span>
            <h1>{text.hello}, {order.customerName}</h1>
            <p>{order.modelName} · {text.plan} {displayPlan}</p>
            <div className="order-status-steps">
              {steps.map((step, index) => (
                <div className={index <= activeIndex ? 'complete' : ''} key={step.id}>
                  <span>{index <= activeIndex ? '✓' : index + 1}</span>
                  <strong>{step.label}</strong>
                </div>
              ))}
            </div>
            <strong className="private-order-current">{order.statusLabel}</strong>
            <p className="private-order-help">
              {order.status === 'published'
                ? text.delivered
                : order.status === 'payment_validated'
                ? text.validated
                : order.status === 'payment_reported'
                  ? text.reported
                  : text.pending}
            </p>
            {order.invitationUrl && <a className="private-order-approve private-order-open-link" href={order.invitationUrl} target="_blank" rel="noopener noreferrer">{text.open}</a>}
          </>
        )}
        <a className="private-order-home" href="/#crear">{text.back}</a>
      </section>
    </main>
  );
}
