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
  Array.from(main.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const sectionId = child.getAttribute(sectionAttribute);
    if (sectionId) {
      const index = sectionOrder.indexOf(sectionId);
      previousOrder = (index < 0 ? sectionOrder.length : index) * 2;
      child.style.order = String(previousOrder);
      const previous = sectionOrder[index - 1];
      const photoGalleryPair = (previous === 'parallax' && sectionId === 'gallery') || (previous === 'gallery' && sectionId === 'parallax');
      const hasOrnament = index > 1 && !photoGalleryPair;
      const ornamentSide = index % 2 === 0 ? 'right' : 'left';
      child.classList.remove('modular-ornament-after');
      child.classList.toggle('modular-ornament-before', hasOrnament);
      child.classList.toggle('modular-ornament-right', hasOrnament && ornamentSide === 'right');
      child.classList.toggle('modular-ornament-left', hasOrnament && ornamentSide === 'left');
      child.style.setProperty('--modular-ornament-image', `var(--modular-ornament-${ornamentSide})`);
      child.style.setProperty('--modular-ornament-duration', `${8.6 + (index % 4) * 0.7}s`);
      child.style.setProperty('--modular-ornament-delay', `${-(index * 1.37)}s`);
    } else if (child.matches(ornamentSelector)) {
      child.style.order = String(previousOrder + 1);
      child.style.display = 'none';
    }
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
