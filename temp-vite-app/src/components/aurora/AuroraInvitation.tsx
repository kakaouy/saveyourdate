import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  DEFAULT_AURORA_CONFIG,
  AURORA_COPY,
  AURORA_PALETTES
} from './config';
import type {
  AuroraConfig,
  AuroraLocale,
  AuroraPalette,
  AuroraTone
} from './config';
import './aurora.css';

type ModalName = 'dress' | 'hotels' | 'gifts' | 'songs' | 'qr' | 'rsvp' | 'lightbox';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';
type Props = {
  locale: AuroraLocale;
  palette: AuroraPalette;
  embedded?: boolean;
  onClose?: () => void;
  config?: Partial<AuroraConfig>;
};

const sectionClass = (tone: AuroraTone = 'light') => `au-section au-tone-${tone}`;

export function AuroraInvitation({
  locale,
  palette,
  embedded = false,
  onClose,
  config
}: Props) {
  const t = AURORA_COPY[locale];
  const data = useMemo(() => ({
    ...DEFAULT_AURORA_CONFIG,
    ...config,
    event: { ...DEFAULT_AURORA_CONFIG.event, ...config?.event },
    links: { ...DEFAULT_AURORA_CONFIG.links, ...config?.links },
    content: { ...DEFAULT_AURORA_CONFIG.content, ...config?.content },
    gifts: { ...DEFAULT_AURORA_CONFIG.gifts, ...config?.gifts },
    qrPass: { ...DEFAULT_AURORA_CONFIG.qrPass, ...config?.qrPass },
    assets: { ...DEFAULT_AURORA_CONFIG.assets, ...config?.assets },
    sections: { ...DEFAULT_AURORA_CONFIG.sections, ...config?.sections },
    tones: { ...DEFAULT_AURORA_CONFIG.tones, ...config?.tones },
    metadata: { ...DEFAULT_AURORA_CONFIG.metadata, ...config?.metadata }
  }), [config]);
  const colors = AURORA_PALETTES[palette];
  const rootRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLElement>(null);
  const parallaxImageRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalName | null>(null);
  const [lightbox, setLightbox] = useState(0);
  const [countdown, setCountdown] = useState([0, 0, 0, 0]);
  const [food, setFood] = useState('none');
  const [copyStatus, setCopyStatus] = useState('');
  const [qr, setQr] = useState('');
  const [rsvpState, setRsvpState] = useState<SubmitState>('idle');
  const [songState, setSongState] = useState<SubmitState>('idle');

  const cssVars = {
    '--color-fondo': colors.fondo,
    '--color-fondo-alterno': colors.alterno,
    '--color-titulos': colors.titulos,
    '--color-secundario': colors.secundario,
    '--color-acento': colors.acento,
    '--color-acento-oscuro': colors.acentoOscuro,
    '--color-texto': colors.texto,
    '--color-botones': colors.botones,
    '--color-bordes': colors.bordes,
    '--color-ornamentos': colors.ornamentos,
    '--color-texto-claro': colors.claro,
    '--color-foco': colors.foco,
    '--hero-image': `url("${data.assets.hero}")`,
    '--parallax-image': `url("${data.assets.parallax}")`,
    '--hero-position-mobile': data.assets.heroPositionMobile,
    '--hero-position-desktop': data.assets.heroPositionDesktop,
    '--hero-overlay': data.assets.heroOverlay
  } as React.CSSProperties;

  useEffect(() => {
    const ready = window.setTimeout(() => setLoaded(true), 450);
    const safety = window.setTimeout(() => setLoaded(true), 2800);
    return () => { window.clearTimeout(ready); window.clearTimeout(safety); };
  }, []);

  useEffect(() => {
    const update = () => {
      const delta = Math.max(0, new Date(data.event.dateTime).getTime() - Date.now());
      setCountdown([
        Math.floor(delta / 86400000),
        Math.floor(delta / 3600000) % 24,
        Math.floor(delta / 60000) % 60,
        Math.floor(delta / 1000) % 60
      ]);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [data.event.dateTime]);

  useEffect(() => {
    QRCode.toDataURL(data.qrPass.value, {
      width: 240,
      margin: 2,
      color: { dark: colors.texto, light: colors.claro }
    }).then(setQr).catch(() => setQr(''));
  }, [data.qrPass.value, colors.claro, colors.texto]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>('.au-reveal')];
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [data.sections]);

  useEffect(() => {
    const scroller = rootRef.current;
    const section = parallaxRef.current;
    const image = parallaxImageRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!scroller || !section || !image || reduced || !data.sections.parallax) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const sectionRect = section.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const progress = (scrollerRect.top + scroller.clientHeight / 2 - (sectionRect.top + sectionRect.height / 2)) /
        (scroller.clientHeight + sectionRect.height);
      const offset = Math.max(-65, Math.min(65, progress * 130));
      image.style.setProperty('--au-parallax-y', `${offset.toFixed(2)}px`);
    };
    const requestUpdate = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    scroller.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      scroller.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [data.sections.parallax]);

  useEffect(() => {
    if (!modal) return;
    document.body.classList.add('au-modal-open');
    const focusable = () => [...(modalRef.current?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]') ?? [])]
      .filter((element) => !element.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('au-modal-open');
    };
  }, [modal]);

  const openModal = (name: ModalName, event: React.MouseEvent<HTMLElement>, index = 0) => {
    triggerRef.current = event.currentTarget;
    setLightbox(index);
    setModal(name);
  };
  const closeModal = () => {
    setModal(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };
  const formatDate = (withTime = false) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: data.event.timezone
    };
    if (withTime) Object.assign(options, { hour: '2-digit', minute: '2-digit', hour12: locale === 'en' });
    const value = new Intl.DateTimeFormat(t.region, options).format(new Date(data.event.dateTime));
    return value.charAt(0).toUpperCase() + value.slice(1);
  };
  const heroDate = useMemo(() => {
    const value = new Date(data.event.dateTime);
    return {
      weekday: new Intl.DateTimeFormat(t.region, { weekday: 'long', timeZone: data.event.timezone }).format(value),
      month: new Intl.DateTimeFormat(t.region, { month: 'long', timeZone: data.event.timezone }).format(value),
      day: new Intl.DateTimeFormat(t.region, { day: '2-digit', timeZone: data.event.timezone }).format(value),
      year: new Intl.DateTimeFormat(t.region, { year: 'numeric', timeZone: data.event.timezone }).format(value),
      time: new Intl.DateTimeFormat(t.region, { hour: '2-digit', minute: '2-digit', hour12: locale === 'en', timeZone: data.event.timezone }).format(value)
    };
  }, [data.event.dateTime, data.event.timezone, locale, t.region]);
  const external = (url?: string) => url
    ? window.open(url, '_blank', 'noopener,noreferrer')
    : window.alert(t.missingLink);
  const downloadCalendar = () => {
    const clean = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escape = (value: string) => value.replace(/[\\;,]/g, (match) => `\\${match}`);
    const content = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Save Your Date//Aurora//ES', 'BEGIN:VEVENT',
      `DTSTART:${clean(data.event.dateTime)}`, `DTEND:${clean(data.event.endDateTime)}`,
      `SUMMARY:${escape(data.event.calendarTitle)}`, `LOCATION:${escape(`${data.event.venue}, ${data.event.address}`)}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aurora.ics';
    link.click();
    URL.revokeObjectURL(url);
  };
  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(data.gifts.alias);
      setCopyStatus(t.copied);
    } catch {
      setCopyStatus(data.gifts.alias);
    }
  };
  const nextSection = () => {
    const next = Object.entries(data.sections).find(([key, enabled]) => key !== 'hero' && enabled)?.[0];
    rootRef.current?.querySelector<HTMLElement>(`[data-au-section="${next}"]`)?.scrollIntoView({ behavior: 'smooth' });
  };
  const submit = async (kind: 'rsvp' | 'song', event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const endpoint = kind === 'rsvp' ? data.links.rsvpEndpoint : data.links.songSuggestionsEndpoint;
    const setState = kind === 'rsvp' ? setRsvpState : setSongState;
    setState('loading');
    try {
      if (endpoint) {
        const response = await fetch(endpoint, { method: 'POST', body: new FormData(event.currentTarget) });
        if (!response.ok) throw new Error('Request failed');
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
      setState('success');
    } catch {
      setState('error');
    }
  };
  const schedule = data.schedule.map((item, index) => ({
    ...item,
    title: item.title || t.schedule[index]?.[0] || '',
    description: item.description || t.schedule[index]?.[1] || ''
  }));
  const gallery = data.gallery.map((image, index) => ({
    ...image,
    alt: image.alt || `${t.galleryTitle} ${index + 1}`
  }));

  return (
    <div
      ref={rootRef}
      className={`aurora${embedded ? ' au-embedded' : ''}`}
      lang={locale}
      data-palette={palette}
      style={cssVars}
    >
      <a className="au-skip" href="#aurora-main">{t.skip}</a>
      {!embedded && onClose && <button className="au-site-close" onClick={onClose} aria-label={t.close}>×</button>}
      <div className={`au-loader${loaded ? ' is-hidden' : ''}`} aria-hidden={loaded}>
        <span />
        <p>{t.loading}</p>
      </div>

      <main id="aurora-main">
        {data.sections.hero && (
          <section className="au-hero" data-au-section="hero">
            <img className="au-hero-ornament au-hero-ornament-top" src={data.assets.ornamentTop} alt="" aria-hidden="true" />
            <img className="au-hero-ornament au-hero-ornament-bottom" src={data.assets.ornamentBottom} alt="" aria-hidden="true" />
            <div className="au-particles" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((number) => <i className={`au-spark au-spark-${number}`} key={`spark-${number}`} />)}
              {[1, 2, 3, 4].map((number) => <i className={`au-petal au-petal-${number}`} key={`petal-${number}`} />)}
            </div>
            <div className="au-hero-content">
              <p className="au-kicker">{t.heroKicker}</p>
              <p
                className="au-name"
                style={{
                  '--au-name-size': embedded
                    ? `clamp(3.25rem, ${Math.min(22, 132 / Math.max(data.event.name.length, 1))}cqw, 6rem)`
                    : `clamp(4.8rem, ${Math.min(21, 210 / Math.max(data.event.name.length, 1))}vw, 8.5rem)`
                } as React.CSSProperties}
              >
                {data.event.name}
              </p>
              <h1 className="au-visually-hidden">{t.eventType}</h1>
              <div className="au-date-card" aria-label={formatDate(true)}>
                <div><span />{heroDate.weekday}<span /></div>
                <div><b>{heroDate.month}</b><strong>{heroDate.day}</strong><b>{heroDate.year}</b></div>
                <div><span />{heroDate.time}<span /></div>
              </div>
            </div>
            <button className="au-navigate" type="button" onClick={nextSection} aria-label={t.navigate}>
              <img src={data.assets.navigationIcon} alt="" aria-hidden="true" />
            </button>
          </section>
        )}

        {data.sections.countdown && (
          <section className={sectionClass(data.tones.countdown)} data-au-section="countdown">
            <div className="au-container au-reveal">
              <small>{t.countdownEyebrow}</small>
              <h2>{t.countdownTitle}</h2>
              <div className="au-countdown">
                {countdown.map((value, index) => <div key={t.units[index]}><strong>{value}</strong><span>{t.units[index]}</span></div>)}
              </div>
              {countdown.every((value) => value === 0) && <p aria-live="polite">{t.countdownDone}</p>}
            </div>
          </section>
        )}

        {data.sections.location && (
          <><section className={sectionClass(data.tones.location)} data-au-section="location">
            <div className="au-container au-reveal">
              <h2>{t.locationTitle}</h2>
              <p><strong>{formatDate(true)}</strong></p>
              <p>{data.event.venue}<br />{data.event.address}</p>
              <div className="au-buttons">
                <button className="au-btn" onClick={() => external(data.links.maps)}>{t.map}</button>
                <button className="au-btn au-btn-outline" onClick={downloadCalendar}>{t.calendar}</button>
              </div>
            </div>
          </section><SectionOrnament prefix="au" side="right" src={data.assets.ornamentRight} /></>
        )}

        {data.sections.quote && (
          <><section className={sectionClass(data.tones.quote)} data-au-section="quote">
            <div className="au-container au-reveal"><blockquote>{data.content.quote || t.quote}</blockquote></div>
          </section><SectionOrnament prefix="au" side="left" src={data.assets.ornamentLeft} /></>
        )}

        {data.sections.dressCode && (
          <section className={sectionClass(data.tones.dressCode)} data-au-section="dressCode">
            <div className="au-container au-reveal">
              <h2>{t.dressTitle}</h2>
              <p>{data.content.dressSummary || t.dressSummary}</p>
              <button className="au-btn au-btn-outline" onClick={(event) => openModal('dress', event)}>{t.dressButton}</button>
            </div>
          </section>
        )}

        {data.sections.schedule && (
          <><section className={sectionClass(data.tones.schedule)} data-au-section="schedule">
            <div className="au-container au-reveal">
              <h2>{t.scheduleTitle}</h2>
              <div className="au-schedule">
                {schedule.map((item, index) => (
                  <article key={`${item.time}-${index}`}>
                    <time>{item.time}</time><i aria-hidden="true" />
                    <div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
                  </article>
                ))}
              </div>
            </div>
          </section><SectionOrnament prefix="au" side="right" src={data.assets.ornamentRight} /></>
        )}

        {data.sections.parallax && (
          <section ref={parallaxRef} className="au-parallax" data-au-section="parallax">
            <div ref={parallaxImageRef} className="au-parallax-image" aria-hidden="true" />
            <h2 className="au-reveal">{data.content.parallaxTitle || t.parallax}</h2>
          </section>
        )}

        {data.sections.gallery && (
          <section className={sectionClass(data.tones.gallery)} data-au-section="gallery">
            <div className="au-container au-reveal">
              <h2>{t.galleryTitle}</h2><p>{t.galleryCopy}</p>
              <div className="au-gallery">
                {gallery.map((image, index) => (
                  <button key={`${image.src}-${index}`} onClick={(event) => openModal('lightbox', event, index)} aria-label={image.alt}>
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {data.sections.hotels && (
          <section className={sectionClass(data.tones.hotels)} data-au-section="hotels">
            <div className="au-container au-reveal"><h2>{t.hotelsTitle}</h2><p>{t.hotelsCopy}</p><button className="au-btn au-btn-outline" onClick={(event) => openModal('hotels', event)}>{t.hotelsButton}</button></div>
          </section>
        )}
        {data.sections.gifts && data.gifts.visible && (
          <><section className={sectionClass(data.tones.gifts)} data-au-section="gifts">
            <div className="au-container au-reveal"><h2>{t.giftsTitle}</h2><p>{t.giftsCopy}</p><button className="au-btn" onClick={(event) => openModal('gifts', event)}>{t.giftsButton}</button></div>
          </section><SectionOrnament prefix="au" side="left" src={data.assets.ornamentLeft} /></>
        )}
        {data.sections.photoUpload && (
          <section className={sectionClass(data.tones.photoUpload)} data-au-section="photoUpload">
            <div className="au-container au-reveal"><h2>{t.photosTitle}</h2><p>{t.photosCopy}</p><button className="au-btn" onClick={() => external(data.links.photoUpload)}>{t.photosButton}</button></div>
          </section>
        )}
        {data.sections.social && (
          <><section className={sectionClass(data.tones.social)} data-au-section="social">
            <div className="au-container au-reveal"><h2>{t.socialTitle}</h2><p>{t.socialCopy}</p><p className="au-hashtag">{data.content.hashtag}</p><button className="au-btn au-btn-outline" onClick={() => external(data.links.instagram)}>{t.socialButton}</button></div>
          </section><SectionOrnament prefix="au" side="right" src={data.assets.ornamentRight} /></>
        )}
        {data.sections.songSuggestions && (
          <section className={sectionClass(data.tones.songSuggestions)} data-au-section="songSuggestions">
            <div className="au-container au-reveal"><h2>{t.songsTitle}</h2><p>{t.songsCopy}</p><button className="au-btn" onClick={(event) => openModal('songs', event)}>{t.songsButton}</button></div>
          </section>
        )}
        {data.sections.qrPass && (
          <><section className={sectionClass(data.tones.qrPass)} data-au-section="qrPass">
            <div className="au-container au-reveal"><h2>{t.qrTitle}</h2><p>{t.qrCopy}</p><button className="au-btn" onClick={(event) => openModal('qr', event)}>{t.qrButton}</button></div>
          </section><SectionOrnament prefix="au" side="left" src={data.assets.ornamentLeft} /></>
        )}
        {data.sections.rsvp && (
          <section className={sectionClass(data.tones.rsvp)} data-au-section="rsvp">
            <div className="au-container au-reveal"><h2>{t.rsvpTitle}</h2><p>{data.content.rsvpDeadline || t.rsvpDeadline}</p><button className="au-btn" onClick={(event) => openModal('rsvp', event)}>{t.rsvpButton}</button></div>
          </section>
        )}
      </main>

      <footer className="au-footer">
        <strong>Save Your Date</strong>
        <p>{t.footer}</p><hr />
        <p>© {new Date().getFullYear()} Save Your Date · {t.rights}</p>
      </footer>

      {modal && (
        <div className="au-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div ref={modalRef} className="au-modal-box" role="dialog" aria-modal="true" aria-labelledby="au-modal-title">
            <button className="au-modal-close" onClick={closeModal} aria-label={t.close}>
              <span aria-hidden="true">×</span>
            </button>
            {modal === 'dress' && <><h2 id="au-modal-title">{t.dressTitle}</h2><p>{data.content.dressDetails || t.dressDetails}</p></>}
            {modal === 'hotels' && <><h2 id="au-modal-title">{t.hotelsTitle}</h2>{data.hotels.map((hotel) => <article className="au-hotel" key={hotel.name}><h3>{hotel.name}</h3>{hotel.address && <p>{hotel.address}</p>}{hotel.distance && <p>{hotel.distance}</p>}{hotel.discount && <p>{hotel.discount}</p>}{hotel.notes && <p>{hotel.notes}</p>}{hotel.phone && <a href={`tel:${hotel.phone}`}>{hotel.phone}</a>}{hotel.bookingUrl && <button className="au-btn" onClick={() => external(hotel.bookingUrl)}>Reserva</button>}</article>)}</>}
            {modal === 'gifts' && <><h2 id="au-modal-title">{t.giftsTitle}</h2><dl><dt>Banco</dt><dd>{data.gifts.bank}</dd><dt>Titular</dt><dd>{data.gifts.holder}</dd><dt>{data.gifts.currency}</dt><dd>{data.gifts.account}</dd><dt>Alias</dt><dd>{data.gifts.alias}</dd></dl><button className="au-btn" onClick={copyAlias}>{t.copy}</button><p aria-live="polite">{copyStatus}</p>{data.gifts.link && <button className="au-btn au-btn-outline" onClick={() => external(data.gifts.link)}>Lista</button>}</>}
            {modal === 'qr' && <><h2 id="au-modal-title">{t.qrTitle}</h2>{qr ? <img className="au-qr" src={qr} alt={t.qrTitle} /> : <p>{t.error}</p>}</>}
            {modal === 'lightbox' && <><h2 id="au-modal-title" className="au-visually-hidden">{t.galleryTitle}</h2><img className="au-lightbox" src={gallery[lightbox]?.src} alt={gallery[lightbox]?.alt} /></>}
            {modal === 'songs' && <><h2 id="au-modal-title">{t.songsTitle}</h2>{songState === 'success' ? <p aria-live="polite">{t.songSuccess}</p> : <form className="au-form" onSubmit={(event) => submit('song', event)}><label>{t.name}<input name="name" required /></label><label>{t.song}<input name="song" required /></label><button className="au-btn" disabled={songState === 'loading'}>{songState === 'loading' ? '…' : t.send}</button>{songState === 'error' && <p aria-live="polite">{t.error} <button type="submit">{t.retry}</button></p>}</form>}</>}
            {modal === 'rsvp' && <><h2 id="au-modal-title">{t.rsvpTitle}</h2>{rsvpState === 'success' ? <p aria-live="polite">{t.success}</p> : <form className="au-form" onSubmit={(event) => submit('rsvp', event)}><label>{t.name}<input name="name" required /></label><label>{t.attendance}<select name="attendance" required defaultValue=""><option value="" disabled>{t.attendanceOptions[0]}</option><option value="yes">{t.attendanceOptions[1]}</option><option value="no">{t.attendanceOptions[2]}</option></select></label><label>{t.food}<select name="food" value={food} onChange={(event) => setFood(event.target.value)}>{['none', 'celiac', 'vegetarian', 'vegan', 'other'].map((value, index) => <option key={value} value={value}>{t.foodOptions[index]}</option>)}</select></label>{food === 'other' && <label>{t.otherFood}<input name="otherFood" required /></label>}<label>{t.message}<textarea name="message" /></label><button className="au-btn" disabled={rsvpState === 'loading'}>{rsvpState === 'loading' ? '…' : t.submit}</button>{rsvpState === 'error' && <p aria-live="polite">{t.error} <button type="submit">{t.retry}</button></p>}</form>}</>}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionOrnament({ prefix, side, src }:{ prefix:string; side:'left'|'right'; src:string }) {
  return <div className={`${prefix}-section-ornament ${side}`} aria-hidden="true"><img src={src} alt="" loading="lazy" /></div>;
}
