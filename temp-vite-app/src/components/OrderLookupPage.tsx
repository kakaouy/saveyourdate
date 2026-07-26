import { useState } from 'react';

type LookupOrder = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  language: 'es' | 'en' | 'pt';
  status: 'pending_payment' | 'payment_reported' | 'payment_validated' | 'published';
  statusLabel: string;
  nextStep: string;
  paymentOperation: string | null;
  previewUrl: string | null;
  invitationUrl: string | null;
};

const PAYMENT_URL = 'https://mpago.la/2z4ME1Q';
const WHATSAPP_URL = 'https://wa.me/59899134504?text=Hola%20Save%20Your%20Date%2C%20necesito%20ayuda%20con%20mi%20pedido.';

const copy = {
  es: {
    title: 'Consultá tu pedido',
    description: 'Usá el email o WhatsApp del pedido y uno de los dos números que recibiste.',
    contact: 'Email o WhatsApp',
    identifier: 'Número de pedido o número de pago',
    search: 'Consultar estado',
    searching: 'Consultando…',
    order: 'Pedido',
    next: 'Próximo paso',
    payment: 'Informar pago',
    operation: 'Número de operación de Mercado Pago',
    report: 'Enviar número de pago',
    reporting: 'Enviando…',
    reported: 'Pago informado. Lo verificaremos y te avisaremos por email.',
    preview: 'Ver modelo en preparación',
    invitation: 'Abrir invitación definitiva',
    doubts: '¿Tenés dudas?',
    whatsapp: 'Escribir por WhatsApp',
    form: 'Usar formulario de contacto',
    back: 'Volver al sitio'
  },
  en: {
    title: 'Check your order',
    description: 'Use the email or WhatsApp from your order and either reference number.',
    contact: 'Email or WhatsApp',
    identifier: 'Order number or payment number',
    search: 'Check status',
    searching: 'Checking…',
    order: 'Order',
    next: 'Next step',
    payment: 'Report payment',
    operation: 'Mercado Pago transaction number',
    report: 'Send payment number',
    reporting: 'Sending…',
    reported: 'Payment reported. We will verify it and notify you by email.',
    preview: 'View template in preparation',
    invitation: 'Open final invitation',
    doubts: 'Need help?',
    whatsapp: 'Chat on WhatsApp',
    form: 'Use the contact form',
    back: 'Back to the site'
  },
  pt: {
    title: 'Consulte seu pedido',
    description: 'Use o e-mail ou WhatsApp do pedido e um dos dois números recebidos.',
    contact: 'E-mail ou WhatsApp',
    identifier: 'Número do pedido ou do pagamento',
    search: 'Consultar status',
    searching: 'Consultando…',
    order: 'Pedido',
    next: 'Próximo passo',
    payment: 'Informar pagamento',
    operation: 'Número da operação do Mercado Pago',
    report: 'Enviar número do pagamento',
    reporting: 'Enviando…',
    reported: 'Pagamento informado. Vamos verificar e avisar por e-mail.',
    preview: 'Ver modelo em preparação',
    invitation: 'Abrir convite definitivo',
    doubts: 'Tem dúvidas?',
    whatsapp: 'Falar pelo WhatsApp',
    form: 'Usar formulário de contato',
    back: 'Voltar ao site'
  }
} as const;

export default function OrderLookupPage() {
  const initialLanguage = navigator.language.startsWith('pt') ? 'pt' : navigator.language.startsWith('en') ? 'en' : 'es';
  const [language, setLanguage] = useState<'es' | 'en' | 'pt'>(initialLanguage);
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [contact, setContact] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [paymentReported, setPaymentReported] = useState(false);
  const text = copy[language];

  const lookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setPaymentReported(false);
    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, identifier })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOrder(result);
      setLanguage(result.language);
    } catch (reason) {
      setOrder(null);
      setError(reason instanceof Error ? reason.message : 'No pudimos consultar el pedido.');
    } finally {
      setSending(false);
    }
  };

  const reportPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;
    setSending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/orders/report-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          paymentOperation: String(form.get('paymentOperation') || ''),
          contact
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPaymentReported(true);
      setOrder({ ...order, status: 'payment_reported', statusLabel: language === 'es' ? 'Pago informado' : language === 'en' ? 'Payment reported' : 'Pagamento informado' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos informar el pago.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="private-order-page">
      <section className="private-order-card order-lookup-card">
        <a className="private-order-brand" href="/">SAVE YOUR DATE</a>
        <h1>{text.title}</h1>
        <p>{text.description}</p>
        {!order ? (
          <form className="order-lookup-form" onSubmit={lookup}>
            <label><span>{text.contact}</span><input value={contact} onChange={(event) => setContact(event.target.value)} required /></label>
            <label><span>{text.identifier}</span><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoCapitalize="characters" spellCheck={false} /></label>
            {error && <p className="private-order-error">{error}</p>}
            <button className="private-order-approve" type="submit" disabled={sending}>{sending ? text.searching : text.search}</button>
          </form>
        ) : (
          <div className="order-lookup-result">
            <span className="private-order-kicker">{text.order} {order.orderNumber}</span>
            <h2>{order.statusLabel}</h2>
            <p>{order.modelName} · {order.plan}</p>
            <div className="order-next-step"><strong>{text.next}</strong><p>{order.nextStep}</p></div>
            {order.status === 'pending_payment' && !paymentReported && (
              <form className="order-lookup-payment" onSubmit={reportPayment}>
                <a className="mercado-pago-link" href={PAYMENT_URL} target="_blank" rel="noopener noreferrer">{text.payment} ↗</a>
                <label><span>{text.operation}</span><input name="paymentOperation" required /></label>
                <button className="private-order-approve" type="submit" disabled={sending}>{sending ? text.reporting : text.report}</button>
              </form>
            )}
            {paymentReported && <p className="private-order-delivery-success">{text.reported}</p>}
            {order.previewUrl && <a className="private-order-approve private-order-open-link" href={order.previewUrl}>{text.preview}</a>}
            {order.invitationUrl && <a className="private-order-approve private-order-open-link" href={order.invitationUrl}>{text.invitation}</a>}
            {error && <p className="private-order-error">{error}</p>}
            <button className="private-order-home order-lookup-again" type="button" onClick={() => setOrder(null)}>{text.search}</button>
          </div>
        )}
        <div className="order-help-box">
          <strong>{text.doubts}</strong>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{text.whatsapp}</a>
          <a href="/#contacto">{text.form}</a>
        </div>
        <a className="private-order-home" href="/">{text.back}</a>
      </section>
    </main>
  );
}
