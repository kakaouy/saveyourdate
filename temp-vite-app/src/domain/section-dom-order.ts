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
      const next = sectionOrder[index + 1];
      const photoGalleryPair = (sectionId === 'parallax' && next === 'gallery') || (sectionId === 'gallery' && next === 'parallax');
      const hasOrnament = index >= 0 && index < sectionOrder.length - 1 && !photoGalleryPair;
      const ornamentSide = index % 2 === 0 ? 'right' : 'left';
      child.classList.toggle('modular-ornament-after', hasOrnament);
      child.classList.toggle('modular-ornament-right', hasOrnament && ornamentSide === 'right');
      child.classList.toggle('modular-ornament-left', hasOrnament && ornamentSide === 'left');
      child.style.setProperty('--modular-ornament-image', `var(--modular-ornament-${index % 2 === 0 ? 'right' : 'left'})`);
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
