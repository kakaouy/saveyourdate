/* =========================================================
   UTILS.JS
   Funciones reutilizables de la invitación
========================================================= */


/* =========================================================
   DOM
========================================================= */

/**
 * Obtener un elemento por ID.
 *
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getById(id) {
  return document.getElementById(id);
}


/**
 * Buscar un único elemento.
 *
 * @param {string} selector
 * @param {ParentNode} parent
 * @returns {Element|null}
 */
function query(selector, parent = document) {
  return parent.querySelector(selector);
}


/**
 * Buscar varios elementos y devolver un array.
 *
 * @param {string} selector
 * @param {ParentNode} parent
 * @returns {Element[]}
 */
function queryAll(selector, parent = document) {
  return Array.from(
    parent.querySelectorAll(selector)
  );
}


/* =========================================================
   TEXTO Y CONTENIDO
========================================================= */

/**
 * Colocar texto en un elemento.
 *
 * @param {string} id
 * @param {string|number|null|undefined} value
 */
function setTextContent(id, value) {
  const element = getById(id);

  if (
    !element ||
    value === undefined ||
    value === null
  ) {
    return;
  }

  element.textContent = String(value);
}


/**
 * Colocar HTML.
 * Usar solo con contenido controlado por nosotros.
 *
 * @param {string} id
 * @param {string} html
 */
function setHTML(id, html) {
  const element = getById(id);

  if (!element) {
    return;
  }

  element.innerHTML = html || "";
}


/* =========================================================
   IMÁGENES
========================================================= */

/**
 * Cambiar la imagen de un elemento <img>.
 *
 * @param {string} id
 * @param {string} src
 * @param {string} alt
 */
function setImageSource(
  id,
  src,
  alt = ""
) {
  const image = getById(id);

  if (
    !image ||
    !src
  ) {
    return;
  }

  image.src = src;

  if (alt !== undefined) {
    image.alt = alt;
  }
}


/* =========================================================
   LINKS
========================================================= */

/**
 * Cambiar URL de un enlace.
 *
 * @param {string} id
 * @param {string} href
 */
function setLinkHref(id, href) {
  const link = getById(id);

  if (!link) {
    return;
  }

  if (!href) {
    link.removeAttribute("href");
    link.setAttribute(
      "aria-disabled",
      "true"
    );

    return;
  }

  link.href = href;
  link.removeAttribute(
    "aria-disabled"
  );
}


/* =========================================================
   MOSTRAR / OCULTAR ELEMENTOS
========================================================= */

/**
 * Mostrar u ocultar un elemento.
 *
 * @param {HTMLElement|null} element
 * @param {boolean} visible
 */
function setElementVisibility(
  element,
  visible
) {
  if (!element) {
    return;
  }

  element.hidden = !visible;
}


/**
 * Mostrar u ocultar por ID.
 *
 * @param {string} id
 * @param {boolean} visible
 */
function setVisibilityById(
  id,
  visible
) {
  setElementVisibility(
    getById(id),
    visible
  );
}


/* =========================================================
   URL Y PARÁMETROS
========================================================= */

/**
 * Obtener un parámetro de la URL.
 *
 * @param {string} name
 * @param {string} fallback
 * @returns {string}
 */
function getUrlParam(
  name,
  fallback = ""
) {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get(name)
    ||
    fallback
  );
}


/**
 * Obtener el grupo de invitados.
 *
 * @returns {string}
 */
function getGuestGroupParam() {
  const paramName =
    EVENT_CONFIG
      ?.urlParams
      ?.guestGroup
    ||
    "grupo";

  return getUrlParam(
    paramName,
    ""
  );
}


/* =========================================================
   FECHAS
========================================================= */

/**
 * Convertir un valor a Date.
 *
 * @param {string|Date} value
 * @returns {Date|null}
 */
function parseDate(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}


/**
 * Fecha actual en ISO.
 *
 * @returns {string}
 */
function getCurrentIsoDate() {
  return new Date()
    .toISOString();
}


/* =========================================================
   FORMATEO
========================================================= */

/**
 * Agregar cero adelante.
 *
 * @param {number} value
 * @param {number} length
 * @returns {string}
 */
function padNumber(
  value,
  length = 2
) {
  return String(value)
    .padStart(
      length,
      "0"
    );
}


/**
 * Limpiar texto.
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanString(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}


/* =========================================================
   VALIDACIÓN
========================================================= */

/**
 * Validar URL HTTP o HTTPS.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidHttpUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

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


/**
 * Validar email.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  const email =
    cleanString(value);

  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}


/* =========================================================
   NÚMEROS
========================================================= */

/**
 * Limitar un número entre mínimo y máximo.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


/**
 * Convertir a número con fallback.
 *
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function toNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isNaN(number)
    ? fallback
    : number;
}


/* =========================================================
   ASÍNCRONO
========================================================= */

/**
 * Esperar una cantidad de milisegundos.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(milliseconds) {
  return new Promise(
    resolve => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}


/* =========================================================
   FETCH / RESPUESTAS
========================================================= */

/**
 * Intentar convertir texto en JSON.
 *
 * @param {string} text
 * @returns {object|null}
 */
function safeJsonParse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  }
  catch {
    return null;
  }
}


/**
 * Leer una respuesta fetch.
 * Si es JSON devuelve JSON.
 * Si no, devuelve texto.
 *
 * @param {Response} response
 * @returns {Promise<object>}
 */
async function readApiResponse(
  response
) {
  const text =
    await response.text();

  const json =
    safeJsonParse(text);

  if (json !== null) {
    return json;
  }

  return {
    success: response.ok,
    message: text
  };
}


/* =========================================================
   ESTADOS DE FORMULARIO
========================================================= */

/**
 * Mostrar mensaje de estado.
 *
 * @param {string} elementId
 * @param {string} message
 * @param {"success"|"error"|"info"} type
 */
function showFormStatus(
  elementId,
  message,
  type = "info"
) {
  const element =
    getById(elementId);

  if (!element) {
    return;
  }

  element.textContent =
    message || "";

  element.classList.remove(
    "is-success",
    "is-error",
    "is-info"
  );

  element.classList.add(
    `is-${type}`
  );
}


/* =========================================================
   BOTONES EN ESTADO DE CARGA
========================================================= */

/**
 * Activar o desactivar loading de un botón.
 *
 * @param {HTMLButtonElement|null} button
 * @param {boolean} loading
 * @param {string} loadingText
 */
function setButtonLoading(
  button,
  loading,
  loadingText = "Cargando..."
) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText =
      button.textContent;

    button.disabled = true;

    button.textContent =
      loadingText;

    return;
  }

  button.disabled = false;

  button.textContent =
    button.dataset.originalText
    ||
    button.textContent;
}


/* =========================================================
   EVENTOS PERSONALIZADOS
========================================================= */

/**
 * Disparar un evento personalizado.
 *
 * @param {string} eventName
 * @param {object} detail
 */
function dispatchAppEvent(
  eventName,
  detail = {}
) {
  document.dispatchEvent(
    new CustomEvent(
      eventName,
      {
        detail
      }
    )
  );
}



/* =========================================================
   COPIAR DATOS DE REGALO
========================================================= */

async function copyGiftValue(
  value,
  button
) {

  try {

    await navigator.clipboard.writeText(
      value
    );


    const originalText =
      button.textContent;


    button.textContent =
      "Copiado ✓";


    button.classList.add(
      "is-copied"
    );


    window.setTimeout(
      () => {

        button.textContent =
          originalText;


        button.classList.remove(
          "is-copied"
        );

      },
      1800
    );

  }
  catch (error) {

    console.error(
      "No se pudo copiar el dato:",
      error
    );


    fallbackCopyText(
      value
    );

  }

}

function fallbackCopyText(value) {

  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value = value;

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  document.body.appendChild(
    textarea
  );

  textarea.select();

  document.execCommand(
    "copy"
  );

  textarea.remove();

}