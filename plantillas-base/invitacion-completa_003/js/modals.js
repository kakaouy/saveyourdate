/* =========================================================
   MODALS.JS
   Sistema general de modales
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initModals();
});


/* =========================================================
   INICIALIZAR MODALES
========================================================= */

function initModals() {

  /*
    Botón ubicación
  */

  bindModalButton(
    "open-location",
    "location-modal"
  );


  /*
    Botón regalos
  */

  bindModalButton(
    "open-gifts-modal",
    "gifts-modal"
  );


  /*
    Botón playlist
  */

  bindModalButton(
    "open-playlist-modal",
    "playlist-modal"
  );


  /*
    Botón RSVP
  */

  bindModalButton(
    "open-rsvp-modal",
    "rsvp-modal"
  );


  /*
    Botones y fondos con data-close-modal
  */

  document
    .querySelectorAll("[data-close-modal]")
    .forEach(element => {

      element.addEventListener(
        "click",
        event => {

          const modal =
            event.target.closest(".modal");


          if (modal) {

            closeModal(modal);

          }

        }
      );

    });


  /*
    Cerrar con tecla Escape
  */

  document.addEventListener(
    "keydown",
    handleModalEscape
  );
}


/* =========================================================
   ASOCIAR BOTÓN CON MODAL
========================================================= */

function bindModalButton(
  buttonId,
  modalId
) {

  const button =
    document.getElementById(buttonId);


  const modal =
    document.getElementById(modalId);


  if (!button || !modal) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      openModal(modal);

    }
  );

}


/* =========================================================
   ABRIR MODAL
========================================================= */

function openModal(modal) {

  if (!modal) {
    return;
  }


  /*
    Cerramos cualquier otro modal
    que pudiera estar abierto.
  */

  closeAllModals();


  modal.classList.add(
    "is-open"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  /*
    Bloquear scroll de fondo
  */

  if (
    EVENT_CONFIG?.behavior?.lockBodyOnModal
    !== false
  ) {

    document.body.classList.add(
      "no-scroll"
    );

  }


  /*
    Guardamos el elemento que tenía foco
    para devolverle el foco al cerrar.
  */

  modal._previousActiveElement =
    document.activeElement;


  /*
    Ponemos el foco en el primer
    elemento interactivo del modal.
  */

  window.setTimeout(() => {

    const focusable =
      getFocusableElements(modal);


    if (focusable.length) {

      focusable[0].focus();

    }

  }, 50);


  /*
    Activamos el control del foco
    dentro del modal.
  */

  modal.addEventListener(
    "keydown",
    trapFocus
  );
}


/* =========================================================
   CERRAR MODAL
========================================================= */

function closeModal(modal) {

  if (!modal) {
    return;
  }


  modal.classList.remove(
    "is-open"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  modal.removeEventListener(
    "keydown",
    trapFocus
  );


  /*
    Si no queda ningún otro modal abierto,
    restauramos el scroll.
  */

  const openModalExists =
    document.querySelector(
      ".modal.is-open"
    );


  if (!openModalExists) {

    document.body.classList.remove(
      "no-scroll"
    );

  }


  /*
    Devolvemos el foco
    al elemento que abrió el modal.
  */

  if (
    modal._previousActiveElement
    instanceof HTMLElement
  ) {

    modal._previousActiveElement.focus();

  }

}


/* =========================================================
   CERRAR TODOS LOS MODALES
========================================================= */

function closeAllModals() {

  document
    .querySelectorAll(".modal.is-open")
    .forEach(modal => {

      closeModal(modal);

    });

}


/* =========================================================
   CERRAR CON ESCAPE
========================================================= */

function handleModalEscape(event) {

  if (event.key !== "Escape") {
    return;
  }


  if (
    EVENT_CONFIG?.behavior?.closeModalOnEscape
    === false
  ) {
    return;
  }


  const openModal =
    document.querySelector(
      ".modal.is-open"
    );


  if (openModal) {

    closeModal(openModal);

  }

}


/* =========================================================
   ELEMENTOS QUE PUEDEN RECIBIR FOCO
========================================================= */

function getFocusableElements(container) {

  return Array.from(
    container.querySelectorAll(`
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      textarea:not([disabled]),
      select:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `)
  ).filter(element => {

    return !element.hasAttribute(
      "hidden"
    );

  });

}


/* =========================================================
   MANTENER EL FOCO DENTRO DEL MODAL
========================================================= */

function trapFocus(event) {

  if (event.key !== "Tab") {
    return;
  }


  const modal =
    event.currentTarget;


  const focusable =
    getFocusableElements(modal);


  if (!focusable.length) {
    return;
  }


  const firstElement =
    focusable[0];


  const lastElement =
    focusable[
      focusable.length - 1
    ];


  /*
    Shift + Tab desde el primer elemento
    vuelve al último.
  */

  if (
    event.shiftKey &&
    document.activeElement
      === firstElement
  ) {

    event.preventDefault();

    lastElement.focus();

    return;
  }


  /*
    Tab desde el último elemento
    vuelve al primero.
  */

  if (
    !event.shiftKey &&
    document.activeElement
      === lastElement
  ) {

    event.preventDefault();

    firstElement.focus();

  }

}