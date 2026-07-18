/* =========================================================
   INICIALIZACIÓN GENERAL
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    initializeHiddenElements();
    initializeWelcomeState();
    initializeSmoothScroll();
    initializeRevealAnimations();
    initializePhotoWindowReveal();
    initializeImageErrors();
  }
);


/* =========================================================
   OCULTAR MODALES Y LIGHTBOX AL INICIAR
========================================================= */

function initializeHiddenElements() {
  document
    .querySelectorAll(
      ".modal, .lightbox"
    )
    .forEach(
      (element) => {
        if (
          element.getAttribute(
            "aria-hidden"
          ) === "true"
        ) {
          element.hidden = true;
        }
      }
    );
}


/* =========================================================
   ESTADO DE LA PANTALLA DE BIENVENIDA
========================================================= */

function initializeWelcomeState() {
  const welcome =
    document.getElementById(
      "welcome-screen"
    );

  const welcomeEnabled =
    EVENT_CONFIG.sections
      ?.welcome !== false;

  if (!welcome) {
    return;
  }

  if (!welcomeEnabled) {
    welcome.hidden = true;

    welcome.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "no-scroll"
    );

    return;
  }

  welcome.hidden = false;

  welcome.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "no-scroll"
  );
}


/* =========================================================
   DESPLAZAMIENTO SUAVE
========================================================= */

function initializeSmoothScroll() {
  if (
    EVENT_CONFIG.behavior
      ?.smoothScroll === false
  ) {
    return;
  }

  document.addEventListener(
    "click",
    (event) => {
      const link =
        event.target.closest(
          'a[href^="#"]'
        );

      if (!link) {
        return;
      }

      const targetId =
        link.getAttribute(
          "href"
        );

      if (
        !targetId ||
        targetId === "#"
      ) {
        return;
      }

      const target =
        document.querySelector(
          targetId
        );

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  );
}


/* =========================================================
   ANIMACIONES AL HACER SCROLL
========================================================= */

function initializeRevealAnimations() {
  const config =
    EVENT_CONFIG.animations || {};

  const elements =
    document.querySelectorAll(
      [
        ".polaroid-section",
        ".editorial-quote__text",
        ".editorial-quote__author",
        ".section-heading",
        ".schedule__date",
        ".schedule__item",
        ".countdown",
        ".event-card",
        ".location-card",
        ".dresscode-card",
        ".gallery__item",
        ".section--editorial .editorial-content > p",
        ".section--editorial .editorial-content > .btn",
        ".section--closing .closing",
        ".footer__content"
      ].join(",")
    );

  if (
    config.enabled === false ||
    config.revealOnScroll === false ||
    !("IntersectionObserver" in window)
  ) {
    elements.forEach(
      (element) => {
        element.classList.add(
          "is-visible"
        );
      }
    );

    return;
  }

  elements.forEach(
    (element) => {
      if (
        !element.dataset.animation
      ) {
        element.dataset.animation =
          config.defaultAnimation ||
          "fade-up";
      }
    }
  );

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );
          }
        );
      },
      {
        threshold:
          config.threshold ?? 0.15,

        rootMargin:
          "0px 0px -40px 0px"
      }
    );

  elements.forEach(
    (element) => {
      observer.observe(element);
    }
  );
}


/* =========================================================
   DETECTAR RECURSOS GRÁFICOS FALTANTES
========================================================= */

function initializeImageErrors() {
  document.addEventListener(
    "error",
    (event) => {
      const image =
        event.target;

      if (
        !(image instanceof HTMLImageElement)
      ) {
        return;
      }

      image.classList.add(
        "image-load-error"
      );

      console.warn(
        "No se encontró la imagen:",
        image.getAttribute("src")
      );
    },
    true
  );
}

/* =========================================================
   REVELADO PROGRESIVO DE LA FOTO IMPORTANTE
========================================================= */

function initializePhotoWindowReveal() {
  const section = document.getElementById("full-photo-section");
  if (!section) return;

  let ticking = false;

  const update = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const travel = Math.max(rect.height - viewportHeight, 1);
    const progress = Math.min(
      1,
      Math.max(0, -rect.top / travel)
    );

    const inset =
      18 * (1 - progress);
    const scale =
      1.06 - (0.06 * progress);

    section.style.setProperty(
      "--photo-reveal-progress",
      progress.toFixed(3)
    );
    section.style.setProperty(
      "--photo-reveal-inset",
      `${inset.toFixed(2)}%`
    );
    section.style.setProperty(
      "--photo-reveal-scale",
      scale.toFixed(3)
    );

    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}
