import { useEffect, useMemo, useState } from 'react';
import { auroraConfigFromBuilder } from '../aurora/builder';
import { moveInvitationSection, normalizeSectionOrder } from '../../domain/invitation-builder';
import type { InvitationBuilderDocument } from '../../domain/invitation-builder';
import { validateInvitationForReview } from '../../domain/invitation-validation';
import { switchInvitationTemplate } from '../../domain/invitation-template-switch';
import { BUILDER_TEMPLATES, builderSectionDefinitions, builderTemplate } from './templates';
import './invitation-builder.css';
import './builder-persistence.css';
import './mobile-preview.css';

type WorkflowCapabilities = { canEdit: boolean; canApprove: boolean; canPublish: boolean; requiresPlatformReview: boolean };
type SavedSetup = { id: string; name: string; payload: Partial<InvitationBuilderDocument>; updated_at: string };
type ReviewEvent = { id: string; action: string; comment: string | null; actor_type: string; created_at: string };
type BuilderStepId = 'design' | 'event' | 'sections' | 'copy' | 'media' | 'extras' | 'review';
const BUILDER_STEPS: Array<{ id: BuilderStepId; label: string; shortLabel: string; description: string; icon: string }> = [
  { id: 'design', label: 'Elegí el estilo', shortLabel: 'Diseño', description: 'Modelo, idioma y colores', icon: '✦' },
  { id: 'event', label: 'Datos del evento', shortLabel: 'Evento', description: 'Nombre, fecha y lugar', icon: '♡' },
  { id: 'sections', label: 'Armá la invitación', shortLabel: 'Secciones', description: 'Qué mostrar y en qué orden', icon: '▦' },
  { id: 'copy', label: 'Personalizá los textos', shortLabel: 'Textos', description: 'Mensajes y botones', icon: '✎' },
  { id: 'media', label: 'Sumá tus imágenes', shortLabel: 'Fotos', description: 'Portada y galería', icon: '▣' },
  { id: 'extras', label: 'Agregá los detalles', shortLabel: 'Extras', description: 'Regalos, QR y alojamiento', icon: '＋' },
  { id: 'review', label: 'Revisá y terminá', shortLabel: 'Revisar', description: 'Validación y envío', icon: '✓' },
];
const stepForValidationField = (field: string): BuilderStepId => {
  if (field.startsWith('event-')) return 'event';
  if (['hero-image', 'parallax-image', 'gallery'].includes(field)) return 'media';
  if (field === 'schedule') return 'sections';
  if (['hotels', 'photo-upload', 'instagram', 'qr-pass', 'gift-holder', 'gift-account'].includes(field)) return 'extras';
  return 'review';
};
const SECTION_COPY_FIELDS = [
  ['Cuenta regresiva', [['countdownEyebrow', 'Texto superior'], ['countdownTitle', 'Título']]],
  ['Ubicación', [['locationTitle', 'Título'], ['mapLabel', 'Botón del mapa'], ['calendarLabel', 'Botón de calendario']]],
  ['Vestimenta y cronograma', [['dressTitle', 'Título de vestimenta'], ['dressButton', 'Botón de vestimenta'], ['scheduleTitle', 'Título del cronograma']]],
  ['Foto, galería y alojamiento', [['parallaxTitle', 'Frase sobre la foto'], ['galleryTitle', 'Título de galería'], ['galleryCopy', 'Descripción de galería'], ['hotelsTitle', 'Título de alojamiento'], ['hotelsCopy', 'Descripción de alojamiento'], ['hotelsButton', 'Botón de alojamiento']]],
  ['Regalos y fotos', [['giftsTitle', 'Título de regalos'], ['giftsCopy', 'Descripción de regalos'], ['giftsButton', 'Botón de regalos'], ['photosTitle', 'Título del álbum'], ['photosCopy', 'Descripción del álbum'], ['photosButton', 'Botón del álbum']]],
  ['Redes, canciones y pase', [['socialTitle', 'Título de redes'], ['socialCopy', 'Descripción de redes'], ['socialButton', 'Botón de redes'], ['songsTitle', 'Título de canciones'], ['songsCopy', 'Descripción de canciones'], ['songsButton', 'Botón de canciones'], ['qrTitle', 'Título del pase'], ['qrCopy', 'Descripción del pase'], ['qrButton', 'Botón del pase']]],
  ['Confirmación', [['rsvpTitle', 'Título'], ['rsvpButton', 'Botón']]]
] as const;

export default function InvitationBuilderPage() {
  const [document, setDocument] = useState<InvitationBuilderDocument>(() => {
    const requestedTemplate = new URLSearchParams(window.location.search).get('builder') || 'aurora';
    return builderTemplate(requestedTemplate).createDocument();
  });
  const [viewport, setViewport] = useState<'phone' | 'desktop'>('phone');
  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowCapabilities>({ canEdit: true, canApprove: false, canPublish: false, requiresPlatformReview: true });
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>([]);
  const [setupName, setSetupName] = useState('');
  const [reviewHistory, setReviewHistory] = useState<ReviewEvent[]>([]);
  const [activeStep, setActiveStep] = useState<BuilderStepId>('design');
  const [unsupportedRequestedModel, setUnsupportedRequestedModel] = useState('');
  const config = useMemo(() => auroraConfigFromBuilder(document), [document]);
  const event = config.event!;
  const content = config.content!;
  const editableContent = content as typeof content & Record<string, string | undefined>;
  const links = config.links!;
  const gifts = config.gifts!;
  const assets = config.assets!;
  const schedule = config.schedule || [];
  const gallery = config.gallery || [];
  const hotels = config.hotels || [];
  const qrPass = config.qrPass!;
  const template = builderTemplate(document.templateId);
  const Preview = template.Preview;
  const sectionDefinitions = useMemo(() => builderSectionDefinitions(document.templateId, document.sections.map(({ id }) => id)), [document.templateId, document.sections]);
  const validationIssues = useMemo(() => validateInvitationForReview(document), [document]);
  const canEditDocument = workflow.canEdit && ['draft', 'changes_requested'].includes(document.status) && !unsupportedRequestedModel;
  const activeStepIndex = BUILDER_STEPS.findIndex(({ id }) => id === activeStep);
  const goToStep = (step: BuilderStepId) => {
    setActiveStep(step);
    window.document.querySelector('.builder-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToAdjacentStep = (direction: -1 | 1) => {
    const next = BUILDER_STEPS[activeStepIndex + direction];
    if (next) goToStep(next.id);
  };

  const updateDocument = (change: Partial<InvitationBuilderDocument>) => {
    if (!canEditDocument) return;
    setSaved(false);
    setDirty(true);
    setDocument((current) => ({ ...current, ...change }));
  };
  const updateContentGroup = (group: string, field: string, value: unknown) => updateDocument({
    content: {
      ...document.content,
      [group]: { ...(document.content[group] as Record<string, unknown>), [field]: value }
    }
  });
  const updateArrayItem = (group: 'schedule' | 'gallery' | 'hotels', index: number, field: string, value: string) => {
    const items = [...((document.content[group] as Array<Record<string, unknown>>) || [])];
    items[index] = { ...items[index], [field]: value };
    updateDocument({ content: { ...document.content, [group]: items } });
  };
  const addArrayItem = (group: 'schedule' | 'gallery' | 'hotels') => {
    const items = [...((document.content[group] as Array<Record<string, unknown>>) || [])];
    items.push(group === 'schedule'
      ? { time: '21:00', title: '', description: '' }
      : group === 'gallery'
        ? { src: assets.parallax, alt: '' }
        : { name: '', address: '', distance: '', phone: '', bookingUrl: '', discount: '', notes: '' });
    updateDocument({ content: { ...document.content, [group]: items } });
  };
  const removeArrayItem = (group: 'schedule' | 'gallery' | 'hotels', index: number) => {
    const items = [...((document.content[group] as Array<Record<string, unknown>>) || [])];
    items.splice(index, 1);
    updateDocument({ content: { ...document.content, [group]: items } });
  };
  const toggle = (id: string) => updateDocument({
    sections: document.sections.map((section) => section.id === id ? { ...section, enabled: !section.enabled } : section)
  });
  const move = (id: string, direction: -1 | 1) => updateDocument({
    sections: moveInvitationSection(sectionDefinitions, document.sections, id, direction)
  });
  const ordered = normalizeSectionOrder(sectionDefinitions, document.sections);
  const changeTemplate = (templateId: string) => {
    if (!workflow.canEdit || !['draft', 'changes_requested'].includes(document.status)) return;
    const selected = builderTemplate(templateId);
    const next = selected.createDocument();
    const url = new URL(window.location.href);
    url.searchParams.set('builder', selected.id);
    window.history.replaceState(null, '', url);
    setSaved(false);
    setDirty(true);
    setUnsupportedRequestedModel('');
    setDocument(switchInvitationTemplate(document, next));
  };

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty]);

  useEffect(() => {
    fetch('/api/admin/invitation-builder').then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { document?: Record<string, unknown> | null; workflow?: WorkflowCapabilities; reviewHistory?: ReviewEvent[]; requestedModel?: string; suggestedTemplateId?: string | null };
      setAuthenticated(true);
      if (payload.workflow) setWorkflow(payload.workflow);
      setReviewHistory(payload.reviewHistory || []);
      fetch('/api/admin/resources?kind=invitation_setup').then(async (resourceResponse) => {
        if (resourceResponse.ok) setSavedSetups(((await resourceResponse.json()) as { resources: SavedSetup[] }).resources);
      }).catch(() => undefined);
      if (!payload.document) {
        if (payload.suggestedTemplateId) {
          const suggested = builderTemplate(payload.suggestedTemplateId);
          setDocument(suggested.createDocument());
          const url = new URL(window.location.href);
          url.searchParams.set('builder', suggested.id);
          window.history.replaceState(null, '', url);
        } else if (payload.requestedModel) {
          setUnsupportedRequestedModel(payload.requestedModel);
        }
        return;
      }
      const stored = payload.document;
      setDocument({ version: 1, templateId: String(stored.template_id), paletteId: String(stored.palette_id),
        locale: stored.locale as InvitationBuilderDocument['locale'], sections: stored.sections as InvitationBuilderDocument['sections'],
        content: stored.content as InvitationBuilderDocument['content'], status: stored.workflow_status as InvitationBuilderDocument['status'] });
      setSaved(true);
      setDirty(false);
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    if (!canEditDocument) { setMessage('Esta invitación no está habilitada para edición en su estado actual.'); return false; }
    if (!authenticated) { setMessage('Modo demostración: iniciá sesión en el panel para guardar.'); return false; }
    setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/admin/invitation-builder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(document) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar.');
      setSaved(true); setDirty(false); setMessage('Borrador guardado.'); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar.'); return false; }
    finally { setSaving(false); }
  };

  const submitForReview = async () => {
    if (validationIssues.length > 0) {
      setMessage(`Faltan ${validationIssues.length} ${validationIssues.length === 1 ? 'dato' : 'datos'} antes de enviar a revisión.`);
      goToStep('review');
      return;
    }
    if (!(await save())) return;
    const response = await fetch('/api/admin/invitation-builder', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit' }) });
    const payload = await response.json() as { error?: string; document?: { workflow_status: InvitationBuilderDocument['status'] } };
    if (!response.ok) { setMessage(payload.error || 'No se pudo enviar a revisión.'); return; }
    setDocument((current) => ({ ...current, status: payload.document!.workflow_status }));
    setMessage('Invitación enviada a revisión.');
  };

  const workflowAction = async (action: 'request-changes' | 'approve' | 'publish') => {
    setMessage('');
    const comment = action === 'request-changes' ? window.prompt('Detallá qué cambios necesita la invitación:')?.trim() : '';
    if (action === 'request-changes' && !comment) return;
    const response = await fetch('/api/admin/invitation-builder', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, comment }) });
    const payload = await response.json() as { error?: string; document?: { workflow_status: InvitationBuilderDocument['status'] } };
    if (!response.ok) { setMessage(payload.error || 'No se pudo actualizar el estado.'); return; }
    setDocument((current) => ({ ...current, status: payload.document!.workflow_status }));
    setMessage(action === 'approve' ? 'Invitación aprobada.' : action === 'publish' ? 'Invitación publicada.' : 'Se solicitaron cambios.');
  };
  const saveSetup = async () => {
    if (!canEditDocument) return;
    const name = setupName.trim();
    if (!name) { setMessage('Ingresá un nombre para la configuración reutilizable.'); return; }
    const reusable: Partial<InvitationBuilderDocument> = {
      version: 1, templateId: document.templateId, paletteId: document.paletteId, locale: document.locale,
      sections: document.sections,
      content: {
        content: document.content.content,
        schedule: document.content.schedule,
        hotels: document.content.hotels,
        metadata: document.content.metadata
      }
    };
    const response = await fetch('/api/admin/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'invitation_setup', name, payload: reusable }) });
    const payload = await response.json() as { error?: string; resource?: SavedSetup };
    if (!response.ok) { setMessage(payload.error || 'No se pudo guardar en la biblioteca.'); return; }
    setSavedSetups((current) => [...current.filter((item) => item.name !== name), payload.resource!].sort((a, b) => a.name.localeCompare(b.name)));
    setSetupName(''); setMessage('Configuración guardada en la biblioteca de la cuenta.');
  };
  const applySetup = (id: string) => {
    if (!canEditDocument) return;
    const setup = savedSetups.find((item) => item.id === id);
    if (!setup) return;
    const selectedTemplate = builderTemplate(String(setup.payload.templateId || document.templateId));
    const base = selectedTemplate.createDocument();
    setDocument((current) => ({
      ...base,
      locale: current.locale,
      paletteId: String(setup.payload.paletteId || base.paletteId),
      sections: setup.payload.sections || base.sections,
      content: {
        ...base.content,
        content: { ...(base.content.content as object), ...(setup.payload.content?.content as object) },
        schedule: setup.payload.content?.schedule || base.content.schedule,
        hotels: setup.payload.content?.hotels || base.content.hotels
      },
      status: 'draft'
    }));
    setSaved(false); setDirty(true); setMessage(`Aplicaste “${setup.name}”. Revisá los datos del evento antes de guardar.`);
  };

  return <main className="builder-page">
    <header className="builder-header">
      <a href="/">← Volver</a><div><strong>Armá tu invitación</strong><span>{template.label} · {document.status === 'draft' ? 'Borrador' : document.status === 'in_review' ? 'En revisión' : document.status}{dirty ? ' · Cambios sin guardar' : ''}</span></div>
      <div className="builder-header-actions">
        {workflow.canEdit && <button onClick={save} disabled={saving || !canEditDocument}>{saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar borrador'}</button>}
        {workflow.canEdit && ['draft','changes_requested'].includes(document.status) && <button onClick={submitForReview} disabled={saving || Boolean(unsupportedRequestedModel)}>Enviar a revisión</button>}
        {workflow.canApprove && document.status === 'in_review' && <><button onClick={() => workflowAction('request-changes')}>Solicitar cambios</button><button onClick={() => workflowAction('approve')}>Aprobar</button></>}
        {workflow.canPublish && document.status === 'approved' && <button onClick={() => workflowAction('publish')}>Publicar</button>}
      </div>
    </header>
    <div className="builder-layout" data-mobile-panel={mobilePanel}>
      <aside className={`builder-panel ${!canEditDocument && !unsupportedRequestedModel ? 'is-readonly' : ''}`} id="builder-editor">
        <div className="builder-progress" aria-label="Progreso del constructor">
          <div className="builder-progress-heading"><span>Paso {activeStepIndex + 1} de {BUILDER_STEPS.length}</span><strong>{Math.round(((activeStepIndex + 1) / BUILDER_STEPS.length) * 100)}%</strong></div>
          <div className="builder-progress-track"><span style={{ width: `${((activeStepIndex + 1) / BUILDER_STEPS.length) * 100}%` }} /></div>
          <nav className="builder-step-nav" aria-label="Secciones del constructor">
            {BUILDER_STEPS.map((step, index) => <button key={step.id} type="button" className={activeStep === step.id ? 'active' : index < activeStepIndex ? 'complete' : ''} aria-current={activeStep === step.id ? 'step' : undefined} onClick={() => goToStep(step.id)}><span>{index < activeStepIndex ? '✓' : step.icon}</span><small>{step.shortLabel}</small></button>)}
          </nav>
        </div>
        <div className="builder-step-intro"><span>{BUILDER_STEPS[activeStepIndex].icon}</span><div><p>Paso {activeStepIndex + 1}</p><h1>{BUILDER_STEPS[activeStepIndex].label}</h1><small>{BUILDER_STEPS[activeStepIndex].description}</small></div></div>
        {!['draft', 'changes_requested'].includes(document.status) && <div className="builder-readonly-notice" role="status"><strong>Vista de consulta</strong><p>{document.status === 'in_review' ? 'La invitación está en revisión. Para editarla nuevamente primero deben solicitarse cambios.' : document.status === 'approved' ? 'La invitación está aprobada y ya no admite cambios de contenido.' : 'La invitación está publicada. Creá un nuevo ciclo de cambios antes de modificarla.'}</p></div>}
        {unsupportedRequestedModel && <div className="builder-compatibility-warning" role="alert"><strong>Este pedido usa un modelo tradicional</strong><p>El cliente eligió “{unsupportedRequestedModel}”, que todavía no tiene adaptación al Constructor modular. El guardado está bloqueado para evitar reemplazarlo por Aurora. Si acordaron cambiar el diseño, elegí conscientemente otro modelo en este primer paso.</p></div>}
        {message && <p className="builder-message" role="status">{message}</p>}{authenticated && workflow.requiresPlatformReview && document.status === 'approved' && <p className="builder-message">Esta cuenta requiere revisión final de Save Your Date antes de publicar.</p>}
        {activeStep === 'review' && validationIssues.length > 0 && <section className="builder-validation" aria-labelledby="builder-validation-title"><h2 id="builder-validation-title">Antes de enviar a revisión</h2><p className="builder-help">Te llevamos directamente a cada dato para que no tengas que buscarlo.</p><ul>{validationIssues.map((issue) => <li key={`${issue.field}-${issue.message}`}><span>{issue.message}</span><button type="button" onClick={() => goToStep(stepForValidationField(issue.field))}>Ir a corregir →</button></li>)}</ul></section>}
        {activeStep === 'review' && reviewHistory.some((event) => event.action === 'changes_requested' && event.comment) && <section className="builder-review-notes"><h2>Comentarios de revisión</h2>{reviewHistory.filter((event) => event.action === 'changes_requested' && event.comment).slice(0, 5).map((event) => <article key={event.id}><p>{event.comment}</p><time>{new Date(event.created_at).toLocaleString('es-UY')}</time></article>)}</section>}
        {activeStep === 'design' && <>
        <section><h2>Modelo</h2><label>Diseño<select value={document.templateId} onChange={(e) => changeTemplate(e.target.value)}>{BUILDER_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Idioma<select value={document.locale} onChange={(e) => updateDocument({ locale: e.target.value as InvitationBuilderDocument['locale'] })}>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select></label>
        </section>
        {authenticated && <section><h2>Biblioteca de la cuenta</h2><p className="builder-help">Reutilizá diseño, secciones, textos generales y cronograma. No se copian nombres, fechas, invitados, fotos ni datos bancarios.</p>
          {savedSetups.length > 0 && <label>Configuración guardada<select defaultValue="" onChange={(e) => { applySetup(e.target.value); e.target.value = ''; }}><option value="">Seleccionar…</option>{savedSetups.map((setup) => <option key={setup.id} value={setup.id}>{setup.name}</option>)}</select></label>}
          {canEditDocument && <div className="builder-library-save"><input value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="Ej.: Quince clásico del salón" maxLength={100} /><button type="button" onClick={saveSetup}>Guardar como base</button></div>}
        </section>}
        <section><h2>Paleta</h2><p className="builder-help">Elegí los colores que mejor acompañen tu celebración.</p><select value={document.paletteId} onChange={(e) => updateDocument({ paletteId: e.target.value })}>
          {template.palettes.map((palette) => <option key={palette.id} value={palette.id}>{palette.label}</option>)}
        </select></section>
        </>}
        {activeStep === 'event' && <>
        <section><h2>Contenido principal</h2>
          <label>Nombre<input value={event.name} onChange={(e) => updateContentGroup('event', 'name', e.target.value)} /></label>
          <label>Fecha y hora<input type="datetime-local" value={event.dateTime.slice(0, 16)} onChange={(e) => updateContentGroup('event', 'dateTime', `${e.target.value}:00-03:00`)} /></label>
          <label>Lugar<input value={event.venue} onChange={(e) => updateContentGroup('event', 'venue', e.target.value)} /></label>
          <label>Dirección<input value={event.address} onChange={(e) => updateContentGroup('event', 'address', e.target.value)} /></label>
          <label>Frase<textarea value={content.quote || ''} onChange={(e) => updateContentGroup('content', 'quote', e.target.value)} /></label>
          <label>Hashtag<input value={content.hashtag} onChange={(e) => updateContentGroup('content', 'hashtag', e.target.value)} /></label>
        </section>
        <section><h2>Detalles e integraciones</h2>
          <label>Resumen del código de vestimenta<input value={content.dressSummary || ''} onChange={(e) => updateContentGroup('content', 'dressSummary', e.target.value)} /></label>
          <label>Detalle del código de vestimenta<textarea value={content.dressDetails || ''} onChange={(e) => updateContentGroup('content', 'dressDetails', e.target.value)} /></label>
          <label>Fecha límite RSVP<input value={content.rsvpDeadline || ''} onChange={(e) => updateContentGroup('content', 'rsvpDeadline', e.target.value)} /></label>
          <label>Enlace del mapa<input type="url" value={links.maps || ''} onChange={(e) => updateContentGroup('links', 'maps', e.target.value)} /></label>
        </section>
        </>}
        {activeStep === 'copy' && <>
        <section><h2>Textos de las secciones</h2><p className="builder-help">Dejá un campo vacío para usar el texto predeterminado del idioma elegido.</p>
          {SECTION_COPY_FIELDS.map(([group, fields]) => <details className="builder-copy-group" key={group}><summary>{group}</summary>
            {fields.map(([field, label]) => <label key={field}>{label}<input value={editableContent[field] || ''} onChange={(e) => updateContentGroup('content', field, e.target.value)} /></label>)}
          </details>)}
        </section>
        </>}
        {activeStep === 'extras' && <>
        <section><h2>Enlaces e integraciones</h2><p className="builder-help">Completá solamente las opciones que estén activas en tu invitación.</p>
          <label>Instagram<input type="url" value={links.instagram || ''} onChange={(e) => updateContentGroup('links', 'instagram', e.target.value)} /></label>
          <label>Álbum colaborativo<input type="url" value={links.photoUpload || ''} onChange={(e) => updateContentGroup('links', 'photoUpload', e.target.value)} /></label>
        </section>
        <section><h2>Regalos</h2>
          <label>Banco<input value={gifts.bank} onChange={(e) => updateContentGroup('gifts', 'bank', e.target.value)} /></label>
          <label>Titular<input value={gifts.holder} onChange={(e) => updateContentGroup('gifts', 'holder', e.target.value)} /></label>
          <label>Moneda<input value={gifts.currency} onChange={(e) => updateContentGroup('gifts', 'currency', e.target.value)} /></label>
          <label>Cuenta<input value={gifts.account} onChange={(e) => updateContentGroup('gifts', 'account', e.target.value)} /></label>
          <label>Alias<input value={gifts.alias} onChange={(e) => updateContentGroup('gifts', 'alias', e.target.value)} /></label>
          <label>Lista de regalos<input type="url" value={gifts.link || ''} onChange={(e) => updateContentGroup('gifts', 'link', e.target.value)} /></label>
        </section>
        <section><h2>Pase QR</h2><label>Contenido del código<input value={qrPass.value} onChange={(e) => updateContentGroup('qrPass', 'value', e.target.value)} /></label><p className="builder-help">Puede ser un identificador, una URL o el código asignado al invitado.</p></section>
        </>}
        {activeStep === 'media' && <>
        <section><h2>Imágenes principales</h2>
          <label>Imagen de portada<input value={assets.hero} onChange={(e) => updateContentGroup('assets', 'hero', e.target.value)} /></label>
          <label>Foto destacada<input value={assets.parallax} onChange={(e) => updateContentGroup('assets', 'parallax', e.target.value)} /></label>
          <label>Encuadre de portada en celular<input list="builder-image-positions" value={assets.heroPositionMobile} onChange={(e) => updateContentGroup('assets', 'heroPositionMobile', e.target.value)} /></label>
          <label>Encuadre de portada en escritorio<input list="builder-image-positions" value={assets.heroPositionDesktop} onChange={(e) => updateContentGroup('assets', 'heroPositionDesktop', e.target.value)} /></label>
          <datalist id="builder-image-positions"><option value="center" /><option value="center top" /><option value="center bottom" /><option value="left top" /><option value="left center" /><option value="left bottom" /><option value="right top" /><option value="right center" /><option value="right bottom" /></datalist>
          <label>Oscurecimiento de portada<select value={String(assets.heroOverlay)} onChange={(e) => updateContentGroup('assets', 'heroOverlay', Number(e.target.value))}>
            <option value="0">Sin oscurecer</option><option value="0.16">Suave · 16%</option><option value="0.3">Medio · 30%</option><option value="0.45">Alto · 45%</option><option value="0.6">Muy alto · 60%</option>
          </select></label>
        </section>
        </>}
        {activeStep === 'sections' && <>
        <section><div className="builder-section-title"><h2>Cronograma</h2><button type="button" onClick={() => addArrayItem('schedule')}>+ Agregar</button></div>{schedule.map((item, index) => <fieldset className="builder-fieldset" key={index}><legend>Momento {index + 1}</legend>
          <label>Hora<input type="time" value={item.time} onChange={(e) => updateArrayItem('schedule', index, 'time', e.target.value)} /></label>
          <label>Título<input value={item.title || ''} onChange={(e) => updateArrayItem('schedule', index, 'title', e.target.value)} /></label>
          <label>Descripción<textarea value={item.description || ''} onChange={(e) => updateArrayItem('schedule', index, 'description', e.target.value)} /></label>
          <button className="builder-remove" type="button" onClick={() => removeArrayItem('schedule', index)}>Eliminar momento</button>
        </fieldset>)}</section>
        </>}
        {activeStep === 'media' && <>
        <section><div className="builder-section-title"><h2>Galería</h2><button type="button" onClick={() => addArrayItem('gallery')}>+ Agregar</button></div>{gallery.map((image, index) => <fieldset className="builder-fieldset" key={index}><legend>Foto {index + 1}</legend>
          <label>Imagen<input value={image.src} onChange={(e) => updateArrayItem('gallery', index, 'src', e.target.value)} /></label>
          <label>Texto alternativo<input value={image.alt || ''} onChange={(e) => updateArrayItem('gallery', index, 'alt', e.target.value)} /></label>
          <button className="builder-remove" type="button" onClick={() => removeArrayItem('gallery', index)}>Eliminar foto</button>
        </fieldset>)}</section>
        </>}
        {activeStep === 'extras' && <>
        <section><div className="builder-section-title"><h2>Alojamiento</h2><button type="button" onClick={() => addArrayItem('hotels')}>+ Agregar</button></div>{hotels.map((hotel, index) => <fieldset className="builder-fieldset" key={index}><legend>Opción {index + 1}</legend>
          <label>Nombre<input value={hotel.name} onChange={(e) => updateArrayItem('hotels', index, 'name', e.target.value)} /></label>
          <label>Dirección<input value={hotel.address || ''} onChange={(e) => updateArrayItem('hotels', index, 'address', e.target.value)} /></label>
          <label>Distancia<input value={hotel.distance || ''} onChange={(e) => updateArrayItem('hotels', index, 'distance', e.target.value)} /></label>
          <label>Teléfono<input type="tel" value={hotel.phone || ''} onChange={(e) => updateArrayItem('hotels', index, 'phone', e.target.value)} /></label>
          <label>Enlace de reserva<input type="url" value={hotel.bookingUrl || ''} onChange={(e) => updateArrayItem('hotels', index, 'bookingUrl', e.target.value)} /></label>
          <label>Beneficio o descuento<input value={hotel.discount || ''} onChange={(e) => updateArrayItem('hotels', index, 'discount', e.target.value)} /></label>
          <label>Notas<textarea value={hotel.notes || ''} onChange={(e) => updateArrayItem('hotels', index, 'notes', e.target.value)} /></label>
          <button className="builder-remove" type="button" onClick={() => removeArrayItem('hotels', index)}>Eliminar opción</button>
        </fieldset>)}</section>
        </>}
        {activeStep === 'sections' && <>
        <section><h2>Secciones</h2><p className="builder-help">Activá y ordená los bloques. Portada y RSVP tienen posición fija.</p>
          <ol className="builder-sections">{ordered.map((section, index) => {
            const definition = sectionDefinitions.find(({ id }) => id === section.id)!;
            return <li key={section.id}>
              <input type="checkbox" checked={section.enabled} disabled={definition.required} onChange={() => toggle(section.id)} aria-label={`Mostrar ${definition.label}`} />
              <span>{definition.label}</span>
              <button disabled={Boolean(definition.locked) || index === 0} onClick={() => move(section.id, -1)} aria-label={`Subir ${definition.label}`}>↑</button>
              <button disabled={Boolean(definition.locked) || index === ordered.length - 1} onClick={() => move(section.id, 1)} aria-label={`Bajar ${definition.label}`}>↓</button>
            </li>;
          })}</ol>
        </section>
        </>}
        {activeStep === 'review' && <section className="builder-finish-card"><span className="builder-finish-icon">{validationIssues.length || unsupportedRequestedModel ? '!' : '✓'}</span><h2>{unsupportedRequestedModel ? 'Primero confirmá el modelo' : validationIssues.length ? 'Tu invitación está casi pronta' : '¡Todo pronto para revisar!'}</h2><p>{unsupportedRequestedModel ? 'Volvé al paso Diseño y elegí una plantilla modular únicamente si el cambio fue acordado.' : validationIssues.length ? `Completá los ${validationIssues.length} datos señalados antes de enviarla.` : 'Guardá los últimos cambios y enviala a revisión cuando quieras.'}</p>{canEditDocument && <button type="button" onClick={() => void save()} disabled={saving}>{saving ? 'Guardando…' : 'Guardar borrador'}</button>}{canEditDocument && <button className="builder-finish-primary" type="button" onClick={submitForReview} disabled={saving || validationIssues.length > 0}>Enviar a revisión</button>}</section>}
        <div className="builder-step-actions"><button type="button" onClick={() => goToAdjacentStep(-1)} disabled={activeStepIndex === 0}>← Anterior</button>{activeStepIndex < BUILDER_STEPS.length - 1 && <button className="builder-next" type="button" onClick={() => goToAdjacentStep(1)}>Continuar →</button>}</div>
      </aside>
      <section className="builder-preview-area" id="builder-live-preview">
        <div className="builder-preview-toolbar"><strong>Vista previa en vivo</strong><div><button aria-pressed={viewport === 'phone'} onClick={() => setViewport('phone')}>Celular</button><button aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>Escritorio</button></div></div>
        <div className={`builder-preview builder-preview-${viewport}`}><Preview locale={document.locale} palette={document.paletteId as never} embedded config={config} sectionOrder={ordered.filter(({ enabled }) => enabled).map(({ id }) => id)} /></div>
      </section>
    </div>
    <button
      className="builder-mobile-switch"
      type="button"
      aria-controls={mobilePanel === 'edit' ? 'builder-live-preview' : 'builder-editor'}
      onClick={() => setMobilePanel((current) => current === 'edit' ? 'preview' : 'edit')}
    >{mobilePanel === 'edit' ? 'Ver vista previa' : 'Volver a editar'}</button>
  </main>;
}
