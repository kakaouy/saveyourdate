document.addEventListener("DOMContentLoaded", () => {
  renderPageConfig();
  renderSections();
  renderWelcome();
  renderHero();
  renderCountdownTexts();
  renderEventInfo();
  renderLocation();
  renderDressCode();
  renderGalleryTexts();
  renderGifts();
  renderPlaylist();
  renderRsvp();
  renderClosing();
  renderFooter();
  renderMusic();
});


/* =========================================================
   UTILIDADES
========================================================= */

function setText(id, value) {
  const element = document.getElementById(id);

  if (!element || value === undefined || value === null) {
    return;
  }

  element.textContent = value;
}


function setImage(id, src) {
  const element = document.getElementById(id);

  if (!element || !src) {
    return;
  }

  element.src = src;
}


function setLink(id, href) {
  const element = document.getElementById(id);

  if (!element || !href) {
    return;
  }

  element.href = href;
}


/* =========================================================
   CONFIGURACIÓN DE LA PÁGINA
========================================================= */

function renderPageConfig() {
  document.title = EVENT_CONFIG.page.title;

  const description = document.querySelector(
    'meta[name="description"]'
  );

  if (description) {
    description.setAttribute(
      "content",
      EVENT_CONFIG.page.description
    );
  }

  const favicon = document.querySelector(
    'link[rel="icon"]'
  );

  if (favicon && EVENT_CONFIG.page.favicon) {
    favicon.href = EVENT_CONFIG.page.favicon;
  }
}


/* =========================================================
   MOSTRAR / OCULTAR SECCIONES
========================================================= */

function renderSections() {
  const sections = EVENT_CONFIG.sections;

  Object.entries(sections).forEach(([sectionName, enabled]) => {
    const element = document.querySelector(
      `[data-section="${sectionName}"]`
    );

    if (!element) {
      return;
    }

    element.hidden = !enabled;
  });

  const welcomeScreen = document.getElementById(
    "welcome-screen"
  );

  if (
    welcomeScreen &&
    EVENT_CONFIG.sections.welcome === false
  ) {
    welcomeScreen.hidden = true;
  }

  const hero = document.getElementById("hero");

  if (
    hero &&
    EVENT_CONFIG.sections.hero === false
  ) {
    hero.hidden = true;
  }

  const footer = document.getElementById("footer");

  if (
    footer &&
    EVENT_CONFIG.sections.footer === false
  ) {
    footer.hidden = true;
  }
}


/* =========================================================
   BIENVENIDA
========================================================= */

function renderWelcome() {
  const config = EVENT_CONFIG.welcome;

  setText(
    "welcome-pretitle",
    config.pretitle
  );

  setText(
    "welcome-title",
    config.title
  );

  setText(
    "welcome-message",
    config.message
  );

  setText(
    "enter-with-music",
    config.buttonWithMusic
  );

  setText(
    "enter-without-music",
    config.buttonWithoutMusic
  );
}


/* =========================================================
   PORTADA
========================================================= */

function renderHero() {
  const config = EVENT_CONFIG.hero;

  setText(
    "hero-pretitle",
    config.pretitle
  );

  setText(
    "hero-title",
    config.title
  );

  setText(
    "hero-subtitle",
    config.subtitle
  );

  setText(
    "hero-date",
    config.dateText
  );

  const background = document.getElementById(
    "hero-background"
  );

  if (background && config.backgroundImage) {
    background.style.backgroundImage =
      `url("${config.backgroundImage}")`;
  }
}


/* =========================================================
   CUENTA REGRESIVA
========================================================= */

function renderCountdownTexts() {
  const config = EVENT_CONFIG.countdown;

  setText(
    "countdown-eyebrow",
    config.eyebrow
  );

  setText(
    "countdown-title",
    config.title
  );
}


/* =========================================================
   INFORMACIÓN DEL EVENTO
========================================================= */

function renderEventInfo() {
  const config = EVENT_CONFIG.eventInfo;

  setText(
    "event-eyebrow",
    config.eyebrow
  );

  setText(
    "event-title",
    config.title
  );

  setText(
    "event-day",
    config.day
  );

  setText(
    "event-date",
    config.date
  );

  setText(
    "event-time",
    config.time
  );

  setText(
    "event-venue",
    config.venue
  );

  setText(
    "event-address",
    config.address
  );

  setText(
    "open-location",
    config.locationButtonText
  );

  setImage(
    "event-icon",
    config.icon
  );
}


/* =========================================================
   UBICACIÓN
========================================================= */

function renderLocation() {
  const config = EVENT_CONFIG.location;

  setText(
    "location-title",
    config.title
  );

  setText(
    "location-name",
    config.name
  );

  setText(
    "location-address",
    config.address
  );

  setText(
    "location-modal-address",
    config.address
  );

  setLink(
    "location-google-maps",
    config.googleMapsUrl
  );

  setLink(
    "location-waze",
    config.wazeUrl
  );

  setLink(
    "location-modal-maps",
    config.googleMapsUrl
  );

  setLink(
    "location-modal-waze",
    config.wazeUrl
  );
}


/* =========================================================
   DRESS CODE
========================================================= */

function renderDressCode() {
  const config = EVENT_CONFIG.dressCode;

  setText(
    "dresscode-eyebrow",
    config.eyebrow
  );

  setText(
    "dresscode-title",
    config.title
  );

  setText(
    "dresscode-description",
    config.description
  );

  setText(
    "dresscode-note",
    config.note
  );

  setImage(
    "dresscode-icon",
    config.icon
  );
}


/* =========================================================
   GALERÍA
========================================================= */

function renderGalleryTexts() {
  const config = EVENT_CONFIG.gallery;

  setText(
    "gallery-eyebrow",
    config.eyebrow
  );

  setText(
    "gallery-title",
    config.title
  );
}


/* =========================================================
   REGALOS
========================================================= */

function renderGifts() {
  const config = EVENT_CONFIG.gifts;

  setText(
    "gifts-eyebrow",
    config.eyebrow
  );

  setText(
    "gifts-title",
    config.title
  );

  setText(
    "gifts-message",
    config.message
  );

  setText(
    "open-gifts-modal",
    config.buttonText
  );

  setText(
    "gifts-modal-title",
    config.modal.title
  );

  setText(
    "gifts-modal-message",
    config.modal.message
  );

  setImage(
    "gifts-icon",
    config.icon
  );

  renderGiftAccounts();
}


function renderGiftAccounts() {

  const container =
    document.getElementById(
      "gifts-details"
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const linesToCopy = [];

  EVENT_CONFIG.gifts.accounts.forEach(
    account => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "gifts-details__item";

      item.innerHTML = `
        <span class="gifts-details__label">
          ${account.label}
        </span>

        <span class="gifts-details__value">
          ${account.value}
        </span>
      `;

      container.appendChild(item);

      if (account.copyable === true) {
        linesToCopy.push(
          `${account.label}: ${account.value}`
        );
      }

    }
  );

  if (linesToCopy.length > 0) {

    const copyButton =
      document.createElement(
        "button"
      );

    copyButton.type =
      "button";

    copyButton.className =
      "copy-button copy-button--all";

    copyButton.textContent =
      "Copiar datos";

    copyButton.addEventListener(
      "click",
      () => {

        copyGiftValue(
          linesToCopy.join("\n"),
          copyButton
        );

      }
    );

    container.appendChild(
      copyButton
    );
  }

}

/* =========================================================
   PLAYLIST
========================================================= */

function renderPlaylist() {
  const config = EVENT_CONFIG.playlist;

  setText(
    "playlist-eyebrow",
    config.eyebrow
  );

  setText(
    "playlist-title",
    config.title
  );

  setText(
    "playlist-message",
    config.message
  );

  setText(
    "open-playlist-modal",
    config.buttonText
  );

  setImage(
    "playlist-icon",
    config.icon
  );
}


/* =========================================================
   RSVP
========================================================= */

function renderRsvp() {
  const config = EVENT_CONFIG.rsvp;

  setText(
    "rsvp-eyebrow",
    config.eyebrow
  );

  setText(
    "rsvp-title",
    config.title
  );

  setText(
    "rsvp-message",
    config.message
  );

  setText(
    "open-rsvp-modal",
    config.buttonText
  );

  setText(
    "rsvp-modal-title",
    config.modalTitle
  );

  setText(
    "rsvp-modal-message",
    config.modalMessage
  );

  setText(
    "submit-rsvp",
    config.submitText
  );
}


/* =========================================================
   MENSAJE FINAL
========================================================= */

function renderClosing() {
  const config = EVENT_CONFIG.closing;

  setText(
    "closing-pretitle",
    config.pretitle
  );

  setText(
    "closing-title",
    config.title
  );

  setText(
    "closing-message",
    config.message
  );
}


/* =========================================================
   FOOTER
========================================================= */

function renderFooter() {
  const config = EVENT_CONFIG.footer;

  setText(
    "footer-event-name",
    config.eventName
  );

  const brand = document.querySelector(
    ".footer__brand"
  );

  if (!brand) {
    return;
  }

  if (!config.showBrand) {
    brand.hidden = true;
    return;
  }

  brand.innerHTML = `
    ${config.brandText}
    <a
      href="${config.brandUrl}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${config.brandName}
    </a>
  `;
}


/* =========================================================
   MÚSICA
========================================================= */

function renderMusic() {
  const config = EVENT_CONFIG.music;

  const musicButton = document.getElementById(
    "music-toggle"
  );

  const audioSource = document.getElementById(
    "background-music-source"
  );

  const audio = document.getElementById(
    "background-music"
  );

  if (!config.enabled) {
    if (musicButton) {
      musicButton.hidden = true;
    }

    return;
  }

  if (
    audioSource &&
    audio &&
    config.file
  ) {
    audioSource.src = config.file;

    audio.load();

    audio.volume = config.volume ?? 0.5;
  }
}