/* =========================================================
   LOADER INICIAL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const loader =
    document.getElementById("page-loader");

  if (!loader) {
    return;
  }

  const config = EVENT_CONFIG?.loader;

  if (config?.enabled === false) {
    loader.remove();
    return;
  }

  const duration =
    config?.duration ?? 1800;

  window.setTimeout(() => {
    loader.classList.add("is-hidden");
  }, duration);

  window.setTimeout(() => {
    loader.remove();
  }, duration + 700);
});