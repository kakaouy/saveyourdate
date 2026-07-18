document.addEventListener("DOMContentLoaded", () => {
  renderPageConfig();
  renderTheme();
  renderSections();
  renderWelcome();
  renderHero();

  renderPolaroids();
  renderQuote();
  renderSchedule();

  renderCountdownTexts();
  renderEventInfo();
  renderLocation();
  renderDressCode();
  renderGallery();
  renderFullPhoto();
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

function getElement(id) {
  return document.getElementById(id);
}


function setText(id, value) {
  const element = getElement(id);

  if (
    !element ||
    value === undefined ||
    value === null
  ) {
    return;
  }

  element.textContent = value;
}


function setImage(id, src, alt = "") {
  const element = getElement(id);

  if (!element || !src) {
    return;
  }

  element.src = src;
  element.alt = alt;
}


function setLink(id, href) {
  const element = getElement(id);

  if (!element || !href) {
    return;
  }

  element.href = href;
}


function setSectionContent(
  sectionId,
  selector,
  value
) {
  const section = getElement(sectionId);

  if (
    !section ||
    value === undefined ||
    value === null
  ) {
    return;
  }

  const element =
    section.querySelector(selector);

  if (element) {
    element.textContent = value;
  }
}


/* =========================================================
   CONFIGURACIÓN DE LA PÁGINA
========================================================= */

function renderPageConfig() {
  const config =
    EVENT_CONFIG.page;

  if (!config) {
    return;
  }

  if (config.title) {
    document.title =
      config.title;
  }

  const description =
    document.querySelector(
      'meta[name="description"]'
    );

  if (
    description &&
    config.description
  ) {
    description.setAttribute(
      "content",
      config.description
    );
  }

  const favicon =
    document.querySelector(
      'link[rel="icon"]'
    );

  if (
    favicon &&
    config.favicon
  ) {
    favicon.href =
      config.favicon;
  }
}


/* =========================================================
   MOSTRAR U OCULTAR SECCIONES
========================================================= */

function renderSections() {
  const config =
    EVENT_CONFIG.sections || {};

  const sections = {
    welcome: "welcome-screen",
    hero: "hero",

    polaroids: "polaroid-section",
    quote: "quote-section",
    schedule: "schedule-section",

    countdown: "countdown-section",
    event: "event-section",
    location: "location-section",
    dressCode: "dresscode-section",
    gallery: "gallery-section",

    fullPhoto: "full-photo-section",
    gifts: "gifts-section",
    playlist: "playlist-section",
    rsvp: "rsvp-section",

    closing: "closing-section",
    footer: "footer"
  };

  Object.entries(sections).forEach(
    ([configName, elementId]) => {
      const element =
        getElement(elementId);

      if (!element) {
        return;
      }

      element.hidden =
        config[configName] === false;
    }
  );
}


/* =========================================================
   PANTALLA DE BIENVENIDA
========================================================= */

function renderWelcome() {
  const config =
    EVENT_CONFIG.welcome;

  if (!config) {
    return;
  }

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
   PORTADA EDITORIAL
========================================================= */

function renderHero() {
  const config =
    EVENT_CONFIG.hero;

  if (!config) {
    return;
  }

  setText(
    "hero-pretitle",
    config.pretitle
  );

  setText(
    "hero-name-one",
    config.nameOne
  );

  setText(
    "hero-name-two",
    config.nameTwo
  );

  setText(
    "hero-location",
    config.location
  );

  setText(
    "hero-year",
    config.year
  );

  const background =
    getElement("hero-background");

  if (
    background &&
    config.backgroundImage
  ) {
    background.style.backgroundImage =
      `url("${config.backgroundImage}")`;
  }

  const decoration =
    document.querySelector(
      ".hero__top-decoration"
    );

  if (!decoration) {
    return;
  }

  const decorationConfig =
    config.decoration || {};

  if (
    decorationConfig.enabled === false ||
    !decorationConfig.image
  ) {
    decoration.hidden = true;

    return;
  }

  decoration.hidden = false;
  decoration.src =
    decorationConfig.image;
}


/* =========================================================
   POLAROIDS
========================================================= */

function renderPolaroids() {
  const config =
    EVENT_CONFIG.polaroids;

  const gallery =
    getElement("polaroid-gallery");

  if (
    !gallery ||
    !config ||
    !Array.isArray(config.images)
  ) {
    return;
  }

  gallery.innerHTML = "";

  config.images.forEach(
    (image, index) => {
      const figure =
        document.createElement("figure");

      figure.className =
        `polaroid polaroid--${index + 1}`;

      const img =
        document.createElement("img");

      img.src = image.src;
      img.alt = image.alt || "";
      img.loading = "lazy";

      figure.appendChild(img);
      gallery.appendChild(figure);
    }
  );
}


/* =========================================================
   FRASE
========================================================= */

function renderQuote() {
  const config =
    EVENT_CONFIG.quote;

  if (!config) {
    return;
  }

  setText(
    "quote-text",
    config.text
  );

  setText(
    "quote-author",
    config.author
  );
}


/* =========================================================
   CRONOGRAMA
========================================================= */

function renderSchedule() {
  const config =
    EVENT_CONFIG.schedule;

  const schedule =
    getElement("schedule");

  if (!config || !schedule) {
    return;
  }

  setText(
    "schedule-eyebrow",
    config.eyebrow
  );

  setText(
    "schedule-title",
    config.title
  );

  setText(
    "schedule-date",
    config.dateText
  );

  schedule.innerHTML = "";

  if (!Array.isArray(config.items)) {
    return;
  }

  config.items.forEach((item) => {
    const article =
      document.createElement("article");

    article.className =
      "schedule__item";

    article.innerHTML = `
      <time class="schedule__time">
        ${item.time || ""}
      </time>

      <div
        class="schedule__line"
        aria-hidden="true"
      >
        <span></span>
      </div>

      <div class="schedule__content">
        <h3>${item.title || ""}</h3>
        <p>${item.description || ""}</p>
      </div>
    `;

    schedule.appendChild(article);
  });
}


/* =========================================================
   CUENTA REGRESIVA
========================================================= */

function renderCountdownTexts() {
  const config =
    EVENT_CONFIG.countdown;

  if (!config) {
    return;
  }

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
  const config =
    EVENT_CONFIG.eventInfo;

  if (!config) {
    return;
  }

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
    config.icon,
    ""
  );
}


/* =========================================================
   UBICACIÓN
========================================================= */

function renderLocation() {
  const config =
    EVENT_CONFIG.location;

  if (!config) {
    return;
  }

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

  setLink(
    "location-google-maps",
    config.googleMapsUrl
  );

  setLink(
    "location-waze",
    config.wazeUrl
  );

  setText(
    "location-modal-title",
    config.name || config.title
  );

  setText(
    "location-modal-address",
    config.address
  );

  setLink(
    "location-modal-maps",
    config.googleMapsUrl
  );

  setLink(
    "location-modal-waze",
    config.wazeUrl
  );

  const icon =
    document.querySelector(
      ".location-card__icon img"
    );

  if (icon && config.icon) {
    icon.src = config.icon;
    icon.alt = "";
  }
}


/* =========================================================
   CÓDIGO DE VESTIMENTA
========================================================= */

function renderDressCode() {
  const config =
    EVENT_CONFIG.dressCode;

  if (!config) {
    return;
  }

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
    config.icon,
    ""
  );
}


/* =========================================================
   GALERÍA
========================================================= */

function renderGallery() {
  const config =
    EVENT_CONFIG.gallery;

  const gallery =
    getElement("gallery");

  const dots =
    getElement("gallery-dots");

  if (!config || !gallery) {
    return;
  }

  setText(
    "gallery-eyebrow",
    config.eyebrow
  );

  setText(
    "gallery-title",
    config.title
  );

  gallery.innerHTML = "";

  if (dots) {
    dots.innerHTML = "";
    dots.hidden =
      config.showDots === false;
  }

  if (!Array.isArray(config.images)) {
    return;
  }

  config.images.forEach(
    (image, index) => {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className =
        "gallery__item";

      button.dataset.galleryIndex =
        String(index);

      button.setAttribute(
        "aria-label",
        `Abrir imagen ${index + 1}`
      );

      const img =
        document.createElement("img");

      img.src = image.src;
      img.alt =
        image.alt || `Imagen ${index + 1}`;

      img.loading = "lazy";

      if (image.objectPosition) {
        img.style.objectPosition =
          image.objectPosition;
      }

      button.appendChild(img);
      gallery.appendChild(button);

      if (
        dots &&
        config.showDots !== false
      ) {
        const dot =
          document.createElement("button");

        dot.type = "button";
        dot.className =
          index === 0
            ? "gallery-dot is-active"
            : "gallery-dot";

        dot.dataset.galleryIndex =
          String(index);

        dot.setAttribute(
          "aria-label",
          `Ver imagen ${index + 1}`
        );

        dots.appendChild(dot);
      }
    }
  );
}


/* =========================================================
   REGALOS
========================================================= */

function renderGifts() {
  const config =
    EVENT_CONFIG.gifts;

  const section =
    getElement("gifts-section");

  if (!config || !section) {
    return;
  }

  setSectionContent(
    "gifts-section",
    ".section-heading__eyebrow",
    config.eyebrow
  );

  setSectionContent(
    "gifts-section",
    ".section-heading__title",
    config.title
  );

  setSectionContent(
    "gifts-section",
    ".editorial-content > p",
    config.message
  );

  setText(
    "open-gifts-modal",
    config.buttonText
  );

  setText(
    "gifts-modal-title",
    config.modal?.title
  );

  setText(
    "gifts-modal-message",
    config.modal?.message
  );

  const details =
    getElement("gifts-details");

  if (
    !details ||
    !Array.isArray(config.accounts)
  ) {
    return;
  }

  details.innerHTML = "";

  config.accounts.forEach(
    (account) => {
      const item =
        document.createElement("div");

      item.className =
        "gifts-details__item";

      const content =
        document.createElement("div");

      content.className =
        "gifts-details__content";

      const label =
        document.createElement("span");

      label.className =
        "gifts-details__label";

      label.textContent =
        account.label || "";

      const value =
        document.createElement("span");

      value.className =
        "gifts-details__value";

      value.textContent =
        account.value || "";

      content.append(label, value);
      item.appendChild(content);

      if (account.copyable) {
        const copyButton =
          document.createElement("button");

        copyButton.type = "button";
        copyButton.className =
          "copy-button";

        copyButton.textContent = "Copiar";
        copyButton.dataset.copy =
          account.value || "";

        item.appendChild(copyButton);
      }

      details.appendChild(item);
    }
  );
}


/* =========================================================
   PLAYLIST
========================================================= */

function renderPlaylist() {
  const config =
    EVENT_CONFIG.playlist;

  if (!config) {
    return;
  }

  setSectionContent(
    "playlist-section",
    ".section-heading__eyebrow",
    config.eyebrow
  );

  setSectionContent(
    "playlist-section",
    ".section-heading__title",
    config.title
  );

  setSectionContent(
    "playlist-section",
    ".editorial-content > p",
    config.message
  );

  setText(
    "open-playlist-modal",
    config.buttonText
  );

  setText(
    "playlist-modal-title",
    config.modal?.title
  );

  const nameGroup =
    getElement("playlist-name")
      ?.closest(".form__group");

  const linkGroup =
    getElement("playlist-link")
      ?.closest(".form__group");

  if (nameGroup) {
    nameGroup.hidden =
      config.form?.showName === false;
  }

  if (linkGroup) {
    linkGroup.hidden =
      config.form?.showLink === false;
  }
}


/* =========================================================
   CONFIRMACIÓN DE ASISTENCIA
========================================================= */

function renderRsvp() {
  const config =
    EVENT_CONFIG.rsvp;

  if (!config) {
    return;
  }

  setSectionContent(
    "rsvp-section",
    ".section-heading__eyebrow",
    config.eyebrow
  );

  setSectionContent(
    "rsvp-section",
    ".section-heading__title",
    config.title
  );

  setSectionContent(
    "rsvp-section",
    ".editorial-content > p",
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

  const comment =
    getElement("rsvp-comment");

  const commentGroup =
    comment?.closest(".form__group");

  if (commentGroup) {
    commentGroup.hidden =
      config.showComment === false;
  }
}


/* =========================================================
   CIERRE
========================================================= */

function renderClosing() {
  const config =
    EVENT_CONFIG.closing;

  if (!config) {
    return;
  }

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
  const config =
    EVENT_CONFIG.footer;

  if (!config) {
    return;
  }

  setText(
    "footer-event-name",
    config.eventName
  );

  const brand =
    document.querySelector(
      ".footer__brand"
    );

  if (!brand) {
    return;
  }

  if (config.showBrand === false) {
    brand.hidden = true;

    return;
  }

  brand.hidden = false;
  brand.innerHTML = "";

  const text =
    document.createTextNode(
      `${config.brandText || ""} `
    );

  const link =
    document.createElement("a");

  link.href =
    config.brandUrl || "#";

  link.target = "_blank";
  link.rel = "noopener noreferrer";

  link.textContent =
    config.brandName || "";

  brand.append(text, link);
}


/* =========================================================
   MÚSICA
========================================================= */

function renderMusic() {
  const config =
    EVENT_CONFIG.music;

  const musicButton =
    getElement("music-toggle");

  const musicIcon =
    getElement("music-toggle-icon");

  const audioSource =
    getElement("background-music-source");

  const audio =
    getElement("background-music");

  if (!config) {
    return;
  }

  if (musicButton) {
    musicButton.hidden =
      config.enabled === false;
  }

  if (config.enabled === false) {
    return;
  }

  if (
    musicIcon &&
    config.iconPlaying
  ) {
    musicIcon.src =
      config.iconPlaying;

    musicIcon.alt =
      "Controlar música";
  }

  if (
    audioSource &&
    audio &&
    config.file
  ) {
    audioSource.src =
      config.file;

    audio.loop =
      config.loop !== false;

    audio.volume =
      config.volume ?? 0.45;

    audio.load();
  }
}

/* =========================================================
   PALETA PARAMETRIZABLE
========================================================= */

function renderTheme() {
  const theme = EVENT_CONFIG.theme;
  if (!theme?.palettes) return;

  const requestedPalette =
    new URLSearchParams(window.location.search).get("palette");
  const paletteName =
    requestedPalette && theme.palettes[requestedPalette]
      ? requestedPalette
      : theme.defaultPalette;
  const palette = theme.palettes[paletteName];

  if (!palette) return;

  const root = document.documentElement;
  const variables = {
    primary: "--color-primary",
    background: "--color-background",
    secondary: "--color-secondary",
    accent: "--color-accent",
    text: "--color-text",
    textSoft: "--color-text-soft"
  };

  Object.entries(variables).forEach(([key, variable]) => {
    if (palette[key]) root.style.setProperty(variable, palette[key]);
  });

  root.dataset.palette = paletteName;
}

window.addEventListener("message", (event) => {
  const paletteName = event.data?.sydPalette;
  const palette = EVENT_CONFIG.theme?.palettes?.[paletteName];
  if (!palette) return;

  const root = document.documentElement;
  const variables = {
    primary: "--color-primary",
    background: "--color-background",
    secondary: "--color-secondary",
    accent: "--color-accent",
    text: "--color-text",
    textSoft: "--color-text-soft"
  };

  Object.entries(variables).forEach(([key, variable]) => {
    if (palette[key]) root.style.setProperty(variable, palette[key]);
  });

  root.dataset.palette = paletteName;
});

/* =========================================================
   FOTO IMPORTANTE PARAMETRIZABLE
========================================================= */

function renderFullPhoto() {
  const config = EVENT_CONFIG.fullPhoto;
  const section = getElement("full-photo-section");
  const image = getElement("full-photo-image");

  if (!config || !section || !image) return;

  if (config.image) {
    image.style.setProperty(
      "--full-photo-image",
      `url("${config.image}")`
    );
  }

  image.style.setProperty(
    "--full-photo-position",
    config.objectPosition || "center center"
  );

  const alternativeText = config.alt || "";
  section.setAttribute("aria-label", alternativeText);
  image.setAttribute("aria-label", alternativeText);
}
