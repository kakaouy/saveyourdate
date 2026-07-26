import { useEffect, useState } from 'react';

type ApprovalOrder = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  paymentOperation: string | null;
  status: string;
};

export default function PaymentValidationPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [order, setOrder] = useState<ApprovalOrder | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/approve?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setOrder(data);
        setApproved(data.status === 'payment_validated');
      })
      .catch((reason) => setError(reason.message || 'No pudimos abrir el pedido.'));
  }, [token]);

  const approve = async () => {
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setApproved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos validar el pago.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="private-order-page">
      <section className="private-order-card">
        <a className="private-order-brand" href="/">SAVE YOUR DATE</a>
        {error && !order ? (
          <><h1>Enlace inválido</h1><p>{error}</p></>
        ) : !order ? (
          <><div className="private-order-loader" /><h1>Abriendo el pedido…</h1></>
        ) : approved ? (
          <>
            <span className="private-order-icon">✓</span>
            <h1>Pago validado</h1>
            <p>El pedido <strong>{order.orderNumber}</strong> quedó aprobado y el cliente recibió el aviso por email.</p>
          </>
        ) : (
          <>
            <span className="private-order-kicker">Validación manual</span>
            <h1>{order.orderNumber}</h1>
            <div className="approval-summary">
              <p><strong>Cliente</strong><span>{order.customerName}</span></p>
              <p><strong>Plan</strong><span>{order.plan}</span></p>
              <p><strong>Modelo</strong><span>{order.modelName}</span></p>
              <p><strong>Operación</strong><span>{order.paymentOperation || 'No informada'}</span></p>
            </div>
            <p className="private-order-warning">Confirmá en Mercado Pago que el cobro fue recibido antes de aprobarlo.</p>
            <button className="private-order-approve" onClick={approve} disabled={sending || !order.paymentOperation}>
              {sending ? 'Validando…' : 'Sí, validar pago'}
            </button>
            {!order.paymentOperation && <p className="private-order-error">El cliente todavía debe informar el número de operación.</p>}
            {error && <p className="private-order-error">{error}</p>}
          </>
        )}
        <a className="private-order-home" href="/">Volver al sitio</a>
      </section>
    </main>
  );
}
