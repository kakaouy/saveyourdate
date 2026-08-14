import { useState } from 'react';
import { INVITATION_MODELS } from '../data/models';
import type { InvitationModel } from '../data/models';
import { auroraConfigFromBuilder } from './aurora/builder';
import { BUILDER_TEMPLATES } from './invitation-builder/templates';
import ApprovedInvitationPreview, { InvitationScrollHint } from './invitation-builder/ApprovedInvitationPreview';
import './invitation-catalog.css';

type Category = 'all' | InvitationModel['category'];
const categoryOrder: Record<InvitationModel['category'], number> = {
  wedding: 0,
  '15years': 1,
  other: 2
};
const models = INVITATION_MODELS
  .filter((model) => model.active !== false)
  .map((model, originalIndex) => ({ model, originalIndex }))
  .sort((left, right) => categoryOrder[left.model.category] - categoryOrder[right.model.category]
    || (left.model.order ?? left.originalIndex) - (right.model.order ?? right.originalIndex))
  .map(({ model }) => model);
const fallbackPalette = [{ id: 'original', name: 'Original', color: '#a6b9b3' }];
const fallbackPreview: Record<InvitationModel['category'], string> = {
  wedding: '/previews/minimalista-eucalipto.webp',
  '15years': '/previews/aurora.png',
  other: '/previews/brindis-papel.webp'
};
const previewFor = (model: InvitationModel) => model.previewImage || fallbackPreview[model.category];

function CatalogCardPreview({ model }: { model: InvitationModel }) {
  if (model.comingSoon) return <div className="catalog-coming-soon"><img src="/logo.svg" alt="Save Your Date" /><strong>Próximamente</strong><span>Nuevos momentos están por llegar</span></div>;
  if (!['boda-marfil', 'boda-pleno', 'boda-boho', '15-sweet-jane'].includes(model.id)) return <img src={previewFor(model)} alt={`Vista previa de ${model.title}`} draggable={false} />;
  const template = BUILDER_TEMPLATES.find(({ id }) => id === model.id);
  if (!template) return null;
  const document = template.createDocument();
  const Preview = template.Preview;
  return <div className="catalog-card-live-preview" aria-label={`Vista previa de ${model.title}`}>
    <Preview locale="es" palette={document.paletteId as never} embedded config={auroraConfigFromBuilder(document)} sectionOrder={document.sections.filter(({ enabled }) => enabled).map(({ id }) => id)} />
  </div>;
}

export default function InvitationCatalogPage() {
  const [category, setCategory] = useState<Category>('all');
  const [selected, setSelected] = useState<InvitationModel | null>(null);
  const [viewport, setViewport] = useState<'phone' | 'desktop'>('phone');
  const [paletteByModel, setPaletteByModel] = useState<Record<string, string>>({});
  const filtered = category === 'all' ? models : models.filter((model) => model.category === category);
  const template = selected && !selected.comingSoon ? BUILDER_TEMPLATES.find(({ id }) => id === selected.id || (selected.id === '15-verona' && id === 'verona')) : undefined;
  const paletteOptions = selected?.palettes || fallbackPalette;
  const palette = selected ? paletteByModel[selected.id] || paletteOptions[0].id : '';

  return <main className="catalog-page" onContextMenu={(event) => event.preventDefault()}>
    <header className="catalog-header"><a href="/?concepto=plataforma">← Volver</a><img src="/logo.svg" alt="Save Your Date" /><a className="catalog-create" href="/?builder=aurora">Simular edición</a></header>
    <section className="catalog-heading"><span>CATÁLOGO DE INVITACIONES</span><h1>Una al lado de la otra.<br />Elegí la que más te guste.</h1><p>Tocá una invitación para recorrer el modelo completo, ver todo lo que incluye, probar sus colores y alternar entre celular y pantalla amplia.</p><div className="catalog-filters" aria-label="Tipo de evento">{([['all','Todos'],['wedding','Boda'],['15years','Quince'],['other','Otros eventos']] as const).map(([id,label]) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>{label}</button>)}</div></section>
    <section className="catalog-grid" aria-live="polite">
      {filtered.map((model) => {
        const colors = model.palettes || fallbackPalette;
        return <article className="catalog-card" key={model.id}>
          <button className="catalog-phone" type="button" onClick={() => { setSelected(model); setViewport('phone'); }} aria-label={`Ver detalles de ${model.title}`}>
            <span className="catalog-speaker" />
            <span className={'catalog-phone-screen catalog-preview-' + model.id}><CatalogCardPreview model={model} /></span>
          </button>
          <div className="catalog-card-meta"><div><span>{model.category === 'wedding' ? 'BODA' : model.category === '15years' ? 'QUINCE' : 'OTRO EVENTO'}</span><h2>{model.title}</h2></div><div className="catalog-card-colors" aria-label={`${colors.length} colores`}>{colors.map((option) => <i key={option.id} style={{ background: option.color }} title={option.name} />)}</div></div>
          <button className="catalog-card-open" onClick={() => setSelected(model)}>Ver modelo y colores →</button>
        </article>;
      })}
    </section>
    {selected && <div className="catalog-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="catalog-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title"><button className="catalog-modal-close" onClick={() => setSelected(null)} aria-label="Cerrar">×</button><aside className="catalog-modal-info"><span>{selected.category === 'wedding' ? 'BODA' : selected.category === '15years' ? 'QUINCE' : 'OTRO EVENTO'}</span><h2 id="catalog-modal-title">{selected.title}</h2><p>{selected.description || 'Una invitación completa para compartir cada detalle de tu evento.'}</p><h3>Incluye</h3><ul>{selected.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><h3>Colores disponibles</h3><div className="catalog-modal-palettes">{paletteOptions.map((option) => <button key={option.id} className={palette === option.id ? 'active' : ''} onClick={() => setPaletteByModel((current) => ({ ...current, [selected.id]: option.id }))}><i style={{ background: option.color }} /><span>{option.name}</span></button>)}</div>{template ? <a href={`/?builder=${encodeURIComponent(selected.id)}`}>Simular edición →</a> : <button disabled>Disponible próximamente</button>}<small>Vista protegida · imágenes de muestra · sin descarga</small></aside><div className="catalog-modal-viewer"><div className="catalog-view-switch"><button className={viewport === 'phone' ? 'active' : ''} onClick={() => setViewport('phone')}>▯ Celular</button><button className={viewport === 'desktop' ? 'active' : ''} onClick={() => setViewport('desktop')}>▭ Pantalla amplia</button></div><div className={`catalog-device catalog-device-${viewport}`}>{template ? <div className="catalog-live-preview"><ApprovedInvitationPreview modelId={selected.id} paletteId={palette} /></div> : <div className="catalog-static-preview"><img src={previewFor(selected)} alt={`Invitación ${selected.title}`} /></div>}</div>{template && <InvitationScrollHint />}</div></section></div>}
  </main>;
}
