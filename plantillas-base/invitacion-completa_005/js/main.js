/* =========================================================
   MAIN.JS
   Inicialización general de la invitación
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initInvitation();
});


function initInvitation() {
  initWelcomeScreen();
  initScrollDown();
  initRevealAnimations();
}


/* =========================================================
   PANTALLA DE BIENVENIDA
========================================================= */

function initWelcomeScreen() {
  const welcomeScreen = document.getElementById("welcome-screen");

  const enterWithMusic = document.getElementById("enter-with-music");

  const enterWithoutMusic = document.getElementById(
    "enter-without-music"
  );


  if (!welcomeScreen) {
    return;
  }


  /*
    Si la sección de bienvenida está desactivada,
    ocultamos la pantalla directamente.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.sections?.welcome === false
  ) {
    welcomeScreen.hidden = true;

    document.body.classList.remove("no-scroll");

    return;
  }


  /*
    Mientras la pantalla inicial está abierta,
    bloqueamos el scroll de la página.
  */

  document.body.classList.add("no-scroll");


  /*
    ENTRAR CON MÚSICA
  */

  enterWithMusic?.addEventListener("click", async () => {

    /*
      La reproducción real de música
      estará controlada por music.js.

      Disparamos un evento personalizado
      para que music.js lo escuche.
    */

    document.dispatchEvent(
      new CustomEvent("invitation:enter", {
        detail: {
          music: true
        }
      })
    );


    closeWelcomeScreen();
  });


  /*
    ENTRAR SIN MÚSICA
  */

  enterWithoutMusic?.addEventListener("click", () => {

    document.dispatchEvent(
      new CustomEvent("invitation:enter", {
        detail: {
          music: false
        }
      })
    );


    closeWelcomeScreen();
  });
}


/* =========================================================
   CERRAR PANTALLA DE BIENVENIDA
========================================================= */

function closeWelcomeScreen() {
  const welcomeScreen = document.getElementById(
    "welcome-screen"
  );


  if (!welcomeScreen) {
    return;
  }


  welcomeScreen.classList.add("is-closing");

  welcomeScreen.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove("no-scroll");


  /*
    Esperamos a que termine la animación
    antes de ocultarla completamente.
  */

  window.setTimeout(() => {

    welcomeScreen.hidden = true;

  }, 700);
}


/* =========================================================
   FLECHA DE SCROLL DEL HERO
========================================================= */

function initScrollDown() {
  const scrollButton = document.getElementById(
    "scroll-down"
  );


  if (!scrollButton) {
    return;
  }


  scrollButton.addEventListener("click", () => {

    /*
      Buscamos la primera sección visible
      después del hero.
    */

    const sections = document.querySelectorAll(
      "main .section:not([hidden])"
    );


    if (!sections.length) {
      return;
    }


    sections[0].scrollIntoView({
      behavior:
        EVENT_CONFIG?.behavior?.smoothScroll === false
          ? "auto"
          : "smooth",

      block: "start"
    });

  });
}


/* =========================================================
   ANIMACIONES AL HACER SCROLL
========================================================= */

function initRevealAnimations() {

  /*
    Si las animaciones están desactivadas,
    mostramos todo directamente.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.animations?.enabled === false
  ) {
    showAllAnimatedElements();

    return;
  }


  /*
    Si revealOnScroll está desactivado,
    mostramos todo.
  */

  if (
    EVENT_CONFIG?.animations?.revealOnScroll === false
  ) {
    showAllAnimatedElements();

    return;
  }


  /*
    Elementos que ya tengan data-animate.
  */

  let animatedElements = document.querySelectorAll(
    "[data-animate]"
  );


  /*
    Si todavía no agregamos atributos
    data-animate manualmente en el HTML,
    los añadimos automáticamente.
  */

  if (!animatedElements.length) {

    addDefaultAnimations();

    animatedElements = document.querySelectorAll(
      "[data-animate]"
    );

  }


  /*
    Si el navegador no soporta IntersectionObserver,
    mostramos todo.
  */

  if (!("IntersectionObserver" in window)) {

    showAllAnimatedElements();

    return;
  }


  const threshold =
    EVENT_CONFIG?.animations?.threshold ?? 0.15;


  const observer = new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        if (!entry.isIntersecting) {
          return;
        }


        entry.target.classList.add(
          "is-visible"
        );


        /*
          Una vez animado,
          dejamos de observar el elemento.
        */

        observer.unobserve(
          entry.target
        );

      });

    },
    {
      threshold
    }
  );


  animatedElements.forEach(element => {

    observer.observe(element);

  });
}


/* =========================================================
   ANIMACIONES AUTOMÁTICAS POR DEFECTO
========================================================= */

function addDefaultAnimations() {

  const defaultAnimation =
    EVENT_CONFIG?.animations?.defaultAnimation
    || "fade-up";


  /*
    Títulos de sección
  */

  document
    .querySelectorAll(".section-heading")
    .forEach(element => {

      element.dataset.animate =
        defaultAnimation;

    });


  /*
    Tarjetas principales
  */

  document
    .querySelectorAll(`
      .event-card,
      .location-card,
      .dresscode-card,
      .gifts-card,
      .playlist-card,
      .rsvp-card,
      .closing
    `)
    .forEach(element => {

      element.dataset.animate =
        defaultAnimation;

    });


  /*
    Cuenta regresiva
  */

  const countdown =
    document.getElementById("countdown");


  if (countdown) {

    countdown.dataset.animate =
      defaultAnimation;

  }


  /*
    Galería
  */

  const gallery =
    document.getElementById("gallery");


  if (gallery) {

    gallery.dataset.animate =
      defaultAnimation;

  }

}


/* =========================================================
   MOSTRAR TODOS LOS ELEMENTOS ANIMADOS
========================================================= */

function showAllAnimatedElements() {

  document
    .querySelectorAll("[data-animate]")
    .forEach(element => {

      element.classList.add(
        "is-visible"
      );

    });

}