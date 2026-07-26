import { useEffect, useState } from 'react';

type ApprovalOrder = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  paymentOperation: string | null;
  status: string;
  invitationUrl: string | null;
  sheetUrl: string | null;
};

export default function PaymentValidationPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [order, setOrder] = useState<ApprovalOrder | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [approved, setApproved] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState('');
  const [progressSuccess, setProgressSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/orders/approve?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setOrder(data);
        setApproved(data.status === 'payment_validated' || data.status === 'published');
        setDelivered(data.status === 'published');
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

  const deliver = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/orders/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          invitationUrl: String(form.get('invitationUrl') || ''),
          sheetUrl: String(form.get('sheetUrl') || '')
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDelivered(true);
      setDeliverySuccess('La entrega quedó guardada y el cliente recibió el email.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos entregar la invitación.');
    } finally {
      setSending(false);
    }
  };

  const sendProgress = async (event: 'order_reviewed' | 'changes_applied') => {
    setSending(true);
    setError('');
    setProgressSuccess('');
    try {
      const response = await fetch('/api/orders/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, event })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProgressSuccess(event === 'order_reviewed'
        ? 'El cliente recibió la confirmación de que revisamos el pedido.'
        : 'El cliente recibió el aviso de modificaciones realizadas.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos enviar la actualización.');
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
            <span className="private-order-icon">{delivered ? '✓' : '↗'}</span>
            <h1>{delivered ? 'Invitación entregada' : 'Pago validado'}</h1>
            <p>Pedido <strong>{order.orderNumber}</strong> · {order.customerName}</p>
            {delivered && !deliverySuccess ? (
              <>
                <p>La invitación ya fue enviada al cliente.</p>
                {order.invitationUrl && <a className="private-order-approve private-order-open-link" href={order.invitationUrl} target="_blank" rel="noopener noreferrer">Abrir invitación</a>}
              </>
            ) : deliverySuccess ? (
              <p className="private-order-delivery-success">{deliverySuccess}</p>
            ) : (
              <>
              <div className="admin-progress-actions">
                <strong>Informar avances</strong>
                <p>Usá solamente el aviso que corresponda. Cada botón envía un email inmediato.</p>
                <button type="button" onClick={() => sendProgress('order_reviewed')} disabled={sending}>Pedido revisado</button>
                <button type="button" onClick={() => sendProgress('changes_applied')} disabled={sending}>Modificaciones realizadas</button>
                {progressSuccess && <p className="private-order-delivery-success">{progressSuccess}</p>}
              </div>
              <form className="delivery-form" onSubmit={deliver}>
                <div className="delivery-form-heading">
                  <strong>Entrega final</strong>
                  <p>Completá estos enlaces recién cuando la invitación personalizada esté terminada. No es necesario hacerlo al validar el pago.</p>
                </div>
                <label>
                  <span>Link de la invitación personalizada</span>
                  <input name="invitationUrl" type="url" required placeholder="https://..." defaultValue={order.invitationUrl || ''} />
                </label>
                <label>
                  <span>Link de Google Sheets <small>(opcional)</small></span>
                  <input name="sheetUrl" type="url" placeholder="https://docs.google.com/..." defaultValue={order.sheetUrl || ''} />
                </label>
                <p className="private-order-warning">Revisá ambos enlaces antes de enviar. El cliente recibirá inmediatamente el email final.</p>
                <button className="private-order-approve" type="submit" disabled={sending}>
                  {sending ? 'Enviando…' : 'Guardar y enviar al cliente'}
                </button>
                {error && <p className="private-order-error">{error}</p>}
              </form>
              </>
            )}
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
