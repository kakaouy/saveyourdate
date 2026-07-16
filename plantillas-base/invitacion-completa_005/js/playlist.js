/* =========================================================
   PLAYLIST.JS
   Envío de sugerencias de canciones
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initPlaylist();
});


/* =========================================================
   INICIALIZAR PLAYLIST
========================================================= */

function initPlaylist() {

  /*
    Si la sección está desactivada,
    no hacemos nada.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.sections?.playlist === false
  ) {
    return;
  }


  const form =
    document.getElementById(
      "playlist-form"
    );


  if (!form) {
    return;
  }


  /*
    Configurar campos visibles.
  */

  configurePlaylistFields();


  /*
    Envío del formulario.
  */

  form.addEventListener(
    "submit",
    handlePlaylistSubmit
  );

}


/* =========================================================
   CONFIGURAR CAMPOS DEL FORMULARIO
========================================================= */

function configurePlaylistFields() {

  const config =
    EVENT_CONFIG?.playlist?.form;


  if (!config) {
    return;
  }


  const nameInput =
    document.getElementById(
      "playlist-name"
    );


  const linkInput =
    document.getElementById(
      "playlist-link"
    );


  /*
    Mostrar / ocultar nombre.
  */

  if (
    config.showName === false &&
    nameInput
  ) {

    const group =
      nameInput.closest(
        ".form__group"
      );


    if (group) {

      group.hidden = true;

    }

  }


  /*
    Mostrar / ocultar link.
  */

  if (
    config.showLink === false &&
    linkInput
  ) {

    const group =
      linkInput.closest(
        ".form__group"
      );


    if (group) {

      group.hidden = true;

    }

  }


  /*
    Cambiar textos de labels.
  */

  setPlaylistLabel(
    "playlist-name",
    config.nameLabel
  );


  setPlaylistLabel(
    "playlist-song",
    config.songLabel
  );


  setPlaylistLabel(
    "playlist-link",
    config.linkLabel
  );


  /*
    Texto del botón.
  */

  const submitButton =
    document.querySelector(
      "#playlist-form button[type='submit']"
    );


  if (
    submitButton &&
    config.submitText
  ) {

    submitButton.textContent =
      config.submitText;

  }

}


/* =========================================================
   CAMBIAR LABEL
========================================================= */

function setPlaylistLabel(
  inputId,
  text
) {

  if (!text) {
    return;
  }


  const label =
    document.querySelector(
      `label[for="${inputId}"]`
    );


  if (label) {

    label.textContent =
      text;

  }

}


/* =========================================================
   ENVIAR FORMULARIO
========================================================= */

async function handlePlaylistSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const submitButton =
    form.querySelector(
      "button[type='submit']"
    );


  const status =
    document.getElementById(
      "playlist-form-status"
    );


  /*
    Obtener datos.
  */

  const data =
    getPlaylistFormData();


  /*
    Validación.
  */

  const validation =
    validatePlaylistData(
      data
    );


  if (!validation.valid) {

    showPlaylistStatus(
      validation.message,
      "error"
    );

    return;

  }


  /*
    Evitar doble envío.
  */

  if (submitButton) {

    submitButton.disabled = true;

    submitButton.dataset.originalText =
      submitButton.textContent;

    submitButton.textContent =
      "Enviando...";

  }


  if (status) {

    status.textContent = "";

  }


  try {

    /*
      Enviar canción.
    */

    const result =
      await sendPlaylistSuggestion(
        data
      );


    if (!result.success) {

      throw new Error(
        result.message ||
        "No se pudo guardar la canción."
      );

    }


    /*
      Mensaje de éxito.
    */

    showPlaylistStatus(
      result.message ||
      "¡Gracias! Tu canción fue enviada.",
      "success"
    );


    /*
      Limpiar formulario.
    */

    form.reset();


    /*
      Evento personalizado.
    */

    document.dispatchEvent(
      new CustomEvent(
        "playlist:submitted",
        {
          detail: {
            data
          }
        }
      )
    );

  }
  catch (error) {

    console.error(
      "Error al enviar canción:",
      error
    );


    showPlaylistStatus(
      EVENT_CONFIG
        ?.playlist
        ?.errorMessage
      ||
      "Ocurrió un error. Intentá nuevamente.",
      "error"
    );

  }
  finally {

    /*
      Restaurar botón.
    */

    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        submitButton.dataset.originalText
        ||
        "Enviar canción";

    }

  }

}


/* =========================================================
   OBTENER DATOS
========================================================= */

function getPlaylistFormData() {

  const nameInput =
    document.getElementById(
      "playlist-name"
    );


  const songInput =
    document.getElementById(
      "playlist-song"
    );


  const linkInput =
    document.getElementById(
      "playlist-link"
    );


  /*
    Parámetro de grupo desde la URL.
  */

  const groupParamName =
    EVENT_CONFIG
      ?.urlParams
      ?.guestGroup
    ||
    "grupo";


  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  const group =
    urlParams.get(
      groupParamName
    )
    ||
    "";


  return {

    action: "song",

    eventId:
      EVENT_CONFIG
        ?.event
        ?.id
      ||
      "",

    group,

    name:
      nameInput
        ?.value
        ?.trim()
      ||
      "",

    song:
      songInput
        ?.value
        ?.trim()
      ||
      "",

    link:
      linkInput
        ?.value
        ?.trim()
      ||
      "",

    date:
      new Date()
        .toISOString()

  };

}


/* =========================================================
   VALIDACIÓN
========================================================= */

function validatePlaylistData(
  data
) {

  if (!data.song) {

    return {
      valid: false,
      message:
        "Escribí el nombre de una canción."
    };

  }


  /*
    Validar URL si se ingresó una.
  */

  if (
    data.link &&
    !isValidPlaylistUrl(
      data.link
    )
  ) {

    return {
      valid: false,
      message:
        "El link ingresado no parece válido."
    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   VALIDAR URL
========================================================= */

function isValidPlaylistUrl(
  value
) {

  try {

    const url =
      new URL(value);


    return (
      url.protocol === "http:"
      ||
      url.protocol === "https:"
    );

  }
  catch {

    return false;

  }

}


/* =========================================================
   ENVIAR SUGERENCIA
========================================================= */

async function sendPlaylistSuggestion(
  data
) {

  /*
    Endpoint específico de playlist.
  */

  const playlistEndpoint =
    EVENT_CONFIG
      ?.integrations
      ?.playlist
      ?.endpoint;


  /*
    Endpoint general de Google Sheets.
  */

  const generalEndpoint =
    EVENT_CONFIG
      ?.integrations
      ?.googleSheets
      ?.scriptUrl;


  const endpoint =
    playlistEndpoint
    ||
    generalEndpoint;


  /*
    Si no hay endpoint configurado,
    usamos modo demo.
  */

  if (!endpoint) {

    console.info(
      "Playlist en modo demo.",
      data
    );


    await simulatePlaylistRequest();


    return {
      success: true,
      message:
        "¡Gracias! Tu canción fue registrada."
    };

  }


  /*
    Enviar al backend.
  */

  const response =
    await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(
            data
          )
      }
    );


  if (!response.ok) {

    throw new Error(
      `Error HTTP ${response.status}`
    );

  }


  /*
    Intentamos leer JSON.
  */

  const responseText =
    await response.text();


  if (!responseText) {

    return {
      success: true
    };

  }


  try {

    return JSON.parse(
      responseText
    );

  }
  catch {

    /*
      Algunos Apps Script pueden responder
      texto simple.
    */

    return {
      success: true,
      message:
        responseText
    };

  }

}


/* =========================================================
   SIMULACIÓN PARA DESARROLLO
========================================================= */

function simulatePlaylistRequest() {

  return new Promise(
    resolve => {

      window.setTimeout(
        resolve,
        700
      );

    }
  );

}


/* =========================================================
   MOSTRAR ESTADO
========================================================= */

function showPlaylistStatus(
  message,
  type = "info"
) {

  const status =
    document.getElementById(
      "playlist-form-status"
    );


  if (!status) {
    return;
  }


  status.textContent =
    message;


  status.classList.remove(
    "is-success",
    "is-error",
    "is-info"
  );


  status.classList.add(
    `is-${type}`
  );

}