import { useEffect, useMemo, useState } from 'react';
import { AURORA_BUILDER_SECTIONS, auroraConfigFromBuilder } from './aurora/builder';
import { normalizeSectionOrder } from '../domain/invitation-builder';
import type { InvitationBuilderDocument } from '../domain/invitation-builder';
import { builderTemplate } from './invitation-builder/templates';

type ReviewEvent = { id: string; action: string; comment: string | null; actor_type: string; created_at: string };

const actionLabel: Record<string, string> = {
  submitted: 'Enviada a revisión', changes_requested: 'Cambios solicitados', approved: 'Aprobada', published: 'Publicada'
};

export default function InvitationReviewPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [document, setDocument] = useState<InvitationBuilderDocument | null>(null);
  const [identity, setIdentity] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState<ReviewEvent[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const load = () => fetch(`/api/orders/review-invitation?token=${encodeURIComponent(token)}`).then(async (response) => {
    const payload = await response.json() as { error?: string; customerName?: string; orderNumber?: string; document?: Record<string, unknown>; history?: ReviewEvent[] };
    if (!response.ok || !payload.document) throw new Error(payload.error || 'No encontramos el borrador.');
    const stored = payload.document;
    setIdentity(`${payload.customerName} · ${payload.orderNumber}`);
    setHistory(payload.history || []);
    setDocument({ version: 1, templateId: String(stored.template_id), paletteId: String(stored.palette_id), locale: stored.locale as InvitationBuilderDocument['locale'], status: stored.workflow_status as InvitationBuilderDocument['status'], sections: stored.sections as InvitationBuilderDocument['sections'], content: stored.content as InvitationBuilderDocument['content'] });
  }).catch((reason) => setError(reason instanceof Error ? reason.message : 'No pudimos abrir la revisión.'));
  useEffect(() => {
    void load();
  }, [token]);
  const config = useMemo(() => document ? auroraConfigFromBuilder(document) : null, [document]);
  const act = async (action: 'request-changes' | 'approve' | 'publish') => {
    const response = await fetch('/api/orders/review-invitation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action, comment }) });
    const payload = await response.json() as { error?: string; status?: InvitationBuilderDocument['status']; invitationUrl?: string; history?: ReviewEvent[] };
    if (!response.ok) { setMessage(payload.error || 'No se pudo actualizar.'); return; }
    setDocument((current) => current ? { ...current, status: payload.status! } : current);
    setHistory(payload.history || history);
    setComment(''); setShowChanges(false);
    setMessage(action === 'publish' ? `Publicada: ${payload.invitationUrl}` : action === 'approve' ? 'Invitación aprobada.' : 'Cambios solicitados.');
  };
  if (error) return <main className="published-invitation-state"><h1>No pudimos abrir la revisión</h1><p>{error}</p></main>;
  if (!document || !config) return <main className="published-invitation-state"><p>Cargando revisión…</p></main>;
  const template = builderTemplate(document.templateId); const Preview = template.Preview;
  const order = normalizeSectionOrder(AURORA_BUILDER_SECTIONS, document.sections).filter(({ enabled }) => enabled).map(({ id }) => id);
  return <main className="invitation-review-page"><div className="invitation-review-toolbar"><div><strong>{identity}</strong><span>Estado: {document.status}</span></div><div>
    {document.status === 'in_review' && <><button onClick={() => setShowChanges((value) => !value)}>Solicitar cambios</button><button onClick={() => act('approve')}>Aprobar</button></>}
    {document.status === 'approved' && <button onClick={() => act('publish')}>Publicar</button>}
  </div>{showChanges && <div className="invitation-review-comment"><label htmlFor="review-comment">Cambios necesarios</label><textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Detallá qué hay que corregir…" /><button disabled={!comment.trim()} onClick={() => act('request-changes')}>Enviar solicitud</button></div>}{message && <p>{message}</p>}</div><div className="invitation-review-layout"><aside className="invitation-review-history"><h2>Historial</h2>{history.length === 0 ? <p>Todavía no hay acciones registradas.</p> : history.map((event) => <article key={event.id}><strong>{actionLabel[event.action] || event.action}</strong><time>{new Date(event.created_at).toLocaleString('es-UY')}</time>{event.comment && <p>{event.comment}</p>}</article>)}</aside><div className="invitation-review-preview"><Preview locale={document.locale} palette={document.paletteId as never} embedded config={config} sectionOrder={order} /></div></div></main>;
}
