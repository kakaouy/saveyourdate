import { useMemo } from 'react';
import { auroraConfigFromBuilder } from '../aurora/builder';
import { builderTemplate } from './templates';

type Props = {
  modelId: string;
  paletteId?: string;
  locale?: 'es' | 'en' | 'pt';
  embedded?: boolean;
};

/**
 * Fuente única para catálogo, simulador y constructor. Evita que cada flujo
 * reconstruya la invitación con HTML, datos o estilos distintos.
 */
export default function ApprovedInvitationPreview({
  modelId,
  paletteId,
  locale = 'es',
  embedded = true
}: Props) {
  const template = useMemo(() => builderTemplate(modelId), [modelId]);
  const document = useMemo(() => {
    const source = template.createDocument();
    return {
      ...source,
      locale,
      paletteId: paletteId || source.paletteId
    };
  }, [template, locale, paletteId]);
  const config = useMemo(() => auroraConfigFromBuilder(document), [document]);
  const Preview = template.Preview;
  const sectionOrder = document.sections.filter(({ enabled }) => enabled).map(({ id }) => id);

  return (
    <Preview
      locale={document.locale}
      palette={document.paletteId as never}
      embedded={embedded}
      config={config}
      sectionOrder={sectionOrder}
    />
  );
}

export function InvitationScrollHint() {
  return (
    <div className="invitation-scroll-instruction" aria-hidden="true">
      <img src="/scroll-mouse.png" alt="" />
      <span>Deslizá con el dedo<small>o usá las flechas</small></span>
    </div>
  );
}
