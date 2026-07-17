/* =========================================================
   ESTADO DEL RSVP
========================================================= */

let rsvpGuests = [];


/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const openButton =
      document.getElementById(
        "open-rsvp-modal"
      );

    const submitButton =
      document.getElementById(
        "submit-rsvp"
      );

    openButton?.addEventListener(
      "click",
      loadRsvpGuests
    );

    submitButton?.addEventListener(
      "click",
      submitRsvp
    );

    document.addEventListener(
      "click",
      handleAttendanceSelection
    );

    document.addEventListener(
      "change",
      handleDietarySelection
    );
  }
);


/* =========================================================
   CARGAR INVITADOS
========================================================= */

async function loadRsvpGuests() {
  const list =
    document.getElementById(
      "guest-list"
    );

  const status =
    document.getElementById(
      "rsvp-status"
    );

  if (!list) {
    return;
  }

  const integration =
    EVENT_CONFIG.integrations
      ?.googleSheets;

  const groupId =
    getRsvpGroupId();

  if (
    !integration?.enabled ||
    !integration.scriptUrl
  ) {
    renderRsvpLoadError(
      "La confirmación todavía no está configurada."
    );

    return;
  }

  list.innerHTML = `
    <p class="guest-list__empty">
      Cargando invitados...
    </p>
  `;

  clearFormStatus(status);

  try {
    const response =
      await jsonpRequest(
        integration.scriptUrl,
        {
          grupo: groupId
        }
      );

    rsvpGuests =
      normalizeRsvpGuests(
        response
      );

    if (rsvpGuests.length === 0) {
      renderRsvpLoadError(
        EVENT_CONFIG.rsvp
          ?.loadErrorMessage ||
        "No encontramos invitados para este grupo."
      );

      return;
    }

    renderRsvpGuests(
      rsvpGuests
    );
  }
  catch (error) {
    console.error(
      "Error al cargar invitados:",
      error
    );

    renderRsvpLoadError(
      EVENT_CONFIG.rsvp
        ?.loadErrorMessage ||
      "No pudimos cargar los invitados."
    );
  }
}


/* =========================================================
   NORMALIZAR RESPUESTA
========================================================= */

function normalizeRsvpGuests(response) {
  let guests = [];

  if (Array.isArray(response)) {
    guests = response;
  }
  else if (
    Array.isArray(response?.invitados)
  ) {
    guests = response.invitados;
  }
  else if (
    Array.isArray(response?.guests)
  ) {
    guests = response.guests;
  }
  else if (
    Array.isArray(response?.data)
  ) {
    guests = response.data;
  }

  return guests.map(
    (guest, index) => ({
      row:
        guest.fila ??
        guest.row ??
        guest.id ??
        index + 1,

      name:
        guest.nombre_invitado ??
        guest.nombre ??
        guest.name ??
        `Invitado ${index + 1}`,

      lastName:
        guest.apellido ??
        guest.lastName ??
        "",

      status:
        normalizeAttendanceStatus(
          guest.estado ??
          guest.status ??
          ""
        ),

      dietary:
        guest.restriccion ??
        guest.dietary ??
        "none",

      dietaryDetail:
        guest.detalle_restriccion ??
        guest.dietaryDetail ??
        ""
    })
  );
}


/* =========================================================
   NORMALIZAR ESTADO
========================================================= */

function normalizeAttendanceStatus(
  status
) {
  const normalized =
    String(status)
      .trim()
      .toLowerCase();

  if (
    normalized === "asiste" ||
    normalized === "yes" ||
    normalized === "sí" ||
    normalized === "si"
  ) {
    return "Asiste";
  }

  if (
    normalized === "no asiste" ||
    normalized === "no"
  ) {
    return "No asiste";
  }

  return "";
}


/* =========================================================
   MOSTRAR INVITADOS
========================================================= */

function renderRsvpGuests(guests) {
  const list =
    document.getElementById(
      "guest-list"
    );

  if (!list) {
    return;
  }

  list.innerHTML = "";

  guests.forEach(
    (guest, index) => {
      const card =
        createGuestCard(
          guest,
          index
        );

      list.appendChild(card);
    }
  );
}


/* =========================================================
   CREAR TARJETA
========================================================= */

function createGuestCard(
  guest,
  index
) {
  const card =
    document.createElement("article");

  card.className =
    "guest-card";

  card.dataset.guestIndex =
    String(index);

  card.dataset.row =
    String(guest.row);

  card.dataset.status =
    guest.status || "";

  card.dataset.dietary =
    guest.dietary || "none";

  card.dataset.dietaryDetail =
    guest.dietaryDetail || "";

  const fullName =
    [
      guest.name,
      guest.lastName
    ]
      .filter(Boolean)
      .join(" ");

  const dietaryHtml =
    createDietaryOptionsHtml(
      guest,
      index
    );

  card.innerHTML = `
    <h3 class="guest-card__name">
      ${escapeHtml(fullName)}
    </h3>

    <div class="guest-card__actions">
      <button
        class="guest-card__option ${
          guest.status === "Asiste"
            ? "is-selected"
            : ""
        }"
        type="button"
        data-attendance="Asiste"
      >
        Asiste
      </button>

      <button
        class="guest-card__option ${
          guest.status === "No asiste"
            ? "is-selected"
            : ""
        }"
        type="button"
        data-attendance="No asiste"
      >
        No asiste
      </button>
    </div>

    ${dietaryHtml}
  `;

  updateGuestDietaryVisibility(
    card
  );

  return card;
}


/* =========================================================
   RESTRICCIONES ALIMENTARIAS
========================================================= */

function createDietaryOptionsHtml(
  guest,
  guestIndex
) {
  const config =
    EVENT_CONFIG.rsvp;

  if (
    config?.allowDietaryRestrictions ===
    false
  ) {
    return "";
  }

  const restrictions =
    config?.dietaryRestrictions || [];

  const optionsHtml =
    restrictions
      .map(
        (restriction) => {
          const checked =
            guest.dietary ===
            restriction.id;

          return `
            <label class="dietary-option">
              <input
                type="radio"
                name="dietary-${guestIndex}"
                value="${escapeHtml(
                  restriction.id
                )}"
                ${
                  checked
                    ? "checked"
                    : ""
                }
              >

              <span>
                ${escapeHtml(
                  restriction.label
                )}
              </span>
            </label>
          `;
        }
      )
      .join("");

  return `
    <div class="guest-card__dietary">
      <p class="guest-card__dietary-title">
        ${escapeHtml(
          config.dietaryTitle ||
          "¿Tenés alguna restricción alimentaria?"
        )}
      </p>

      <div class="guest-card__dietary-options">
        ${optionsHtml}
      </div>

      <div
        class="guest-card__dietary-detail"
        data-dietary-detail
        hidden
      >
        <label class="form__label">
          ${escapeHtml(
            config.dietaryDetailLabel ||
            "Contanos cuál"
          )}

          <input
            class="form__input"
            type="text"
            data-dietary-input
            value="${escapeHtml(
              guest.dietaryDetail
            )}"
            placeholder="${escapeHtml(
              config.dietaryDetailPlaceholder ||
              "Especificá la restricción"
            )}"
          >
        </label>
      </div>
    </div>
  `;
}


/* =========================================================
   SELECCIONAR ASISTENCIA
========================================================= */

function handleAttendanceSelection(
  event
) {
  const option =
    event.target.closest(
      "[data-attendance]"
    );

  if (!option) {
    return;
  }

  const card =
    option.closest(
      ".guest-card"
    );

  if (!card) {
    return;
  }

  const status =
    option.dataset.attendance;

  card.dataset.status =
    status;

  card
    .querySelectorAll(
      "[data-attendance]"
    )
    .forEach(
      (button) => {
        button.classList.toggle(
          "is-selected",
          button === option
        );
      }
    );

  updateGuestDietaryVisibility(
    card
  );
}


/* =========================================================
   SELECCIONAR RESTRICCIÓN
========================================================= */

function handleDietarySelection(
  event
) {
  const input =
    event.target.closest(
      '.guest-card input[type="radio"]'
    );

  if (!input) {
    return;
  }

  const card =
    input.closest(
      ".guest-card"
    );

  if (!card) {
    return;
  }

  card.dataset.dietary =
    input.value;

  updateGuestDietaryVisibility(
    card
  );
}


/* =========================================================
   VISIBILIDAD DE RESTRICCIONES
========================================================= */

function updateGuestDietaryVisibility(
  card
) {
  if (!card) {
    return;
  }

  const dietaryContainer =
    card.querySelector(
      ".guest-card__dietary"
    );

  const detailContainer =
    card.querySelector(
      "[data-dietary-detail]"
    );

  const attends =
    card.dataset.status ===
    "Asiste";

  if (dietaryContainer) {
    dietaryContainer.hidden =
      !attends;
  }

  if (detailContainer) {
    detailContainer.hidden =
      !attends ||
      card.dataset.dietary !==
        "other";
  }
}


/* =========================================================
   GUARDAR CONFIRMACIÓN
========================================================= */

async function submitRsvp() {
  const cards =
    [
      ...document.querySelectorAll(
        ".guest-card"
      )
    ];

  const status =
    document.getElementById(
      "rsvp-status"
    );

  const submitButton =
    document.getElementById(
      "submit-rsvp"
    );

  const comment =
    document
      .getElementById(
        "rsvp-comment"
      )
      ?.value
      .trim() || "";

  if (cards.length === 0) {
    setFormStatus(
      status,
      "No hay invitados para guardar.",
      "error"
    );

    return;
  }

  const missingStatus =
    cards.some(
      (card) =>
        !card.dataset.status
    );

  if (missingStatus) {
    setFormStatus(
      status,
      "Seleccioná si asiste o no asiste cada invitado.",
      "error"
    );

    return;
  }

  const confirmations =
    cards.map(
      (card) => {
        const attends =
          card.dataset.status ===
          "Asiste";

        const dietary =
          attends
            ? (
                card.dataset.dietary ||
                "none"
              )
            : "none";

        const dietaryInput =
          card.querySelector(
            "[data-dietary-input]"
          );

        const dietaryDetail =
          dietary === "other"
            ? (
                dietaryInput?.value
                  .trim() || ""
              )
            : "";

        return {
          fila:
            card.dataset.row,

          estado:
            card.dataset.status,

          restriccion:
            dietary,

          detalle_restriccion:
            dietaryDetail
        };
      }
    );

  const integration =
    EVENT_CONFIG.integrations
      ?.googleSheets;

  if (
    !integration?.enabled ||
    !integration.scriptUrl
  ) {
    setFormStatus(
      status,
      "La confirmación todavía no está configurada.",
      "error"
    );

    return;
  }

  setRsvpLoading(
    submitButton,
    true
  );

  setFormStatus(
    status,
    "Guardando confirmación...",
    "info"
  );

  try {
    const response =
      await jsonpRequest(
        integration.scriptUrl,
        {
          accion: "confirmar",
          grupo:
            getRsvpGroupId(),
          confirmaciones:
            JSON.stringify(
              confirmations
            ),
          comentario:
            comment,
          fecha:
            new Date()
              .toISOString()
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
      EVENT_CONFIG.rsvp
        ?.successMessage ||
      "¡Gracias! Tu respuesta fue guardada correctamente.",
      "success"
    );

    window.setTimeout(
      () => {
        const modal =
          document.getElementById(
            "rsvp-modal"
          );

        if (
          modal &&
          typeof closeModal ===
            "function"
        ) {
          closeModal(modal);
        }
      },
      2200
    );
  }
  catch (error) {
    console.error(
      "Error al guardar RSVP:",
      error
    );

    setFormStatus(
      status,
      EVENT_CONFIG.rsvp
        ?.errorMessage ||
      "Ocurrió un error. Intentá nuevamente.",
      "error"
    );
  }
  finally {
    setRsvpLoading(
      submitButton,
      false
    );
  }
}


/* =========================================================
   GRUPO ACTUAL
========================================================= */

function getRsvpGroupId() {
  const parameterName =
    EVENT_CONFIG.urlParams
      ?.guestGroup || "grupo";

  return (
    getUrlParameter(
      parameterName
    ) ||
    "ejemplo-01"
  );
}


/* =========================================================
   ERROR DE CARGA
========================================================= */

function renderRsvpLoadError(
  message
) {
  const list =
    document.getElementById(
      "guest-list"
    );

  if (!list) {
    return;
  }

  list.innerHTML = `
    <p class="guest-list__empty">
      ${escapeHtml(message)}
    </p>
  `;
}


/* =========================================================
   ESTADO DEL BOTÓN
========================================================= */

function setRsvpLoading(
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
      ? "Guardando..."
      : button.dataset.originalText;
}