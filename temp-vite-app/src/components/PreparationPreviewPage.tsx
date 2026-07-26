import { useEffect, useState } from 'react';

type PreviewResponse = {
  orderNumber: string;
  customerName: string;
  modelName: string;
  modelId: string;
  language: 'es' | 'en' | 'pt';
  status: 'payment_validated' | 'published';
  invitationUrl: string | null;
};

const copy = {
  es: {
    loading: 'Abriendo tu modelo…',
    error: 'No pudimos abrir la vista previa',
    eyebrow: 'PAGO VALIDADO',
    title: 'Estamos preparando tu invitación',
    message: 'Esta es una vista del modelo que elegiste. En breve te enviaremos el link definitivo y personalizado.',
    question: '¿Necesitás cambiar o agregar información?',
    change: 'Solicitar un cambio',
    final: 'Abrir invitación definitiva'
  },
  en: {
    loading: 'Opening your template…',
    error: 'We could not open the preview',
    eyebrow: 'PAYMENT VALIDATED',
    title: 'We are preparing your invitation',
    message: 'This is a preview of your chosen template. We will send your final personalized link shortly.',
    question: 'Do you need to change or add information?',
    change: 'Request a change',
    final: 'Open final invitation'
  },
  pt: {
    loading: 'Abrindo seu modelo…',
    error: 'Não foi possível abrir a prévia',
    eyebrow: 'PAGAMENTO VALIDADO',
    title: 'Estamos preparando seu convite',
    message: 'Esta é uma prévia do modelo escolhido. Em breve enviaremos o link definitivo e personalizado.',
    question: 'Precisa alterar ou adicionar informações?',
    change: 'Solicitar uma alteração',
    final: 'Abrir convite definitivo'
  }
} as const;

export default function PreparationPreviewPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState('');
  const language = preview?.language || 'es';
  const text = copy[language];

  useEffect(() => {
    fetch(`/api/orders/preview?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPreview(data);
      })
      .catch((reason) => setError(reason.message || copy.es.error));
  }, [token]);

  if (error || !preview) {
    return (
      <main className="preparation-preview-state">
        <a className="private-order-brand" href="/">SAVE YOUR DATE</a>
        {error ? <><h1>{text.error}</h1><p>{error}</p></> : <><div className="private-order-loader" /><h1>{text.loading}</h1></>}
      </main>
    );
  }

  if (preview.status === 'published' && preview.invitationUrl) {
    window.location.replace(preview.invitationUrl);
    return null;
  }

  const modelUrl = `/?previewModel=${encodeURIComponent(preview.modelId)}&embeddedPreview=1`;
  const changeUrl = `/?pedido=${encodeURIComponent(preview.orderNumber)}#contacto`;

  return (
    <main className="preparation-preview-page">
      <iframe src={modelUrl} title={`${preview.modelName} — vista previa`} />
      <div className="preparation-watermark" aria-hidden="true">
        <span>VISTA PREVIA · EN PREPARACIÓN</span>
        <span>VISTA PREVIA · EN PREPARACIÓN</span>
        <span>VISTA PREVIA · EN PREPARACIÓN</span>
      </div>
      <section className="preparation-notice" role="dialog" aria-label={text.title}>
        <span>{text.eyebrow}</span>
        <h1>{text.title}</h1>
        <p>{text.message}</p>
        <strong>{text.question}</strong>
        <a href={changeUrl}>{text.change}</a>
      </section>
    </main>
  );
}
