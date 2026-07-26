import { useEffect, useState } from 'react';

type StatusResponse = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  status: 'pending_payment' | 'payment_reported' | 'payment_validated';
  statusLabel: string;
  updatedAt: string;
};

const steps = [
  { id: 'pending_payment', label: 'Pago pendiente' },
  { id: 'payment_reported', label: 'Pago informado' },
  { id: 'payment_validated', label: 'Pago validado' }
] as const;

export default function OrderStatusPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [order, setOrder] = useState<StatusResponse | null>(null);
  const [error, setError] = useState('');

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

  return (
    <main className="private-order-page">
      <section className="private-order-card">
        <a className="private-order-brand" href="/">SAVE YOUR DATE</a>
        {error ? (
          <>
            <span className="private-order-icon private-order-icon-error">!</span>
            <h1>No encontramos el pedido</h1>
            <p>{error}</p>
          </>
        ) : !order ? (
          <>
            <div className="private-order-loader" />
            <h1>Consultando tu pedido…</h1>
          </>
        ) : (
          <>
            <span className="private-order-kicker">Pedido {order.orderNumber}</span>
            <h1>Hola, {order.customerName}</h1>
            <p>{order.modelName} · Plan {order.plan}</p>
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
              {order.status === 'payment_validated'
                ? 'Tu pago está confirmado. Ya podemos comenzar a preparar la invitación.'
                : order.status === 'payment_reported'
                  ? 'Recibimos el número de operación y estamos verificándolo.'
                  : 'Cuando realices el pago, informanos el número de operación desde la página principal.'}
            </p>
          </>
        )}
        <a className="private-order-home" href="/#crear">Volver a Save Your Date</a>
      </section>
    </main>
  );
}
