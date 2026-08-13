import { useEffect, useMemo, useState } from 'react';
import { AURORA_BUILDER_SECTIONS, auroraConfigFromBuilder, createAuroraBuilderDocument } from '../aurora/builder';
import { moveInvitationSection, normalizeSectionOrder } from '../../domain/invitation-builder';
import type { InvitationBuilderDocument } from '../../domain/invitation-builder';
import { BUILDER_TEMPLATES, builderTemplate } from './templates';
import './invitation-builder.css';
import './builder-persistence.css';
import './mobile-preview.css';

type WorkflowCapabilities = { canEdit: boolean; canApprove: boolean; canPublish: boolean; requiresPlatformReview: boolean };
type SavedSetup = { id: string; name: string; payload: Partial<InvitationBuilderDocument>; updated_at: string };
type ReviewEvent = { id: string; action: string; comment: string | null; actor_type: string; created_at: string };

export default function InvitationBuilderPage() {
  const [document, setDocument] = useState<InvitationBuilderDocument>(createAuroraBuilderDocument);
  const [viewport, setViewport] = useState<'phone' | 'desktop'>('phone');
  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowCapabilities>({ canEdit: true, canApprove: false, canPublish: false, requiresPlatformReview: true });
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>([]);
  const [setupName, setSetupName] = useState('');
  const [reviewHistory, setReviewHistory] = useState<ReviewEvent[]>([]);
  const config = useMemo(() => auroraConfigFromBuilder(document), [document]);
  const event = config.event!;
  const content = config.content!;
  const links = config.links!;
  const gifts = config.gifts!;
  const assets = config.assets!;
  const schedule = config.schedule || [];
  const gallery = config.gallery || [];
  const template = builderTemplate(document.templateId);
  const Preview = template.Preview;

  const updateDocument = (change: Partial<InvitationBuilderDocument>) => {
    setSaved(false);
    setDocument((current) => ({ ...current, ...change }));
  };
  const updateContentGroup = (group: string, field: string, value: string) => updateDocument({
    content: {
      ...document.content,
      [group]: { ...(document.content[group] as Record<string, unknown>), [field]: value }
    }
  });
  const updateArrayItem = (group: 'schedule' | 'gallery', index: number, field: string, value: string) => {
    const items = [...((document.content[group] as Array<Record<string, unknown>>) || [])];
    items[index] = { ...items[index], [field]: value };
    updateDocument({ content: { ...document.content, [group]: items } });
  };
  const addArrayItem = (group: 'schedule' | 'gallery') => {
    const items = [...((document.content[group] as Array<Record<string, unknown>>) || [])];
    items.push(group === 'schedule' ? { time: '21:00', title: '', description: '' } : { src: assets.parallax, alt: '' });
    updateDocument({ content: { ...document.content, [group]: items } });
  };
  const removeArrayItem = (group: 'schedule' | 'gallery', index: number) => {
    const items = [...((document.content[group] as Array<Record<string, unknown>>) || [])];
    items.splice(index, 1);
    updateDocument({ content: { ...document.content, [group]: items } });
  };
  const toggle = (id: string) => updateDocument({
    sections: document.sections.map((section) => section.id === id ? { ...section, enabled: !section.enabled } : section)
  });
  const move = (id: string, direction: -1 | 1) => updateDocument({
    sections: moveInvitationSection(AURORA_BUILDER_SECTIONS, document.sections, id, direction)
  });
  const ordered = normalizeSectionOrder(AURORA_BUILDER_SECTIONS, document.sections);
  const changeTemplate = (templateId: string) => {
    const selected = builderTemplate(templateId);
    const next = selected.createDocument();
    setSaved(false);
    setDocument({ ...next, locale: document.locale, status: 'draft' });
  };

  useEffect(() => {
    fetch('/api/admin/invitation-builder').then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { document?: Record<string, unknown> | null; workflow?: WorkflowCapabilities; reviewHistory?: ReviewEvent[] };
      setAuthenticated(true);
      if (payload.workflow) setWorkflow(payload.workflow);
      setReviewHistory(payload.reviewHistory || []);
      fetch('/api/admin/resources?kind=invitation_setup').then(async (resourceResponse) => {
        if (resourceResponse.ok) setSavedSetups(((await resourceResponse.json()) as { resources: SavedSetup[] }).resources);
      }).catch(() => undefined);
      if (!payload.document) return;
      const stored = payload.document;
      setDocument({ version: 1, templateId: String(stored.template_id), paletteId: String(stored.palette_id),
        locale: stored.locale as InvitationBuilderDocument['locale'], sections: stored.sections as InvitationBuilderDocument['sections'],
        content: stored.content as InvitationBuilderDocument['content'], status: stored.workflow_status as InvitationBuilderDocument['status'] });
      setSaved(true);
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    if (!authenticated) { setMessage('Modo demostración: iniciá sesión en el panel para guardar.'); return false; }
    setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/admin/invitation-builder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(document) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar.');
      setSaved(true); setMessage('Borrador guardado.'); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar.'); return false; }
    finally { setSaving(false); }
  };

  const submitForReview = async () => {
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
    const name = setupName.trim();
    if (!name) { setMessage('Ingresá un nombre para la configuración reutilizable.'); return; }
    const reusable: Partial<InvitationBuilderDocument> = {
      version: 1, templateId: document.templateId, paletteId: document.paletteId, locale: document.locale,
      sections: document.sections,
      content: {
        content: document.content.content,
        schedule: document.content.schedule,
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
        schedule: setup.payload.content?.schedule || base.content.schedule
      },
      status: 'draft'
    }));
    setSaved(false); setMessage(`Aplicaste “${setup.name}”. Revisá los datos del evento antes de guardar.`);
  };

  return <main className="builder-page">
    <header className="builder-header">
      <a href="/">← Volver</a><div><strong>Armá tu invitación</strong><span>{template.label} · {document.status === 'draft' ? 'Borrador' : document.status === 'in_review' ? 'En revisión' : document.status}</span></div>
      <div className="builder-header-actions">
        {workflow.canEdit && <button onClick={save} disabled={saving}>{saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar borrador'}</button>}
        {workflow.canEdit && ['draft','changes_requested'].includes(document.status) && <button onClick={submitForReview} disabled={saving}>Enviar a revisión</button>}
        {workflow.canApprove && document.status === 'in_review' && <><button onClick={() => workflowAction('request-changes')}>Solicitar cambios</button><button onClick={() => workflowAction('approve')}>Aprobar</button></>}
        {workflow.canPublish && document.status === 'approved' && <button onClick={() => workflowAction('publish')}>Publicar</button>}
      </div>
    </header>
    <div className="builder-layout" data-mobile-panel={mobilePanel}>
      <aside className="builder-panel" id="builder-editor">{message && <p className="builder-message" role="status">{message}</p>}{authenticated && workflow.requiresPlatformReview && document.status === 'approved' && <p className="builder-message">Esta cuenta requiere revisión final de Save Your Date antes de publicar.</p>}
        {reviewHistory.some((event) => event.action === 'changes_requested' && event.comment) && <section className="builder-review-notes"><h2>Comentarios de revisión</h2>{reviewHistory.filter((event) => event.action === 'changes_requested' && event.comment).slice(0, 5).map((event) => <article key={event.id}><p>{event.comment}</p><time>{new Date(event.created_at).toLocaleString('es-UY')}</time></article>)}</section>}
        <section><h2>Modelo</h2><label>Diseño<select value={document.templateId} onChange={(e) => changeTemplate(e.target.value)}>{BUILDER_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Idioma<select value={document.locale} onChange={(e) => updateDocument({ locale: e.target.value as InvitationBuilderDocument['locale'] })}>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select></label>
        </section>
        {authenticated && <section><h2>Biblioteca de la cuenta</h2><p className="builder-help">Reutilizá diseño, secciones, textos generales y cronograma. No se copian nombres, fechas, invitados, fotos ni datos bancarios.</p>
          {savedSetups.length > 0 && <label>Configuración guardada<select defaultValue="" onChange={(e) => { applySetup(e.target.value); e.target.value = ''; }}><option value="">Seleccionar…</option>{savedSetups.map((setup) => <option key={setup.id} value={setup.id}>{setup.name}</option>)}</select></label>}
          {workflow.canEdit && <div className="builder-library-save"><input value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="Ej.: Quince clásico del salón" maxLength={100} /><button type="button" onClick={saveSetup}>Guardar como base</button></div>}
        </section>}
        <section><h2>Contenido principal</h2>
          <label>Nombre<input value={event.name} onChange={(e) => updateContentGroup('event', 'name', e.target.value)} /></label>
          <label>Fecha y hora<input type="datetime-local" value={event.dateTime.slice(0, 16)} onChange={(e) => updateContentGroup('event', 'dateTime', `${e.target.value}:00-03:00`)} /></label>
          <label>Lugar<input value={event.venue} onChange={(e) => updateContentGroup('event', 'venue', e.target.value)} /></label>
          <label>Dirección<input value={event.address} onChange={(e) => updateContentGroup('event', 'address', e.target.value)} /></label>
          <label>Frase<textarea value={content.quote || ''} onChange={(e) => updateContentGroup('content', 'quote', e.target.value)} /></label>
          <label>Hashtag<input value={content.hashtag} onChange={(e) => updateContentGroup('content', 'hashtag', e.target.value)} /></label>
        </section>
        <section><h2>Paleta</h2><select value={document.paletteId} onChange={(e) => updateDocument({ paletteId: e.target.value })}>
          {template.palettes.map((palette) => <option key={palette.id} value={palette.id}>{palette.label}</option>)}
        </select></section>
        <section><h2>Detalles e integraciones</h2>
          <label>Resumen del código de vestimenta<input value={content.dressSummary || ''} onChange={(e) => updateContentGroup('content', 'dressSummary', e.target.value)} /></label>
          <label>Detalle del código de vestimenta<textarea value={content.dressDetails || ''} onChange={(e) => updateContentGroup('content', 'dressDetails', e.target.value)} /></label>
          <label>Fecha límite RSVP<input value={content.rsvpDeadline || ''} onChange={(e) => updateContentGroup('content', 'rsvpDeadline', e.target.value)} /></label>
          <label>Enlace del mapa<input type="url" value={links.maps || ''} onChange={(e) => updateContentGroup('links', 'maps', e.target.value)} /></label>
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
        <section><h2>Imágenes principales</h2>
          <label>Imagen de portada<input value={assets.hero} onChange={(e) => updateContentGroup('assets', 'hero', e.target.value)} /></label>
          <label>Foto destacada<input value={assets.parallax} onChange={(e) => updateContentGroup('assets', 'parallax', e.target.value)} /></label>
        </section>
        <section><div className="builder-section-title"><h2>Cronograma</h2><button type="button" onClick={() => addArrayItem('schedule')}>+ Agregar</button></div>{schedule.map((item, index) => <fieldset className="builder-fieldset" key={index}><legend>Momento {index + 1}</legend>
          <label>Hora<input type="time" value={item.time} onChange={(e) => updateArrayItem('schedule', index, 'time', e.target.value)} /></label>
          <label>Título<input value={item.title || ''} onChange={(e) => updateArrayItem('schedule', index, 'title', e.target.value)} /></label>
          <label>Descripción<textarea value={item.description || ''} onChange={(e) => updateArrayItem('schedule', index, 'description', e.target.value)} /></label>
          <button className="builder-remove" type="button" onClick={() => removeArrayItem('schedule', index)}>Eliminar momento</button>
        </fieldset>)}</section>
        <section><div className="builder-section-title"><h2>Galería</h2><button type="button" onClick={() => addArrayItem('gallery')}>+ Agregar</button></div>{gallery.map((image, index) => <fieldset className="builder-fieldset" key={index}><legend>Foto {index + 1}</legend>
          <label>Imagen<input value={image.src} onChange={(e) => updateArrayItem('gallery', index, 'src', e.target.value)} /></label>
          <label>Texto alternativo<input value={image.alt || ''} onChange={(e) => updateArrayItem('gallery', index, 'alt', e.target.value)} /></label>
          <button className="builder-remove" type="button" onClick={() => removeArrayItem('gallery', index)}>Eliminar foto</button>
        </fieldset>)}</section>
        <section><h2>Secciones</h2><p className="builder-help">Activá y ordená los bloques. Portada y RSVP tienen posición fija.</p>
          <ol className="builder-sections">{ordered.map((section, index) => {
            const definition = AURORA_BUILDER_SECTIONS.find(({ id }) => id === section.id)!;
            return <li key={section.id}>
              <input type="checkbox" checked={section.enabled} disabled={definition.required} onChange={() => toggle(section.id)} aria-label={`Mostrar ${definition.label}`} />
              <span>{definition.label}</span>
              <button disabled={Boolean(definition.locked) || index === 0} onClick={() => move(section.id, -1)} aria-label={`Subir ${definition.label}`}>↑</button>
              <button disabled={Boolean(definition.locked) || index === ordered.length - 1} onClick={() => move(section.id, 1)} aria-label={`Bajar ${definition.label}`}>↓</button>
            </li>;
          })}</ol>
        </section>
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
