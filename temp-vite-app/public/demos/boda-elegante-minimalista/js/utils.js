/* =========================================================
   UTILIDADES GENERALES
========================================================= */

function getById(id) {
  return document.getElementById(id);
}


function getUrlParameter(name) {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  return parameters.get(name);
}


function escapeHtml(value) {
  const element =
    document.createElement("div");

  element.textContent =
    String(value ?? "");

  return element.innerHTML;
}


function debounce(callback, delay = 250) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);

    timeoutId =
      window.setTimeout(
        () => callback(...args),
        delay
      );
  };
}


/* =========================================================
   ESTADOS DE FORMULARIO
========================================================= */

function setFormStatus(
  element,
  message = "",
  type = ""
) {
  if (!element) {
    return;
  }

  element.textContent = message;

  element.classList.remove(
    "is-success",
    "is-error",
    "is-info"
  );

  if (type) {
    element.classList.add(
      `is-${type}`
    );
  }
}


function clearFormStatus(element) {
  setFormStatus(
    element,
    "",
    ""
  );
}


/* =========================================================
   COPIAR TEXTO
========================================================= */

async function copyText(value) {
  const text =
    String(value ?? "");

  if (!text) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(
      text
    );

    return true;
  }
  catch (error) {
    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    textarea.setAttribute(
      "readonly",
      ""
    );

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    const copied =
      document.execCommand("copy");

    textarea.remove();

    return copied;
  }
}


document.addEventListener(
  "click",
  async (event) => {
    const button =
      event.target.closest(
        "[data-copy]"
      );

    if (!button) {
      return;
    }

    const value =
      button.dataset.copy;

    const originalText =
      button.textContent;

    const copied =
      await copyText(value);

    if (!copied) {
      button.textContent =
        "No se pudo copiar";

      window.setTimeout(
        () => {
          button.textContent =
            originalText;
        },
        1800
      );

      return;
    }

    button.classList.add(
      "is-copied"
    );

    button.textContent =
      "Copiado";

    window.setTimeout(
      () => {
        button.classList.remove(
          "is-copied"
        );

        button.textContent =
          originalText;
      },
      1800
    );
  }
);


/* =========================================================
   FECHAS
========================================================= */

function getEventDate() {
  const dateValue =
    EVENT_CONFIG?.event?.date;

  if (!dateValue) {
    return null;
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}


/* =========================================================
   PETICIONES JSONP
========================================================= */

function jsonpRequest(
  url,
  parameters = {}
) {
  return new Promise(
    (resolve, reject) => {
      if (!url) {
        reject(
          new Error(
            "No se configuró la URL."
          )
        );

        return;
      }

      const callbackName =
        `jsonp_${Date.now()}_${Math
          .random()
          .toString(16)
          .slice(2)}`;

      const script =
        document.createElement(
          "script"
        );

      const timeoutId =
        window.setTimeout(
          () => {
            cleanup();

            reject(
              new Error(
                "La solicitud demoró demasiado."
              )
            );
          },
          15000
        );

      function cleanup() {
        window.clearTimeout(
          timeoutId
        );

        script.remove();

        try {
          delete window[
            callbackName
          ];
        }
        catch (error) {
          window[
            callbackName
          ] = undefined;
        }
      }

      window[callbackName] =
        (response) => {
          cleanup();
          resolve(response);
        };

      const requestUrl =
        new URL(
          url,
          window.location.href
        );

      Object.entries(
        parameters
      ).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null
          ) {
            requestUrl.searchParams.set(
              key,
              String(value)
            );
          }
        }
      );

      requestUrl.searchParams.set(
        "callback",
        callbackName
      );

      script.src =
        requestUrl.toString();

      script.onerror =
        () => {
          cleanup();

          reject(
            new Error(
              "No se pudo completar la solicitud."
            )
          );
        };

      document.body.appendChild(
        script
      );
    }
  );
}