export const applySectionDomOrder = (
  main: HTMLElement | null,
  sectionOrder: string[] | undefined,
  sectionAttribute: string,
  ornamentSelector: string
) => {
  if (!main || !sectionOrder?.length) return;
  main.classList.add('modular-section-order');
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  let previousOrder = sectionOrder.length * 2;
  const sections = new Map<string, HTMLElement>();
  Array.from(main.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const sectionId = child.getAttribute(sectionAttribute);
    if (sectionId) {
      const index = sectionOrder.indexOf(sectionId);
      sections.set(sectionId, child);
      previousOrder = (index < 0 ? sectionOrder.length : index) * 2;
      child.style.order = String(previousOrder);
      child.classList.remove('modular-ornament-after');
      child.classList.remove('modular-ornament-before', 'modular-ornament-host', 'modular-ornament-right', 'modular-ornament-left');
    } else if (child.matches(ornamentSelector)) {
      child.style.order = String(previousOrder + 1);
      child.style.display = 'none';
    }
  });
  let visibleOrnamentIndex = 0;
  sectionOrder.forEach((sectionId, index) => {
    if (index <= 1) return;
    const previousId = sectionOrder[index - 1];
    const photoGalleryPair = (previousId === 'parallax' && sectionId === 'gallery') || (previousId === 'gallery' && sectionId === 'parallax');
    if (photoGalleryPair || sectionId === 'parallax') return;
    const host = sections.get(sectionId);
    if (!host) return;
    const ornamentSide = visibleOrnamentIndex % 2 === 0 ? 'right' : 'left';
    host.classList.add('modular-ornament-host', 'modular-ornament-before', `modular-ornament-${ornamentSide}`);
    host.style.setProperty('--modular-ornament-image', `var(--modular-ornament-${ornamentSide})`);
    host.style.setProperty('--modular-ornament-duration', `${8.6 + (index % 4) * 0.7}s`);
    host.style.setProperty('--modular-ornament-delay', `${-(index * 1.37)}s`);
    host.style.setProperty('--modular-ornament-translate', '-50%');
    visibleOrnamentIndex += 1;
  });
};

export const applyInferredSectionDomOrder = (
  main: HTMLElement | null,
  sectionOrder: string[] | undefined,
  canonicalVisibleOrder: string[],
  sectionAttribute: string,
  ornamentSelector: string
) => {
  if (!main) return;
  const sectionNodes = Array.from(main.children).filter((child) =>
    child instanceof HTMLElement && !child.matches(ornamentSelector)
  );
  sectionNodes.forEach((child, index) => child.setAttribute(sectionAttribute, canonicalVisibleOrder[index] || ''));
  applySectionDomOrder(main, sectionOrder, sectionAttribute, ornamentSelector);
};
