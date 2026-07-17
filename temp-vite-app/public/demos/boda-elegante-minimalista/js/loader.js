/* =========================================================
   LOADER INICIAL
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const loader =
      document.getElementById(
        "page-loader"
      );

    const config =
      EVENT_CONFIG.loader || {};

    if (!loader) {
      return;
    }

    if (config.enabled === false) {
      hidePageLoader(loader);

      return;
    }

    const duration =
      Number(config.duration) || 0;

    const startedAt =
      Date.now();

    function finishLoader() {
      const elapsed =
        Date.now() - startedAt;

      const remaining =
        Math.max(
          duration - elapsed,
          0
        );

      window.setTimeout(
        () => {
          hidePageLoader(loader);
        },
        remaining
      );
    }

    if (
      document.readyState ===
      "complete"
    ) {
      finishLoader();
    }
    else {
      window.addEventListener(
        "load",
        finishLoader,
        {
          once: true
        }
      );
    }
  }
);


/* =========================================================
   OCULTAR LOADER
========================================================= */

function hidePageLoader(loader) {
  if (!loader) {
    return;
  }

  loader.classList.add(
    "is-hidden"
  );

  loader.setAttribute(
    "aria-hidden",
    "true"
  );

  window.setTimeout(
    () => {
      loader.hidden = true;
    },
    650
  );
}