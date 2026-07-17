/* =========================================================
   GALERÍA Y LIGHTBOX
========================================================= */

let currentGalleryIndex = 0;


document.addEventListener(
  "DOMContentLoaded",
  () => {
    const gallery =
      document.getElementById(
        "gallery"
      );

    const dots =
      document.getElementById(
        "gallery-dots"
      );

    const lightbox =
      document.getElementById(
        "gallery-lightbox"
      );

    const closeButton =
      document.getElementById(
        "lightbox-close"
      );

    const previousButton =
      document.getElementById(
        "lightbox-prev"
      );

    const nextButton =
      document.getElementById(
        "lightbox-next"
      );

    const config =
      EVENT_CONFIG.gallery || {};

    gallery?.addEventListener(
      "click",
      (event) => {
        const item =
          event.target.closest(
            "[data-gallery-index]"
          );

        if (!item) {
          return;
        }

        const index =
          Number(
            item.dataset.galleryIndex
          );

        openGalleryLightbox(index);
      }
    );

    dots?.addEventListener(
      "click",
      (event) => {
        const dot =
          event.target.closest(
            "[data-gallery-index]"
          );

        if (!dot) {
          return;
        }

        const index =
          Number(
            dot.dataset.galleryIndex
          );

        setActiveGalleryDot(index);
        openGalleryLightbox(index);
      }
    );

    closeButton?.addEventListener(
      "click",
      closeGalleryLightbox
    );

    previousButton?.addEventListener(
      "click",
      () => {
        showPreviousGalleryImage();
      }
    );

    nextButton?.addEventListener(
      "click",
      () => {
        showNextGalleryImage();
      }
    );

    lightbox?.addEventListener(
      "click",
      (event) => {
        if (event.target === lightbox) {
          closeGalleryLightbox();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          !lightbox ||
          lightbox.hidden
        ) {
          return;
        }

        if (event.key === "Escape") {
          closeGalleryLightbox();
        }

        if (event.key === "ArrowLeft") {
          showPreviousGalleryImage();
        }

        if (event.key === "ArrowRight") {
          showNextGalleryImage();
        }
      }
    );

    if (previousButton) {
      previousButton.hidden =
        config.showArrows === false;
    }

    if (nextButton) {
      nextButton.hidden =
        config.showArrows === false;
    }

    initializeGalleryAutoplay();
  }
);


/* =========================================================
   ABRIR LIGHTBOX
========================================================= */

function openGalleryLightbox(index) {
  const lightbox =
    document.getElementById(
      "gallery-lightbox"
    );

  if (!lightbox) {
    return;
  }

  showGalleryImage(index);

  lightbox.hidden = false;

  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "no-scroll"
  );

  document
    .getElementById(
      "lightbox-close"
    )
    ?.focus();
}


/* =========================================================
   CERRAR LIGHTBOX
========================================================= */

function closeGalleryLightbox() {
  const lightbox =
    document.getElementById(
      "gallery-lightbox"
    );

  if (!lightbox) {
    return;
  }

  lightbox.hidden = true;

  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "no-scroll"
  );
}


/* =========================================================
   MOSTRAR IMAGEN
========================================================= */

function showGalleryImage(index) {
  const images =
    EVENT_CONFIG.gallery?.images || [];

  const lightboxImage =
    document.getElementById(
      "lightbox-image"
    );

  if (
    !lightboxImage ||
    images.length === 0
  ) {
    return;
  }

  const normalizedIndex =
    (
      index +
      images.length
    ) %
    images.length;

  currentGalleryIndex =
    normalizedIndex;

  const image =
    images[normalizedIndex];

  lightboxImage.src =
    image.src;

  lightboxImage.alt =
    image.alt ||
    `Imagen ${normalizedIndex + 1}`;

  if (image.objectPosition) {
    lightboxImage.style.objectPosition =
      image.objectPosition;
  }
  else {
    lightboxImage.style.removeProperty(
      "object-position"
    );
  }

  setActiveGalleryDot(
    normalizedIndex
  );
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function showPreviousGalleryImage() {
  showGalleryImage(
    currentGalleryIndex - 1
  );
}


function showNextGalleryImage() {
  showGalleryImage(
    currentGalleryIndex + 1
  );
}


/* =========================================================
   DOT ACTIVO
========================================================= */

function setActiveGalleryDot(index) {
  document
    .querySelectorAll(
      ".gallery-dot"
    )
    .forEach(
      (dot, dotIndex) => {
        dot.classList.toggle(
          "is-active",
          dotIndex === index
        );
      }
    );
}


/* =========================================================
   AUTOPLAY OPCIONAL
========================================================= */

function initializeGalleryAutoplay() {
  const config =
    EVENT_CONFIG.gallery || {};

  const images =
    config.images || [];

  if (
    config.autoplay !== true ||
    images.length < 2
  ) {
    return;
  }

  const speed =
    Number(
      config.autoplaySpeed
    ) || 5000;

  window.setInterval(
    () => {
      const lightbox =
        document.getElementById(
          "gallery-lightbox"
        );

      if (
        lightbox &&
        !lightbox.hidden
      ) {
        showNextGalleryImage();
      }
    },
    speed
  );
}