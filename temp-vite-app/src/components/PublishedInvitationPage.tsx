import { useEffect, useMemo, useState } from 'react';
import { auroraConfigFromBuilder } from './aurora/builder';
import type { InvitationBuilderDocument } from '../domain/invitation-builder';
import { normalizeSectionOrder } from '../domain/invitation-builder';
import { builderSectionDefinitions, builderTemplate } from './invitation-builder/templates';

const orderNumber = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).at(-1) || '').toUpperCase();

export default function PublishedInvitationPage() {
  const [document, setDocument] = useState<InvitationBuilderDocument | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/rsvp?order=${encodeURIComponent(orderNumber)}`).then(async (response) => {
      const payload = await response.json() as { error?: string; document?: Record<string, unknown> };
      if (!response.ok || !payload.document) throw new Error(payload.error || 'Invitación no encontrada.');
      const stored = payload.document;
      setDocument({ version: 1, templateId: String(stored.template_id), paletteId: String(stored.palette_id),
        locale: stored.locale as InvitationBuilderDocument['locale'], status: 'published',
        sections: stored.sections as InvitationBuilderDocument['sections'], content: stored.content as InvitationBuilderDocument['content'] });
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Invitación no encontrada.'));
  }, []);
  const config = useMemo(() => document ? auroraConfigFromBuilder(document) : null, [document]);
  if (error) return <main className="published-invitation-state"><h1>No pudimos abrir esta invitación</h1><p>{error}</p></main>;
  if (!document || !config) return <main className="published-invitation-state"><p>Cargando invitación…</p></main>;
  const template = builderTemplate(document.templateId);
  const Preview = template.Preview;
  const definitions = builderSectionDefinitions(document.templateId, document.sections.map(({ id }) => id));
  const order = normalizeSectionOrder(definitions, document.sections).filter(({ enabled }) => enabled).map(({ id }) => id);
  return <Preview locale={document.locale} palette={document.paletteId as never} config={config} sectionOrder={order} />;
}
