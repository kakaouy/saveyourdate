(function () {
  const config = window.INVITATION_CONFIG;
  const dictionaries = window.INVITATION_I18N;
  const params = new URLSearchParams(location.search);
  const requestedLang = params.get("lang");
  const lang = config.locale.enabled.includes(requestedLang) ? requestedLang : config.locale.default;
  const requestedPalette = params.get("palette");
  const paletteKey = config.theme.palettes[requestedPalette] ? requestedPalette : config.theme.defaultPalette;
  const dictionary = dictionaries[lang] || dictionaries.es;
  const formatDate = (iso, options) => new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : lang, options).format(new Date(iso));

  function applyPalette(key) {
    const palette = config.theme.palettes[key];
    if (!palette) return;
    const root = document.documentElement.style;
    root.setProperty("--cream", palette.background);
    root.setProperty("--blush", palette.surface);
    root.setProperty("--rose", palette.accent);
    root.setProperty("--rose-deep", palette.accentDeep);
    root.setProperty("--ink", palette.ink);
    document.querySelectorAll("[data-palette]").forEach(button => button.classList.toggle("selected", button.dataset.palette === key));
  }

  function translate() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(node => {
      const value = dictionary[node.dataset.i18n];
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
      const value = dictionary[node.dataset.i18nPlaceholder];
      if (value) node.placeholder = value;
    });
  }

  function bindData() {
    document.querySelectorAll("[data-celebrant-name]").forEach(node => node.textContent = config.celebrant.name);
    document.querySelectorAll("[data-event-date]").forEach(node => node.textContent = formatDate(config.event.startsAt, { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", " · "));
    document.querySelector("[data-event-long-date]").textContent = formatDate(config.event.startsAt, { weekday: "long", day: "numeric", month: "long" });
    document.querySelector("[data-event-time]").textContent = `${formatDate(config.event.startsAt, { hour: "2-digit", minute: "2-digit" })} h`;
    document.querySelector("[data-venue]").textContent = config.event.venue;
    document.querySelector("[data-address]").textContent = config.event.address;
    document.querySelector("[data-dress]").textContent = config.event.dressCode;
    document.querySelector("[data-instagram]").textContent = config.celebrant.instagram;
    document.querySelector("[data-instagram-link]").href = config.celebrant.instagramUrl;
    document.querySelector("[data-map-link]").href = config.event.mapsUrl;
    document.querySelector("[data-rsvp-deadline]").textContent = formatDate(config.event.rsvpDeadline, { day: "numeric", month: "long", year: "numeric" });
    document.title = `${config.celebrant.name} · ${dictionary.myFifteen}`;
  }

  function renderControls() {
    const palette = document.querySelector("[data-palette-controls]");
    Object.entries(config.theme.palettes).forEach(([key, value]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.palette = key;
      button.title = value.label[lang] || value.label.es;
      button.style.background = value.accent;
      button.addEventListener("click", () => applyPalette(key));
      palette.appendChild(button);
    });
    const locale = document.querySelector("[data-language-controls]");
    config.locale.enabled.forEach(code => {
      const link = document.createElement("a");
      const next = new URL(location.href);
      next.searchParams.set("lang", code);
      link.href = next.toString();
      link.textContent = code.toUpperCase();
      link.classList.toggle("selected", code === lang);
      locale.appendChild(link);
    });
  }

  function applyModules() {
    document.querySelectorAll("[data-module]").forEach(node => {
      const enabled = config.modules[node.dataset.module] !== false;
      node.hidden = !enabled;
    });
  }

  function renderGiftAccounts() {
    const container = document.querySelector("[data-gift-accounts]");
    container.innerHTML = "";
    config.gifts.accounts.forEach(account => {
      const block = document.createElement("div");
      block.className = "account";
      block.innerHTML = `<p><strong>${account.bank}</strong><br>${account.holder}<br>${account.account}<br>${account.currency}</p><button class="button copy-account" type="button" data-alias="${account.alias || account.account}">${dictionary.copyAlias}</button>`;
      container.appendChild(block);
    });
  }

  function countdown() {
    const target = new Date(config.event.startsAt).getTime();
    const pad = value => String(Math.max(0, value)).padStart(2, "0");
    const update = () => {
      const distance = Math.max(0, target - Date.now());
      const values = {
        days: Math.floor(distance / 86400000), hours: Math.floor(distance / 3600000) % 24,
        minutes: Math.floor(distance / 60000) % 60, seconds: Math.floor(distance / 1000) % 60
      };
      Object.entries(values).forEach(([key, value]) => document.querySelector(`[data-count="${key}"]`).textContent = pad(value));
    };
    update();
    window.setInterval(update, 1000);
  }

  function openModal(id) { document.getElementById(id)?.classList.add("open"); }
  function closeModal(modal) { modal.classList.remove("open"); }

  function bindInteractions() {
    document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => openModal(button.dataset.open)));
    document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest("[data-close]")) closeModal(modal);
    }));
    document.addEventListener("click", async event => {
      const button = event.target.closest(".copy-account");
      if (!button) return;
      await navigator.clipboard?.writeText(button.dataset.alias);
      button.textContent = dictionary.copied;
    });
    document.querySelectorAll("form").forEach(form => form.addEventListener("submit", event => {
      event.preventDefault();
      const message = form.querySelector("[data-form-message]");
      if (config.integrations.appsScriptUrl) submitJsonp(form, message);
      else message.textContent = dictionary.thankYou + " (demo)";
    }));
    const musicButton = document.querySelector(".music");
    if (musicButton) musicButton.addEventListener("click", () => {
      musicButton.classList.toggle("active");
      musicButton.textContent = musicButton.classList.contains("active") ? "♫" : "♪";
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle("visible", entry.isIntersecting)), { threshold: .15 });
    document.querySelectorAll(".reveal").forEach(node => observer.observe(node));
  }

  function submitJsonp(form, message) {
    const callback = `saveYourDate_${Date.now()}`;
    const payload = Object.fromEntries(new FormData(form));
    payload.grupo = params.get("grupo") || "";
    const script = document.createElement("script");
    window[callback] = () => { message.textContent = dictionary.thankYou; script.remove(); delete window[callback]; };
    script.src = `${config.integrations.appsScriptUrl}?accion=${encodeURIComponent(form.dataset.action)}&payload=${encodeURIComponent(JSON.stringify(payload))}&callback=${callback}`;
    document.body.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderControls(); applyPalette(paletteKey); translate(); bindData(); applyModules(); renderGiftAccounts(); countdown(); bindInteractions();
  });
})();
