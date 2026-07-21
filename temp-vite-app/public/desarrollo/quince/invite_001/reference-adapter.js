(function () {
  const config = window.INVITATION_CONFIG;
  const dictionaries = window.INVITATION_I18N;
  const params = new URLSearchParams(location.search);
  const lang = config.locale.enabled.includes(params.get("lang")) ? params.get("lang") : config.locale.default;
  const t = dictionaries[lang] || dictionaries.es;
  const locale = lang === "pt" ? "pt-BR" : lang;
  const date = new Date(config.event.startsAt);
  const deadline = new Date(config.event.rsvpDeadline);
  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const set = (selector, value) => { const node = q(selector); if (node && value != null) node.textContent = value; };

  function applyData() {
    document.documentElement.lang = lang;
    document.title = `${config.celebrant.name} · ${t.myFifteen}`;
    set(".modal-entrada-contenido .modal-pretitle", t.invitationOf);
    set(".modal-entrada-contenido h2", config.celebrant.name);
    set(".modal-entrada-contenido .modal-subtitle", t.musicExperience);
    const entryButtons = qa(".modal-entrada-contenido button");
    if (entryButtons[0]) entryButtons[0].textContent = t.enterMusic;
    if (entryButtons[1]) entryButtons[1].textContent = t.enterSilent;
    set(".hero .fecha", new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date).replaceAll("/", " • "));
    set(".hero .nombre", config.celebrant.name);
    set(".hero .mis", t.myFifteen);
    set(".hero .frase-portada", t.heroPhrase);
    set("#info h2", t.missing);
    ["days", "hours", "minutes", "seconds"].forEach((key, index) => { const label = qa("#info .time small")[index]; if (label) label.textContent = t[key].toUpperCase(); });
    set(".bloque-info-carrusel .light h2", t.photoJourney);

    const eventSection = q(".bloque-rama-derecha .rosa");
    if (eventSection) {
      const paragraphs = eventSection.querySelectorAll("p");
      if (paragraphs[0]) paragraphs[0].textContent = t.epicParty;
      const heading = eventSection.querySelector("h2");
      if (heading) heading.textContent = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(date);
      if (paragraphs[1]) paragraphs[1].textContent = `${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date)} h`;
      if (paragraphs[2]) paragraphs[2].innerHTML = `<strong>${config.event.venue}</strong><br>${config.event.address}`;
      const button = eventSection.querySelector(".btn"); if (button) button.textContent = t.howToGet;
    }
    const dress = q(".bloque-rama-derecha .light");
    if (dress) { setNode(dress.querySelector("h2"), t.dressCode); setNode(dress.querySelector("p"), `${t.dressHelp}: ${config.event.dressCode}. ${t.reservedWhite}`); }

    const standaloneRose = qa("body > section.rosa")[0];
    if (standaloneRose) {
      setNode(standaloneRose.querySelector("h2"), t.instagramTitle);
      const ps = standaloneRose.querySelectorAll("p");
      if (ps[0]) ps[0].textContent = t.instagramCopy;
      if (ps[1]) ps[1].innerHTML = `<strong>${config.celebrant.instagram}</strong>`;
      const link = standaloneRose.querySelector("a"); if (link) { link.href = config.celebrant.instagramUrl; link.textContent = t.goInstagram; }
    }
    const playlist = q(".playlist-section");
    if (playlist) { setNode(playlist.querySelector("h2"), `${config.celebrant.name} · 15`); const ps = playlist.querySelectorAll("p"); if (ps[0]) ps[0].textContent = t.playlistQuestion; const link = playlist.querySelector("a"); if (link) link.textContent = t.suggestSong; }
    const gift = q(".bloque-rama-izquierda .rosa");
    if (gift) { setNode(gift.querySelector("h2"), t.gifts); setNode(gift.querySelector("p"), t.giftsCopy); const link = gift.querySelector("a"); if (link) link.textContent = t.viewGift; }
    set("body > section.light h2", t.rsvp);
    set(".footer-nombre", config.celebrant.name);
    set(".footer-frase", t.thanksPart);
    set("#modalCancion h2", t.suggestSong);
    set("#modalAsistencia > div > h2", t.rsvp);
    set("#modalCuenta h2", t.gifts);
    const confirmText = q("#textoConfirmacion");
    if (confirmText && !config.integrations.appsScriptUrl) confirmText.textContent = `${t.rsvpBefore} ${new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(deadline)}.`;
    renderAccounts();
    renderGallery();
    applyAssets();
  }

  function setNode(node, value) { if (node && value != null) node.textContent = value; }

  function renderAccounts() {
    const content = q(".modal-cuenta-contenido");
    if (!content) return;
    qa(".modal-cuenta-contenido > p, .modal-cuenta-contenido > .btn").forEach(node => node.remove());
    config.gifts.accounts.forEach(account => {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${account.bank}</strong><br>${account.holder}<br>${account.account}<br>${account.currency}`;
      const button = document.createElement("button");
      button.className = "btn"; button.type = "button"; button.textContent = t.copyAlias;
      button.addEventListener("click", async () => { await navigator.clipboard?.writeText(account.alias || account.account); button.textContent = t.copied; });
      content.append(p, button);
    });
  }

  function renderGallery() {
    const carousel = q(".carousel");
    if (!carousel) return;
    carousel.innerHTML = "";
    if (!config.gallery.photos.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "photo-slot";
      placeholder.textContent = t.photoPending;
      carousel.appendChild(placeholder);
      return;
    }
    config.gallery.photos.forEach((src, index) => {
      const image = document.createElement("img"); image.src = src; image.alt = `${config.celebrant.name} ${index + 1}`; if (!index) image.className = "active"; carousel.appendChild(image);
    });
    if (typeof window.reiniciarCarrusel === "function") window.reiniciarCarrusel();
  }

  function applyAssets() {
    if (config.assets.cover) q(".hero").style.backgroundImage = `linear-gradient(rgba(60,35,20,.16),rgba(60,35,20,.22)),url('${config.assets.cover}')`;
    const audio = q("#musica source"); if (audio && config.music.audio) { audio.src = config.music.audio; q("#musica").load(); }
    qa("img").forEach(image => image.addEventListener("error", () => { image.style.visibility = "hidden"; }, { once: true }));
  }

  function applyPalette(key) {
    const palette = config.theme.palettes[key] || config.theme.palettes[config.theme.defaultPalette];
    const root = document.documentElement.style;
    root.setProperty("--fondo", palette.background); root.setProperty("--claro", "#fffdfb");
    root.setProperty("--nude", palette.surface); root.setProperty("--rosa", palette.accent); root.setProperty("--rosa-viejo", palette.surface);
    root.setProperty("--rosa-oscuro", palette.accentDeep); root.setProperty("--texto", palette.ink); root.setProperty("--oscuro", palette.ink);
    root.setProperty("--azul-claro", palette.surface); root.setProperty("--azul", palette.accent); root.setProperty("--azul-oscuro", palette.accentDeep);
    root.setProperty("--azul-footer", palette.accentDeep); root.setProperty("--azul-suave", palette.accent);
    q("#model-theme-overrides").textContent = `.rosa,#info{background:${palette.surface}!important}.light{background:${palette.background}!important}.btn{background:${palette.accentDeep}!important}.footer-invitacion{background:linear-gradient(135deg,${palette.accentDeep},${palette.accent})!important}`;
    qa("[data-palette]").forEach(button => button.classList.toggle("selected", button.dataset.palette === key));
  }

  function renderControls() {
    const style = document.createElement("style"); style.id = "model-theme-overrides"; document.head.appendChild(style);
    const controls = document.createElement("aside"); controls.className = "model-controls";
    controls.innerHTML = `<div class="model-palettes"></div><div class="model-languages"></div>`;
    Object.entries(config.theme.palettes).forEach(([key, palette]) => {
      const button = document.createElement("button"); button.type = "button"; button.dataset.palette = key; button.style.background = palette.accent; button.title = palette.label[lang] || palette.label.es; button.addEventListener("click", () => applyPalette(key)); controls.firstElementChild.appendChild(button);
    });
    config.locale.enabled.forEach(code => { const link = document.createElement("a"), url = new URL(location.href); url.searchParams.set("lang", code); link.href = url; link.textContent = code.toUpperCase(); if (code === lang) link.className = "selected"; controls.lastElementChild.appendChild(link); });
    document.body.appendChild(controls);
  }

  function applyModules() {
    const map = {
      countdown: "#info", gallery: ".bloque-info-carrusel .light", location: ".bloque-rama-derecha .rosa",
      dressCode: ".bloque-rama-derecha .light", instagram: "body > section.rosa", playlist: ".playlist-section",
      gifts: ".bloque-rama-izquierda .rosa", rsvp: "body > section.light:last-of-type"
    };
    Object.entries(map).forEach(([module, selector]) => { if (config.modules[module] === false) q(selector)?.remove(); });
  }

  renderControls();
  applyPalette(config.theme.palettes[params.get("palette")] ? params.get("palette") : config.theme.defaultPalette);
  applyData();
  applyModules();
})();
