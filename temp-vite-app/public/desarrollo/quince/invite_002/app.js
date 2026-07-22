(() => {
  "use strict";
  const config = window.INVITATION_CONFIG;
  const dictionaries = window.INVITATION_I18N;
  if (!config || !dictionaries) return;

  const params = new URLSearchParams(location.search);
  let language = config.locale.enabled.includes(params.get("lang")) ? params.get("lang") : config.locale.default;
  let paletteKey = config.theme.palettes[params.get("palette")] ? params.get("palette") : config.theme.defaultPalette;
  let activeModal = null;
  let previousFocus = null;
  let lightboxIndex = 0;
  let galleryIndex = 0;
  const t = (key) => dictionaries[language]?.[key] || dictionaries.es[key] || key;
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const locale = () => language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-UY";
  const eventStart = new Date(config.event.startsAt);
  const eventEnd = new Date(config.event.endsAt);
  const rsvpDeadline = new Date(config.event.rsvpDeadline);

  function applyPalette(key, updateUrl = false) {
    const palette = config.theme.palettes[key] || config.theme.palettes[config.theme.defaultPalette];
    paletteKey = key;
    const root = document.documentElement.style;
    Object.entries(palette).forEach(([token, value]) => {
      if (typeof value === "string") root.setProperty(`--${token.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value);
    });
    qa("[data-palette]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.palette === key)));
    q('meta[name="theme-color"]')?.setAttribute("content", palette.accent);
    if (updateUrl) {
      const next = new URL(location.href);
      next.searchParams.set("palette", key);
      history.replaceState({}, "", next);
    }
  }

  function translate() {
    document.documentElement.lang = language;
    qa("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); });
    const deadlineText = new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long" }).format(rsvpDeadline);
    q("[data-rsvp-intro]").textContent = t("rsvpBefore").replace("{date}", deadlineText);
    qa("[data-close-modal]").forEach(node => node.setAttribute("aria-label", t("close")));
    q("[data-lightbox-close]")?.setAttribute("aria-label", t("close"));
    q("[data-lightbox-prev]")?.setAttribute("aria-label", t("previous"));
    q("[data-lightbox-next]")?.setAttribute("aria-label", t("next"));
    q("[data-gallery-prev]")?.setAttribute("aria-label", t("previous"));
    q("[data-gallery-next]")?.setAttribute("aria-label", t("next"));
  }

  function formatDate(options) {
    return new Intl.DateTimeFormat(locale(), options).format(eventStart);
  }

  function bindEventData() {
    const capitalize = value => value ? value.charAt(0).toLocaleUpperCase(locale()) + value.slice(1) : value;
    const data = {
      honoree: config.event.honoree,
      intro: typeof config.event.intro === "object" ? (config.event.intro[language] || config.event.intro.es) : config.event.intro,
      shortDate: formatDate({ day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", " | "),
      longDateTime: `${capitalize(formatDate({ weekday: "long", day: "numeric", month: "long" }))} · ${formatDate({ hour: "2-digit", minute: "2-digit", hour12: false })}h`,
      venue: config.event.venue,
      address: config.event.address,
      dressCode: config.event.dressCode,
      instagram: config.event.instagram
    };
    qa("[data-event]").forEach(node => { node.textContent = data[node.dataset.event] || ""; });
    qa("[data-bank]").forEach(node => { node.textContent = config.event.bank[node.dataset.bank] || ""; });
    q("[data-maps]")?.setAttribute("href", config.event.mapsUrl);
    q("[data-waze]")?.setAttribute("href", config.event.wazeUrl);
    const instagram = q("[data-instagram]");
    instagram.textContent = config.event.instagram;
    instagram.href = config.event.instagramUrl;
  }

  function bindMedia() {
    const cover = q("[data-cover-image]");
    cover.src = config.media.cover.src;
    cover.alt = config.media.cover.alt;
    cover.style.objectPosition = config.media.cover.position;
    q(".cover-photo-frame").hidden = !config.media.cover.enabled;
    qa("[data-ornament]").forEach(image => {
      const source = config.media.ornaments[image.dataset.ornament];
      image.src = source || "";
      image.hidden = !config.media.ornaments.enabled || !source;
    });
    const icon = q("[data-calendar-icon]");
    icon.src = config.media.calendarIcon;
  }

  function applySections() {
    qa("[data-section]").forEach(node => {
      const key = node.dataset.section;
      if (key in config.sections) node.hidden = !config.sections[key];
    });
  }

  function updateCountdown() {
    const remaining = eventStart.getTime() - Date.now();
    if (remaining <= 0) {
      q("[data-countdown]").hidden = true;
      q("[data-event-passed]").hidden = false;
      return;
    }
    const units = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      minutes: Math.floor((remaining / 60000) % 60),
      seconds: Math.floor((remaining / 1000) % 60)
    };
    Object.entries(units).forEach(([key, value]) => { q(`[data-unit="${key}"]`).textContent = String(value).padStart(2, "0"); });
  }

  function escapeIcs(value) {
    return String(value).replace(/[\\;,]/g, match => `\\${match}`).replace(/\n/g, "\\n");
  }
  function utcStamp(date) { return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function downloadCalendar() {
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Save Your Date//Jardin Floral//ES", "BEGIN:VEVENT", `UID:${config.event.id}@saveyourdate`, `DTSTAMP:${utcStamp(new Date())}`, `DTSTART:${utcStamp(eventStart)}`, `DTEND:${utcStamp(eventEnd)}`, `SUMMARY:${escapeIcs(`${t("party")} · ${config.event.honoree}`)}`, `LOCATION:${escapeIcs(`${config.event.venue}, ${config.event.address}`)}`, `DESCRIPTION:${escapeIcs(typeof config.event.intro === "object" ? config.event.intro[language] : config.event.intro)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${config.event.id}.ics` });
    link.click(); URL.revokeObjectURL(url);
  }

  function renderGallery() {
    const host = q("[data-gallery]");
    const dots = q("[data-gallery-dots]");
    config.media.gallery.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "gallery-item"; button.setAttribute("aria-label", `${t("galleryOpen")} ${index + 1}`);
      const image = new Image(); image.src = photo.src; image.alt = photo.alt; image.loading = index === 0 ? "eager" : "lazy"; image.decoding = "async"; image.style.objectPosition = photo.position || "center";
      button.append(image); button.addEventListener("click", () => openLightbox(index)); host.append(button);
    });
    const positions = Math.max(1, config.media.gallery.length - 2);
    Array.from({ length: positions }, (_, index) => {
      const dot = document.createElement("button"); dot.type = "button"; dot.setAttribute("aria-label", `${t("galleryOpen")} ${index + 1}`); dot.addEventListener("click", () => scrollGalleryTo(index)); dots.append(dot);
    });
    updateGalleryState(0);
  }

  function updateGalleryState(index) {
    const total = Math.max(1, config.media.gallery.length - 2);
    galleryIndex = Math.max(0, Math.min(index, total - 1));
    qa("[data-gallery-dots] button").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === galleryIndex));
    q("[data-gallery-prev]").disabled = galleryIndex === 0;
    q("[data-gallery-next]").disabled = galleryIndex === total - 1;
  }

  function scrollGalleryTo(index) {
    const viewport = q("[data-gallery-viewport]");
    const slides = qa(".gallery-item", viewport);
    const target = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!target) return;
    viewport.scrollTo({ left: target.offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    updateGalleryState(slides.indexOf(target));
  }

  function bindGallery() {
    const viewport = q("[data-gallery-viewport]");
    q("[data-gallery-prev]").addEventListener("click", () => scrollGalleryTo(galleryIndex - 1));
    q("[data-gallery-next]").addEventListener("click", () => scrollGalleryTo(galleryIndex + 1));
    viewport.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); scrollGalleryTo(galleryIndex - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); scrollGalleryTo(galleryIndex + 1); }
    });
    let scheduled = false;
    viewport.addEventListener("scroll", () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        const slides = qa(".gallery-item", viewport);
        const closest = slides.reduce((best, slide, index) => Math.abs(slide.offsetLeft - viewport.scrollLeft) < best.distance ? { index, distance: Math.abs(slide.offsetLeft - viewport.scrollLeft) } : best, { index: 0, distance: Infinity });
        updateGalleryState(closest.index); scheduled = false;
      });
    }, { passive: true });
  }

  function openLightbox(index) {
    lightboxIndex = (index + config.media.gallery.length) % config.media.gallery.length;
    const photo = config.media.gallery[lightboxIndex];
    const lightbox = q("[data-lightbox]"); const image = q("[data-lightbox-image]");
    image.src = photo.src; image.alt = photo.alt; lightbox.hidden = false; previousFocus = document.activeElement; document.body.classList.add("modal-open"); q("[data-lightbox-close]").focus();
  }
  function closeLightbox() { q("[data-lightbox]").hidden = true; document.body.classList.remove("modal-open"); previousFocus?.focus(); }

  function getFocusable(root) { return qa('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', root).filter(node => !node.hidden); }
  function openModal(name) {
    const modal = q(`[data-modal="${name}"]`); if (!modal) return;
    activeModal = modal; previousFocus = document.activeElement; modal.hidden = false; document.body.classList.add("modal-open"); getFocusable(modal)[0]?.focus();
  }
  function closeModal() { if (!activeModal) return; activeModal.hidden = true; activeModal = null; document.body.classList.remove("modal-open"); previousFocus?.focus(); }
  function trapModalFocus(event) {
    if (event.key === "Escape") { if (!q("[data-lightbox]").hidden) closeLightbox(); else closeModal(); return; }
    const root = !q("[data-lightbox]").hidden ? q("[data-lightbox]") : activeModal;
    if (event.key !== "Tab" || !root) return;
    const items = getFocusable(root); if (!items.length) return;
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async function copyBank() {
    const bank = config.event.bank;
    const text = `${t("bank")}: ${bank.bankName}\n${t("account")}: ${bank.account}\n${t("alias")}: ${bank.alias}`;
    try { await navigator.clipboard.writeText(text); q("[data-copy-status]").textContent = t("copied"); }
    catch { q("[data-copy-status]").textContent = text; }
  }

  async function submitService(type, payload) {
    const endpoint = type === "playlist" ? config.integrations.playlistEndpoint : config.integrations.rsvpEndpoint;
    if (!endpoint) { await new Promise(resolve => setTimeout(resolve, 450)); return { demo: true }; }
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formId: config.integrations.formId, eventId: config.event.id, language, ...payload }) });
    if (!response.ok) throw new Error("request_failed");
    return response.json().catch(() => ({}));
  }

  function bindForm(form) {
    form.addEventListener("submit", async event => {
      event.preventDefault(); const status = q(".form-status", form); const submit = q('[type="submit"]', form);
      if (!form.checkValidity()) { form.reportValidity(); status.textContent = t("required"); return; }
      status.textContent = t("sending"); submit.disabled = true;
      try { await submitService(form.dataset.form, Object.fromEntries(new FormData(form))); status.textContent = t(form.dataset.form === "playlist" ? "playlistSuccess" : "rsvpSuccess"); form.reset(); }
      catch { status.textContent = t("submitError"); }
      finally { submit.disabled = false; }
    });
  }

  function bindInteractions() {
    q("[data-calendar]").addEventListener("click", downloadCalendar);
    qa("[data-open-modal]").forEach(button => button.addEventListener("click", () => openModal(button.dataset.openModal)));
    qa("[data-close-modal]").forEach(button => button.addEventListener("click", closeModal));
    qa(".modal").forEach(modal => modal.addEventListener("mousedown", event => { if (event.target === modal) closeModal(); }));
    q("[data-copy-bank]").addEventListener("click", copyBank);
    qa("[data-form]").forEach(bindForm);
    q('[name="attendance"][value="yes"]').addEventListener("change", () => { q("[data-guest-count]").hidden = false; });
    q('[name="attendance"][value="no"]').addEventListener("change", () => { q("[data-guest-count]").hidden = true; });
    q('[name="dietary"]').addEventListener("change", event => { q("[data-dietary-detail]").hidden = event.target.value !== "other"; });
    q("[data-lightbox-close]").addEventListener("click", closeLightbox);
    q("[data-lightbox-prev]").addEventListener("click", () => openLightbox(lightboxIndex - 1));
    q("[data-lightbox-next]").addEventListener("click", () => openLightbox(lightboxIndex + 1));
    document.addEventListener("keydown", trapModalFocus);
  }

  function observeReveals() {
    qa("main h1,main h2,main h3,main p,main .btn,footer strong,footer span,footer small").forEach(node => node.classList.add("reveal-text"));
    const revealItems = qa(".reveal,.reveal-text");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { revealItems.forEach(node => node.classList.add("is-visible")); return; }
    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .12 });
    revealItems.forEach(node => observer.observe(node));
  }

  applyPalette(paletteKey); translate(); bindEventData(); bindMedia(); applySections(); renderGallery(); bindGallery(); bindInteractions(); observeReveals(); updateCountdown(); setInterval(updateCountdown, 1000);
})();
