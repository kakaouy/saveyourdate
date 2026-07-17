/* =========================================================
   CONTROL GENERAL DE MODALES
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const modalTriggers = [
      {
        buttonId: "open-location",
        modalId: "location-modal"
      },
      {
        buttonId: "open-gifts-modal",
        modalId: "gifts-modal"
      },
      {
        buttonId: "open-playlist-modal",
        modalId: "playlist-modal"
      },
      {
        buttonId: "open-rsvp-modal",
        modalId: "rsvp-modal"
      }
    ];

    modalTriggers.forEach(
      ({ buttonId, modalId }) => {
        const button =
          document.getElementById(
            buttonId
          );

        if (!button) {
          return;
        }

        button.addEventListener(
          "click",
          () => {
            openModal(modalId);
          }
        );
      }
    );

    document.addEventListener(
      "click",
      (event) => {
        const closeElement =
          event.target.closest(
            "[data-close-modal]"
          );

        if (!closeElement) {
          return;
        }

        const modal =
          closeElement.closest(
            ".modal"
          );

        if (!modal) {
          return;
        }

        const isBackdrop =
          closeElement.classList.contains(
            "modal__backdrop"
          );

        if (
          isBackdrop &&
          EVENT_CONFIG.behavior
            ?.closeModalOnBackdrop === false
        ) {
          return;
        }

        closeModal(modal);
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key !== "Escape" ||
          EVENT_CONFIG.behavior
            ?.closeModalOnEscape === false
        ) {
          return;
        }

        const modal =
          getOpenModal();

        if (modal) {
          closeModal(modal);
        }
      }
    );
  }
);


/* =========================================================
   ABRIR MODAL
========================================================= */

function openModal(modalId) {
  const modal =
    document.getElementById(
      modalId
    );

  if (!modal) {
    return;
  }

  closeAllModals();

  modal.dataset.previousFocus =
    document.activeElement?.id || "";

  modal.hidden = false;

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  if (
    EVENT_CONFIG.behavior
      ?.lockBodyOnModal !== false
  ) {
    document.body.classList.add(
      "no-scroll"
    );
  }

  window.requestAnimationFrame(
    () => {
      const focusTarget =
        modal.querySelector(
          ".modal__close, button, input, textarea, select, a[href]"
        );

      focusTarget?.focus();
    }
  );
}


/* =========================================================
   CERRAR MODAL
========================================================= */

function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.hidden = true;

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "no-scroll"
  );

  const previousFocusId =
    modal.dataset.previousFocus;

  if (previousFocusId) {
    document
      .getElementById(
        previousFocusId
      )
      ?.focus();
  }
}


/* =========================================================
   CERRAR TODOS
========================================================= */

function closeAllModals() {
  document
    .querySelectorAll(
      ".modal:not([hidden])"
    )
    .forEach(
      (modal) => {
        closeModal(modal);
      }
    );
}


/* =========================================================
   MODAL ABIERTO
========================================================= */

function getOpenModal() {
  return document.querySelector(
    ".modal:not([hidden])"
  );
}