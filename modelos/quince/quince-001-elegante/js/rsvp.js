/* =========================================================
   RSVP.JS
   Confirmación de asistencia
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initRsvp();
});


/* =========================================================
   VARIABLES INTERNAS
========================================================= */

let rsvpGuests = [];

let currentRsvpGroup = "";


/* =========================================================
   INICIALIZAR RSVP
========================================================= */

async function initRsvp() {

  /*
    Si la sección está desactivada,
    no hacemos nada.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.sections?.rsvp === false
  ) {
    return;
  }


  currentRsvpGroup =
    getRsvpGroupFromUrl();


  const openButton =
    document.getElementById(
      "open-rsvp-modal"
    );


  const submitButton =
    document.getElementById(
      "submit-rsvp"
    );


  /*
    Cargar invitados
    al abrir el modal.
  */

  openButton?.addEventListener(
    "click",
    async () => {

      if (!rsvpGuests.length) {

        await loadRsvpGuests();

      }

    }
  );


  /*
    Guardar confirmación.
  */

  submitButton?.addEventListener(
    "click",
    handleRsvpSubmit
  );

}


/* =========================================================
   OBTENER GRUPO DESDE LA URL
========================================================= */

function getRsvpGroupFromUrl() {

  const paramName =
    EVENT_CONFIG
      ?.urlParams
      ?.guestGroup
    ||
    "grupo";


  const params =
    new URLSearchParams(
      window.location.search
    );


  return (
    params.get(
      paramName
    )
    ||
    ""
  );

}


/* =========================================================
   CARGAR INVITADOS
========================================================= */
async function loadRsvpGuests() {

  const guestList =
    document.getElementById(
      "guest-list"
    );


  if (!guestList) {

    console.error(
      "No existe #guest-list"
    );

    return;
  }


  showRsvpStatus(
    "Cargando invitados...",
    "info"
  );


  guestList.innerHTML = "";


  try {

    const result =
      await fetchRsvpGuests(
        currentRsvpGroup
      );


    if (
      !result.success ||
      !Array.isArray(
        result.guests
      )
    ) {

      throw new Error(
        result.message ||
        "No se pudieron cargar los invitados."
      );

    }


    rsvpGuests =
      result.guests;


    if (!rsvpGuests.length) {

      showEmptyGuestMessage();

      return;
    }


    renderGuestList();


    showRsvpStatus(
      "",
      "info"
    );

  }
  catch (error) {

    console.error(
      "ERROR RSVP:",
      error
    );


    guestList.innerHTML = "";


    showRsvpStatus(
      EVENT_CONFIG
        ?.rsvp
        ?.loadErrorMessage
      ||
      "No pudimos cargar los invitados.",
      "error"
    );

  }

}

/* =========================================================
   CONSULTAR INVITADOS
========================================================= */

/* =========================================================
   CONSULTAR INVITADOS
   Usamos JSONP para evitar problemas de CORS
========================================================= */

function fetchRsvpGuests(group) {

  const endpoint =
    getRsvpEndpoint();


  /*
    Modo demo
  */

  if (!endpoint) {

    console.info(
      "RSVP en modo demo."
    );


    return simulateRsvpRequest()
      .then(() => ({
        success: true,

        guests: [
          {
            id: "1",
            row: 2,
            name: "Invitado de ejemplo",
            status: "",
            dietaryRestriction: "none",
            dietaryDetail: ""
          },

          {
            id: "2",
            row: 3,
            name: "Segundo invitado",
            status: "",
            dietaryRestriction: "none",
            dietaryDetail: ""
          }
        ]
      }));

  }


  /*
    JSONP
  */

  return new Promise(
    (resolve, reject) => {

      const callbackName =
        `rsvpCallback_${Date.now()}`;


      const script =
        document.createElement(
          "script"
        );


      const url =
        new URL(endpoint);


      url.searchParams.set(
        "action",
        "guests"
      );


      url.searchParams.set(
        "eventId",
        EVENT_CONFIG?.event?.id || ""
      );


      url.searchParams.set(
        "group",
        group
      );


      url.searchParams.set(
        "callback",
        callbackName
      );


      /*
        Función global que recibirá
        la respuesta de Apps Script.
      */

      window[callbackName] =
        function (data) {

          resolve(data);


          delete window[
            callbackName
          ];


          script.remove();

        };


      /*
        Si falla la carga.
      */

      script.onerror =
        function () {

          reject(
            new Error(
              "No se pudieron cargar los invitados."
            )
          );


          delete window[
            callbackName
          ];


          script.remove();

        };


      script.src =
        url.toString();


      document.body.appendChild(
        script
      );

    }
  );

}


/* =========================================================
   RENDERIZAR LISTA DE INVITADOS
========================================================= */

function renderGuestList() {

  const container =
    document.getElementById(
      "guest-list"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  rsvpGuests.forEach(
    guest => {

      const card =
        createGuestCard(
          guest
        );


      container.appendChild(
        card
      );

    }
  );


}


/* =========================================================
   CREAR TARJETA DE INVITADO
========================================================= */

function createGuestCard(
  guest
) {

  const card =
    document.createElement(
      "div"
    );


  card.className =
    "guest-card";


  card.dataset.guestId =
    String(
      guest.id ?? ""
    );


  card.dataset.row =
    String(
      guest.row ?? ""
    );


  /*
    Nombre.
  */

  const name =
    document.createElement(
      "h3"
    );


  name.className =
    "guest-card__name";


  name.textContent =
    guest.name
    ||
    "Invitado";


  /*
    Botones de asistencia.
  */

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "guest-card__actions";


  const attendButton =
    createAttendanceButton({
      label: "Asiste",

      value: "attending",

      selected:
        guest.status
        === "attending"
    });


  const declineButton =
    createAttendanceButton({
      label: "No asiste",

      value: "not_attending",

      selected:
        guest.status
        === "not_attending"
    });


  actions.append(
    attendButton,
    declineButton
  );


  /*
    Restricciones alimentarias.
  */

  const dietarySection =
    createDietarySection(
      guest
    );


  /*
    Mostrar restricciones
    solo si asiste.
  */

  if (
    guest.status !== "attending"
  ) {

    dietarySection.hidden = true;

  }


  /*
    Cambiar selección.
  */

  attendButton.addEventListener(
    "click",
    () => {

      selectAttendance(
        card,
        "attending"
      );


      dietarySection.hidden =
        false;

    }
  );


  declineButton.addEventListener(
    "click",
    () => {

      selectAttendance(
        card,
        "not_attending"
      );


      dietarySection.hidden =
        true;

    }
  );


  card.append(
    name,
    actions,
    dietarySection
  );


  return card;

}


/* =========================================================
   CREAR BOTÓN DE ASISTENCIA
========================================================= */

function createAttendanceButton({
  label,
  value,
  selected
}) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "guest-card__option";


  button.dataset.status =
    value;


  button.textContent =
    label;


  button.classList.toggle(
    "is-selected",
    selected
  );


  button.setAttribute(
    "aria-pressed",
    String(selected)
  );


  return button;

}


/* =========================================================
   SELECCIONAR ASISTENCIA
========================================================= */

function selectAttendance(
  card,
  status
) {

  const buttons =
    card.querySelectorAll(
      ".guest-card__option"
    );


  buttons.forEach(
    button => {

      const selected =
        button.dataset.status
        === status;


      button.classList.toggle(
        "is-selected",
        selected
      );


      button.setAttribute(
        "aria-pressed",
        String(selected)
      );

    }
  );

}


/* =========================================================
   RESTRICCIONES ALIMENTARIAS
========================================================= */

function createDietarySection(
  guest
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "guest-card__dietary";


  if (
    EVENT_CONFIG
      ?.rsvp
      ?.allowDietaryRestrictions
    === false
  ) {

    wrapper.hidden = true;

    return wrapper;

  }


  const title =
    document.createElement(
      "p"
    );


  title.className =
    "guest-card__dietary-title";


  title.textContent =
    EVENT_CONFIG
      ?.rsvp
      ?.dietaryTitle
    ||
    "¿Tenés alguna restricción alimentaria?";


  const options =
    document.createElement(
      "div"
    );


  options.className =
    "guest-card__dietary-options";


  const restrictions =
    EVENT_CONFIG
      ?.rsvp
      ?.dietaryRestrictions
    ||
    [];


  restrictions.forEach(
    restriction => {

      const label =
        document.createElement(
          "label"
        );


      label.className =
        "dietary-option";


      const input =
        document.createElement(
          "input"
        );


      input.type =
        "radio";


      input.name =
        `dietary-${guest.id}`;


      input.value =
        restriction.id;


      input.checked =
        guest.dietaryRestriction
        === restriction.id;


      const text =
        document.createElement(
          "span"
        );


      text.textContent =
        restriction.label;


      label.append(
        input,
        text
      );


      options.appendChild(
        label
      );

    }
  );


  /*
    Campo para "Otra".
  */

  const detailGroup =
    document.createElement(
      "div"
    );


  detailGroup.className =
    "form__group guest-card__dietary-detail";


  const detailLabel =
    document.createElement(
      "label"
    );


  detailLabel.className =
    "form__label";


  detailLabel.textContent =
    EVENT_CONFIG
      ?.rsvp
      ?.dietaryDetailLabel
    ||
    "Contanos cuál";


  const detailInput =
    document.createElement(
      "input"
    );


  detailInput.type =
    "text";


  detailInput.className =
    "form__input";


  detailInput.value =
    guest.dietaryDetail
    ||
    "";


  detailInput.placeholder =
    EVENT_CONFIG
      ?.rsvp
      ?.dietaryDetailPlaceholder
    ||
    "Especificá la restricción";


  detailGroup.append(
    detailLabel,
    detailInput
  );


  /*
    Mostrar detalle solo
    cuando selecciona "other".
  */

  const updateDetailVisibility =
    () => {

      const selected =
        options.querySelector(
          'input[type="radio"]:checked'
        );


      detailGroup.hidden =
        selected?.value
        !== "other";

    };


  options.addEventListener(
    "change",
    updateDetailVisibility
  );


  updateDetailVisibility();


  wrapper.append(
    title,
    options,
    detailGroup
  );


  return wrapper;

}


/* =========================================================
   GUARDAR RSVP
========================================================= */

async function handleRsvpSubmit() {

  const submitButton =
    document.getElementById(
      "submit-rsvp"
    );


  const data =
    collectRsvpData();


  /*
    Validar.
  */

  const validation =
    validateRsvpData(
      data
    );


  if (!validation.valid) {

    showRsvpStatus(
      validation.message,
      "error"
    );

    return;

  }


  /*
    Estado de carga.
  */

  if (submitButton) {

    submitButton.disabled =
      true;


    submitButton.dataset.originalText =
      submitButton.textContent;


    submitButton.textContent =
      "Guardando...";

  }


  showRsvpStatus(
    "",
    "info"
  );


  try {

    const result =
      await sendRsvpData(
        data
      );


    if (!result.success) {

      throw new Error(
        result.message ||
        "No se pudo guardar la confirmación."
      );

    }


    showRsvpStatus(
      result.message
      ||
      EVENT_CONFIG
        ?.rsvp
        ?.successMessage
      ||
      "¡Gracias! Tu respuesta fue guardada.",
      "success"
    );


    /*
      Evento personalizado.
  */

    document.dispatchEvent(
      new CustomEvent(
        "rsvp:submitted",
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
      "Error al guardar RSVP:",
      error
    );


    showRsvpStatus(
      EVENT_CONFIG
        ?.rsvp
        ?.errorMessage
      ||
      "Ocurrió un error. Intentá nuevamente.",
      "error"
    );

  }
  finally {

    if (submitButton) {

      submitButton.disabled =
        false;


      submitButton.textContent =
        submitButton.dataset.originalText
        ||
        "Guardar confirmación";

    }

  }

}


/* =========================================================
   RECOLECTAR DATOS
========================================================= */

function collectRsvpData() {

  const guestCards =
    document.querySelectorAll(
      ".guest-card"
    );


  const guests =
    Array.from(
      guestCards
    ).map(
      card => {

        const selectedStatus =
          card.querySelector(
            ".guest-card__option.is-selected"
          );


        const dietary =
          card.querySelector(
            '.guest-card__dietary input[type="radio"]:checked'
          );


        const dietaryDetail =
          card.querySelector(
            ".guest-card__dietary-detail input"
          );


        return {

          id:
            card.dataset.guestId
            ||
            "",

          row:
            card.dataset.row
            ||
            "",

          status:
            selectedStatus
              ?.dataset
              ?.status
            ||
            "",

          dietaryRestriction:
            dietary
              ?.value
            ||
            "none",

          dietaryDetail:
            dietaryDetail
              ?.value
              ?.trim()
            ||
            ""

        };

      }
    );


  const comment =
    document
      .getElementById(
        "rsvp-comment"
      )
      ?.value
      ?.trim()
    ||
    "";


  return {

    action:
      "confirm",

    eventId:
      EVENT_CONFIG
        ?.event
        ?.id
      ||
      "",

    group:
      currentRsvpGroup,

    guests,

    comment,

    date:
      new Date()
        .toISOString()

  };

}


/* =========================================================
   VALIDAR RSVP
========================================================= */

function validateRsvpData(
  data
) {

  if (!data.guests.length) {

    return {
      valid: false,

      message:
        "No hay invitados para confirmar."
    };

  }


  const missingStatus =
    data.guests.some(
      guest =>
        !guest.status
    );


  if (missingStatus) {

    return {
      valid: false,

      message:
        "Seleccioná si asiste o no asiste cada invitado."
    };

  }


  /*
    Validar detalle
    cuando selecciona "Otra".
  */

  const missingDietaryDetail =
    data.guests.some(
      guest =>

        guest.status
          === "attending"

        &&

        guest.dietaryRestriction
          === "other"

        &&

        !guest.dietaryDetail
    );


  if (
    missingDietaryDetail
  ) {

    return {
      valid: false,

      message:
        "Indicá cuál es la restricción alimentaria."
    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   ENVIAR RSVP
========================================================= */

async function sendRsvpData(
  data
) {

  const endpoint =
    getRsvpEndpoint();


  /*
    Modo demo.
  */

  if (!endpoint) {

    console.info(
      "RSVP en modo demo.",
      data
    );


    await simulateRsvpRequest();


    return {
      success: true,

      message:
        "¡Gracias! Tu respuesta fue guardada."
    };

  }


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

    return {
      success: true,

      message:
        responseText
    };

  }

}


/* =========================================================
   ENDPOINT RSVP
========================================================= */

function getRsvpEndpoint() {

  return (
    EVENT_CONFIG
      ?.integrations
      ?.rsvp
      ?.endpoint

    ||

    EVENT_CONFIG
      ?.integrations
      ?.googleSheets
      ?.scriptUrl

    ||

    ""
  );

}


/* =========================================================
   MENSAJE SIN INVITADOS
========================================================= */

function showEmptyGuestMessage() {

  const guestList =
    document.getElementById(
      "guest-list"
    );


  if (!guestList) {
    return;
  }


  guestList.innerHTML = `
    <p class="guest-list__empty">
      No encontramos invitados asociados a este enlace.
    </p>
  `;


  showRsvpStatus(
    "",
    "info"
  );

}


/* =========================================================
   ESTADO RSVP
========================================================= */

function showRsvpStatus(
  message,
  type = "info"
) {

  const status =
    document.getElementById(
      "rsvp-status"
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


/* =========================================================
   SIMULACIÓN
========================================================= */

function simulateRsvpRequest() {

  return new Promise(
    resolve => {

      window.setTimeout(
        resolve,
        700
      );

    }
  );

}