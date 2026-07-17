/* =========================================================
   PLAYLIST
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const form =
      document.getElementById(
        "playlist-form"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      handlePlaylistSubmit
    );
  }
);


/* =========================================================
   ENVIAR CANCIÓN
========================================================= */

async function handlePlaylistSubmit(
  event
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const status =
    document.getElementById(
      "playlist-form-status"
    );

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );

  const config =
    EVENT_CONFIG.playlist || {};

  const integration =
    EVENT_CONFIG.integrations
      ?.playlist || {};

  const googleSheets =
    EVENT_CONFIG.integrations
      ?.googleSheets || {};

  const name =
    document
      .getElementById(
        "playlist-name"
      )
      ?.value
      .trim() || "";

  const song =
    document
      .getElementById(
        "playlist-song"
      )
      ?.value
      .trim() || "";

  const link =
    document
      .getElementById(
        "playlist-link"
      )
      ?.value
      .trim() || "";

  if (!song) {
    setFormStatus(
      status,
      "Escribí el nombre de una canción.",
      "error"
    );

    return;
  }

  const endpoint =
    integration.endpoint ||
    googleSheets.scriptUrl;

  if (
    integration.enabled === false ||
    !endpoint
  ) {
    setFormStatus(
      status,
      "La playlist todavía no está habilitada.",
      "info"
    );

    return;
  }

  setPlaylistLoading(
    submitButton,
    true
  );

  setFormStatus(
    status,
    "Enviando canción...",
    "info"
  );

  try {
    const response =
      await jsonpRequest(
        endpoint,
        {
          accion: "cancion",
          fecha:
            new Date()
              .toISOString(),
          grupo:
            getGuestGroup(),
          nombre: name,
          cancion: song,
          link
        }
      );

    if (
      response?.ok === false ||
      response?.success === false
    ) {
      throw new Error(
        response?.message ||
        "No se pudo guardar."
      );
    }

    setFormStatus(
      status,
      "¡Gracias! Tu canción fue enviada.",
      "success"
    );

    form.reset();

    window.setTimeout(
      () => {
        const modal =
          document.getElementById(
            "playlist-modal"
          );

        if (
          modal &&
          typeof closeModal ===
            "function"
        ) {
          closeModal(modal);
        }

        clearFormStatus(
          status
        );
      },
      1800
    );
  }
  catch (error) {
    console.error(
      "Error al enviar la canción:",
      error
    );

    setFormStatus(
      status,
      config.errorMessage ||
        "No pudimos enviar tu canción. Intentá nuevamente.",
      "error"
    );
  }
  finally {
    setPlaylistLoading(
      submitButton,
      false
    );
  }
}


/* =========================================================
   GRUPO DE INVITADOS
========================================================= */

function getGuestGroup() {
  const parameterName =
    EVENT_CONFIG.urlParams
      ?.guestGroup || "grupo";

  return (
    getUrlParameter(
      parameterName
    ) ||
    "sin-grupo"
  );
}


/* =========================================================
   ESTADO DEL BOTÓN
========================================================= */

function setPlaylistLoading(
  button,
  isLoading
) {
  if (!button) {
    return;
  }

  if (
    !button.dataset.originalText
  ) {
    button.dataset.originalText =
      button.textContent;
  }

  button.disabled =
    isLoading;

  button.textContent =
    isLoading
      ? "Enviando..."
      : button.dataset.originalText;
}