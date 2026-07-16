/* =========================================================
   GALLERY.JS
   Galería + lightbox + navegación
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initGallery();
});


/* =========================================================
   VARIABLES INTERNAS
========================================================= */

let galleryImages = [];

let currentGalleryIndex = 0;

let galleryAutoplayInterval = null;

let touchStartX = 0;

let touchEndX = 0;


/* =========================================================
   INICIALIZAR GALERÍA
========================================================= */

function initGallery() {

  /*
    Si la sección está desactivada,
    no hacemos nada.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.sections?.gallery === false
  ) {
    return;
  }


  galleryImages =
    EVENT_CONFIG?.gallery?.images || [];


  /*
    Si no hay imágenes,
    ocultamos la sección.
  */

  if (!galleryImages.length) {

    const gallerySection =
      document.getElementById(
        "gallery-section"
      );


    if (gallerySection) {

      gallerySection.hidden = true;

    }


    return;

  }


  renderGallery();

  renderGalleryDots();

  initLightbox();

  initGalleryAutoplay();

}


/* =========================================================
   GENERAR GALERÍA
========================================================= */

function renderGallery() {

  const gallery =
    document.getElementById(
      "gallery"
    );


  if (!gallery) {
    return;
  }


  gallery.innerHTML = "";


  galleryImages.forEach(
    (image, index) => {

      /*
        Creamos el botón contenedor.
      */

      const item =
        document.createElement(
          "button"
        );


      item.type = "button";

      item.className =
        "gallery__item";


      item.setAttribute(
        "aria-label",
        `Abrir imagen ${index + 1}`
      );


      item.dataset.index =
        String(index);


      /*
        Creamos la imagen.
      */

      const img =
        document.createElement(
          "img"
        );


      img.src =
        image.src;


      img.alt =
        image.alt
        ||
        `Imagen ${index + 1}`;


      img.loading =
        index === 0
          ? "eager"
          : "lazy";


      img.decoding =
        "async";


      /*
        Si querés agregar una posición
        específica por imagen en config.js:

        objectPosition: "center top"
      */

      if (
        image.objectPosition
      ) {

        img.style.objectPosition =
          image.objectPosition;

      }


      /*
        Si una imagen falla,
        ocultamos ese item.
      */

      img.addEventListener(
        "error",
        () => {

          item.hidden = true;

        }
      );


      /*
        Abrir lightbox.
      */

      item.addEventListener(
        "click",
        () => {

          openLightbox(
            index
          );

        }
      );


      item.appendChild(img);

      gallery.appendChild(item);

    }
  );

}


/* =========================================================
   GENERAR PUNTOS
========================================================= */

function renderGalleryDots() {

  const dotsContainer =
    document.getElementById(
      "gallery-dots"
    );


  if (!dotsContainer) {
    return;
  }


  /*
    Si están desactivados,
    ocultamos el contenedor.
  */

  if (
    EVENT_CONFIG
      ?.gallery
      ?.showDots === false
  ) {

    dotsContainer.hidden = true;

    return;

  }


  dotsContainer.hidden = false;

  dotsContainer.innerHTML = "";


  galleryImages.forEach(
    (_, index) => {

      const dot =
        document.createElement(
          "button"
        );


      dot.type = "button";

      dot.className =
        "gallery-dot";


      dot.setAttribute(
        "aria-label",
        `Ver imagen ${index + 1}`
      );


      if (index === 0) {

        dot.classList.add(
          "is-active"
        );

      }


      dot.addEventListener(
        "click",
        () => {

          openLightbox(
            index
          );

        }
      );


      dotsContainer.appendChild(
        dot
      );

    }
  );

}


/* =========================================================
   INICIALIZAR LIGHTBOX
========================================================= */

function initLightbox() {

  const lightbox =
    document.getElementById(
      "gallery-lightbox"
    );


  const closeButton =
    document.getElementById(
      "lightbox-close"
    );


  const prevButton =
    document.getElementById(
      "lightbox-prev"
    );


  const nextButton =
    document.getElementById(
      "lightbox-next"
    );


  if (!lightbox) {
    return;
  }


  /*
    Cerrar.
  */

  closeButton?.addEventListener(
    "click",
    closeLightbox
  );


  /*
    Anterior.
  */

  prevButton?.addEventListener(
    "click",
    () => {

      showPreviousImage();

    }
  );


  /*
    Siguiente.
  */

  nextButton?.addEventListener(
    "click",
    () => {

      showNextImage();

    }
  );


  /*
    Ocultar flechas si config lo pide.
  */

  if (
    EVENT_CONFIG
      ?.gallery
      ?.showArrows === false
  ) {

    if (prevButton) {

      prevButton.hidden = true;

    }


    if (nextButton) {

      nextButton.hidden = true;

    }

  }


  /*
    Cerrar haciendo click
    sobre el fondo.
  */

  lightbox.addEventListener(
    "click",
    event => {

      if (
        event.target === lightbox
      ) {

        closeLightbox();

      }

    }
  );


  /*
    Navegación con teclado.
  */

  document.addEventListener(
    "keydown",
    handleLightboxKeyboard
  );


  /*
    Swipe en celular.
  */

  lightbox.addEventListener(
    "touchstart",
    handleTouchStart,
    {
      passive: true
    }
  );


  lightbox.addEventListener(
    "touchend",
    handleTouchEnd,
    {
      passive: true
    }
  );

}


/* =========================================================
   ABRIR LIGHTBOX
========================================================= */

function openLightbox(
  index
) {

  const lightbox =
    document.getElementById(
      "gallery-lightbox"
    );


  if (
    !lightbox ||
    !galleryImages.length
  ) {
    return;
  }


  currentGalleryIndex =
    normalizeGalleryIndex(
      index
    );


  updateLightboxImage();


  lightbox.classList.add(
    "is-open"
  );


  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "no-scroll"
  );


  /*
    Foco en botón cerrar.
  */

  window.setTimeout(
    () => {

      document
        .getElementById(
          "lightbox-close"
        )
        ?.focus();

    },
    50
  );

}


/* =========================================================
   CERRAR LIGHTBOX
========================================================= */

function closeLightbox() {

  const lightbox =
    document.getElementById(
      "gallery-lightbox"
    );


  if (!lightbox) {
    return;
  }


  lightbox.classList.remove(
    "is-open"
  );


  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "no-scroll"
  );

}


/* =========================================================
   ACTUALIZAR IMAGEN DEL LIGHTBOX
========================================================= */

function updateLightboxImage() {

  const imageElement =
    document.getElementById(
      "lightbox-image"
    );


  if (
    !imageElement ||
    !galleryImages.length
  ) {
    return;
  }


  const image =
    galleryImages[
      currentGalleryIndex
    ];


  imageElement.src =
    image.src;


  imageElement.alt =
    image.alt
    ||
    `Imagen ${currentGalleryIndex + 1}`;


  updateGalleryDots();

}


/* =========================================================
   SIGUIENTE / ANTERIOR
========================================================= */

function showNextImage() {

  currentGalleryIndex =
    normalizeGalleryIndex(
      currentGalleryIndex + 1
    );


  updateLightboxImage();

}


function showPreviousImage() {

  currentGalleryIndex =
    normalizeGalleryIndex(
      currentGalleryIndex - 1
    );


  updateLightboxImage();

}


/* =========================================================
   NORMALIZAR ÍNDICE
========================================================= */

function normalizeGalleryIndex(
  index
) {

  const total =
    galleryImages.length;


  if (!total) {
    return 0;
  }


  return (
    index + total
  ) % total;

}


/* =========================================================
   ACTUALIZAR PUNTOS
========================================================= */

function updateGalleryDots() {

  const dots =
    document.querySelectorAll(
      ".gallery-dot"
    );


  dots.forEach(
    (dot, index) => {

      dot.classList.toggle(
        "is-active",
        index === currentGalleryIndex
      );

    }
  );

}


/* =========================================================
   TECLADO
========================================================= */

function handleLightboxKeyboard(
  event
) {

  const lightbox =
    document.getElementById(
      "gallery-lightbox"
    );


  if (
    !lightbox ||
    !lightbox.classList.contains(
      "is-open"
    )
  ) {
    return;
  }


  switch (
    event.key
  ) {

    case "Escape":

      closeLightbox();

      break;


    case "ArrowRight":

      showNextImage();

      break;


    case "ArrowLeft":

      showPreviousImage();

      break;

  }

}


/* =========================================================
   SWIPE EN CELULAR
========================================================= */

function handleTouchStart(
  event
) {

  touchStartX =
    event.changedTouches[0].screenX;

}


function handleTouchEnd(
  event
) {

  touchEndX =
    event.changedTouches[0].screenX;


  handleSwipeGesture();

}


function handleSwipeGesture() {

  const difference =
    touchStartX - touchEndX;


  const minimumDistance =
    50;


  /*
    Swipe hacia la izquierda.
  */

  if (
    difference > minimumDistance
  ) {

    showNextImage();

    return;

  }


  /*
    Swipe hacia la derecha.
  */

  if (
    difference < -minimumDistance
  ) {

    showPreviousImage();

  }

}


/* =========================================================
   AUTOPLAY OPCIONAL
========================================================= */

function initGalleryAutoplay() {

  if (
    EVENT_CONFIG
      ?.gallery
      ?.autoplay !== true
  ) {
    return;
  }


  const speed =
    EVENT_CONFIG
      ?.gallery
      ?.autoplaySpeed
    ||
    5000;


  galleryAutoplayInterval =
    window.setInterval(
      () => {

        currentGalleryIndex =
          normalizeGalleryIndex(
            currentGalleryIndex + 1
          );


        updateGalleryDots();

      },
      speed
    );

}


/* =========================================================
   DETENER AUTOPLAY
========================================================= */

function stopGalleryAutoplay() {

  if (
    !galleryAutoplayInterval
  ) {
    return;
  }


  window.clearInterval(
    galleryAutoplayInterval
  );


  galleryAutoplayInterval = null;

}