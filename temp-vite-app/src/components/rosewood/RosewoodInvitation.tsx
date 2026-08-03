import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  DEFAULT_ROSEWOOD_CONFIG,
  ROSEWOOD_COPY,
  ROSEWOOD_PALETTES
} from './config';
import type {
  RosewoodConfig,
  RosewoodLocale,
  RosewoodPalette,
  RosewoodTone
} from './config';
import './rosewood.css';

type ModalName = 'dress' | 'hotels' | 'gifts' | 'songs' | 'qr' | 'rsvp' | 'lightbox';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';
type Props = {
  locale: RosewoodLocale;
  palette: RosewoodPalette;
  embedded?: boolean;
  onClose?: () => void;
  config?: Partial<RosewoodConfig>;
};

const sectionClass = (tone: RosewoodTone = 'light') => `rw-section rw-tone-${tone}`;

export function RosewoodInvitation({
  locale,
  palette,
  embedded = false,
  onClose,
  config
}: Props) {
  const t = ROSEWOOD_COPY[locale];
  const data = useMemo(() => ({
    ...DEFAULT_ROSEWOOD_CONFIG,
    ...config,
    event: { ...DEFAULT_ROSEWOOD_CONFIG.event, ...config?.event },
    links: { ...DEFAULT_ROSEWOOD_CONFIG.links, ...config?.links },
    content: { ...DEFAULT_ROSEWOOD_CONFIG.content, ...config?.content },
    gifts: { ...DEFAULT_ROSEWOOD_CONFIG.gifts, ...config?.gifts },
    qrPass: { ...DEFAULT_ROSEWOOD_CONFIG.qrPass, ...config?.qrPass },
    assets: { ...DEFAULT_ROSEWOOD_CONFIG.assets, ...config?.assets },
    sections: { ...DEFAULT_ROSEWOOD_CONFIG.sections, ...config?.sections },
    tones: { ...DEFAULT_ROSEWOOD_CONFIG.tones, ...config?.tones },
    metadata: { ...DEFAULT_ROSEWOOD_CONFIG.metadata, ...config?.metadata }
  }), [config]);
  const colors = ROSEWOOD_PALETTES[palette];
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
    const nodes = [...root.querySelectorAll<HTMLElement>('.rw-reveal')];
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
      image.style.setProperty('--rw-parallax-y', `${offset.toFixed(2)}px`);
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
    document.body.classList.add('rw-modal-open');
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
      document.body.classList.remove('rw-modal-open');
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
  const heroDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: data.event.timezone
  }).format(new Date(data.event.dateTime)).replaceAll('/', '  ·  ');
  const external = (url?: string) => url
    ? window.open(url, '_blank', 'noopener,noreferrer')
    : window.alert(t.missingLink);
  const downloadCalendar = () => {
    const clean = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escape = (value: string) => value.replace(/[\\;,]/g, (match) => `\\${match}`);
    const content = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Save Your Date//Rosewood//ES', 'BEGIN:VEVENT',
      `DTSTART:${clean(data.event.dateTime)}`, `DTEND:${clean(data.event.endDateTime)}`,
      `SUMMARY:${escape(data.event.calendarTitle)}`, `LOCATION:${escape(`${data.event.venue}, ${data.event.address}`)}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rosewood.ics';
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
    rootRef.current?.querySelector<HTMLElement>(`[data-rw-section="${next}"]`)?.scrollIntoView({ behavior: 'smooth' });
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
      className={`rosewood${embedded ? ' rw-embedded' : ''}`}
      lang={locale}
      data-palette={palette}
      style={cssVars}
    >
      <a className="rw-skip" href="#rosewood-main">{t.skip}</a>
      {!embedded && onClose && <button className="rw-site-close" onClick={onClose} aria-label={t.close}>×</button>}
      <div className={`rw-loader${loaded ? ' is-hidden' : ''}`} aria-hidden={loaded}>
        <span />
        <p>{t.loading}</p>
      </div>

      <main id="rosewood-main">
        {data.sections.hero && (
          <section className="rw-hero" data-rw-section="hero">
            <img className="rw-hero-ornament rw-hero-ornament-top" src={data.assets.ornamentTop} alt="" aria-hidden="true" />
            <img className="rw-hero-ornament rw-hero-ornament-bottom" src={data.assets.ornamentBottom} alt="" aria-hidden="true" />
            <div className="rw-particles" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((number) => <i className={`rw-spark rw-spark-${number}`} key={`spark-${number}`} />)}
              {[1, 2, 3, 4].map((number) => <i className={`rw-petal rw-petal-${number}`} key={`petal-${number}`} />)}
            </div>
            <div className="rw-hero-content">
              <p
                className="rw-name"
                style={{
                  '--rw-name-size': embedded
                    ? `clamp(3.25rem, ${Math.min(22, 132 / Math.max(data.event.name.length, 1))}cqw, 6rem)`
                    : `clamp(4.8rem, ${Math.min(21, 210 / Math.max(data.event.name.length, 1))}vw, 8.5rem)`
                } as React.CSSProperties}
              >
                {data.event.name}
              </p>
              <p className="rw-date">{heroDate}</p>
              <h1>{t.eventType}</h1>
            </div>
            <button className="rw-navigate" type="button" onClick={nextSection} aria-label={t.navigate}>
              <img src={data.assets.navigationIcon} alt="" aria-hidden="true" />
            </button>
          </section>
        )}

        {data.sections.countdown && (
          <section className={sectionClass(data.tones.countdown)} data-rw-section="countdown">
            <div className="rw-container rw-reveal">
              <small>{t.countdownEyebrow}</small>
              <h2>{t.countdownTitle}</h2>
              <div className="rw-countdown">
                {countdown.map((value, index) => <div key={t.units[index]}><strong>{value}</strong><span>{t.units[index]}</span></div>)}
              </div>
              {countdown.every((value) => value === 0) && <p aria-live="polite">{t.countdownDone}</p>}
            </div>
          </section>
        )}

        {data.sections.location && (
          <><section className={sectionClass(data.tones.location)} data-rw-section="location">
            <div className="rw-container rw-reveal">
              <h2>{t.locationTitle}</h2>
              <p><strong>{formatDate(true)}</strong></p>
              <p>{data.event.venue}<br />{data.event.address}</p>
              <div className="rw-buttons">
                <button className="rw-btn" onClick={() => external(data.links.maps)}>{t.map}</button>
                <button className="rw-btn rw-btn-outline" onClick={downloadCalendar}>{t.calendar}</button>
              </div>
            </div>
          </section><SectionOrnament prefix="rw" side="right" src={data.assets.ornamentRight} /></>
        )}

        {data.sections.quote && (
          <><section className={sectionClass(data.tones.quote)} data-rw-section="quote">
            <div className="rw-container rw-reveal"><blockquote>{data.content.quote || t.quote}</blockquote></div>
          </section><SectionOrnament prefix="rw" side="left" src={data.assets.ornamentLeft} /></>
        )}

        {data.sections.dressCode && (
          <section className={sectionClass(data.tones.dressCode)} data-rw-section="dressCode">
            <div className="rw-container rw-reveal">
              <h2>{t.dressTitle}</h2>
              <p>{data.content.dressSummary || t.dressSummary}</p>
              <button className="rw-btn rw-btn-outline" onClick={(event) => openModal('dress', event)}>{t.dressButton}</button>
            </div>
          </section>
        )}

        {data.sections.schedule && (
          <section className={sectionClass(data.tones.schedule)} data-rw-section="schedule">
            <div className="rw-container rw-reveal">
              <h2>{t.scheduleTitle}</h2>
              <div className="rw-schedule">
                {schedule.map((item, index) => (
                  <article key={`${item.time}-${index}`}>
                    <time>{item.time}</time><i aria-hidden="true" />
                    <div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {data.sections.parallax && (
          <section ref={parallaxRef} className="rw-parallax" data-rw-section="parallax">
            <div ref={parallaxImageRef} className="rw-parallax-image" aria-hidden="true" />
            <h2 className="rw-reveal">{data.content.parallaxTitle || t.parallax}</h2>
          </section>
        )}

        {data.sections.gallery && (
          <section className={sectionClass(data.tones.gallery)} data-rw-section="gallery">
            <div className="rw-container rw-reveal">
              <h2>{t.galleryTitle}</h2><p>{t.galleryCopy}</p>
              <div className="rw-gallery">
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
          <section className={sectionClass(data.tones.hotels)} data-rw-section="hotels">
            <div className="rw-container rw-reveal"><h2>{t.hotelsTitle}</h2><p>{t.hotelsCopy}</p><button className="rw-btn rw-btn-outline" onClick={(event) => openModal('hotels', event)}>{t.hotelsButton}</button></div>
          </section>
        )}
        {data.sections.gifts && data.gifts.visible && (
          <section className={sectionClass(data.tones.gifts)} data-rw-section="gifts">
            <div className="rw-container rw-reveal"><h2>{t.giftsTitle}</h2><p>{t.giftsCopy}</p><button className="rw-btn" onClick={(event) => openModal('gifts', event)}>{t.giftsButton}</button></div>
          </section>
        )}
        {data.sections.photoUpload && (
          <section className={sectionClass(data.tones.photoUpload)} data-rw-section="photoUpload">
            <div className="rw-container rw-reveal"><h2>{t.photosTitle}</h2><p>{t.photosCopy}</p><button className="rw-btn" onClick={() => external(data.links.photoUpload)}>{t.photosButton}</button></div>
          </section>
        )}
        {data.sections.social && (
          <section className={sectionClass(data.tones.social)} data-rw-section="social">
            <div className="rw-container rw-reveal"><h2>{t.socialTitle}</h2><p>{t.socialCopy}</p><p className="rw-hashtag">{data.content.hashtag}</p><button className="rw-btn rw-btn-outline" onClick={() => external(data.links.instagram)}>{t.socialButton}</button></div>
          </section>
        )}
        {data.sections.songSuggestions && (
          <section className={sectionClass(data.tones.songSuggestions)} data-rw-section="songSuggestions">
            <div className="rw-container rw-reveal"><h2>{t.songsTitle}</h2><p>{t.songsCopy}</p><button className="rw-btn" onClick={(event) => openModal('songs', event)}>{t.songsButton}</button></div>
          </section>
        )}
        {data.sections.qrPass && (
          <section className={sectionClass(data.tones.qrPass)} data-rw-section="qrPass">
            <div className="rw-container rw-reveal"><h2>{t.qrTitle}</h2><p>{t.qrCopy}</p><button className="rw-btn" onClick={(event) => openModal('qr', event)}>{t.qrButton}</button></div>
          </section>
        )}
        {data.sections.rsvp && (
          <section className={sectionClass(data.tones.rsvp)} data-rw-section="rsvp">
            <div className="rw-container rw-reveal"><h2>{t.rsvpTitle}</h2><p>{data.content.rsvpDeadline || t.rsvpDeadline}</p><button className="rw-btn" onClick={(event) => openModal('rsvp', event)}>{t.rsvpButton}</button></div>
          </section>
        )}
      </main>

      <footer className="rw-footer">
        <strong>Save Your Date</strong>
        <p>{t.footer}</p><hr />
        <p>© {new Date().getFullYear()} Save Your Date · {t.rights}</p>
      </footer>

      {modal && (
        <div className="rw-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div ref={modalRef} className="rw-modal-box" role="dialog" aria-modal="true" aria-labelledby="rw-modal-title">
            <button className="rw-modal-close" onClick={closeModal} aria-label={t.close}>
              <span aria-hidden="true">×</span>
            </button>
            {modal === 'dress' && <><h2 id="rw-modal-title">{t.dressTitle}</h2><p>{data.content.dressDetails || t.dressDetails}</p></>}
            {modal === 'hotels' && <><h2 id="rw-modal-title">{t.hotelsTitle}</h2>{data.hotels.map((hotel) => <article className="rw-hotel" key={hotel.name}><h3>{hotel.name}</h3>{hotel.address && <p>{hotel.address}</p>}{hotel.distance && <p>{hotel.distance}</p>}{hotel.discount && <p>{hotel.discount}</p>}{hotel.notes && <p>{hotel.notes}</p>}{hotel.phone && <a href={`tel:${hotel.phone}`}>{hotel.phone}</a>}{hotel.bookingUrl && <button className="rw-btn" onClick={() => external(hotel.bookingUrl)}>Reserva</button>}</article>)}</>}
            {modal === 'gifts' && <><h2 id="rw-modal-title">{t.giftsTitle}</h2><dl><dt>Banco</dt><dd>{data.gifts.bank}</dd><dt>Titular</dt><dd>{data.gifts.holder}</dd><dt>{data.gifts.currency}</dt><dd>{data.gifts.account}</dd><dt>Alias</dt><dd>{data.gifts.alias}</dd></dl><button className="rw-btn" onClick={copyAlias}>{t.copy}</button><p aria-live="polite">{copyStatus}</p>{data.gifts.link && <button className="rw-btn rw-btn-outline" onClick={() => external(data.gifts.link)}>Lista</button>}</>}
            {modal === 'qr' && <><h2 id="rw-modal-title">{t.qrTitle}</h2>{qr ? <img className="rw-qr" src={qr} alt={t.qrTitle} /> : <p>{t.error}</p>}</>}
            {modal === 'lightbox' && <><h2 id="rw-modal-title" className="rw-visually-hidden">{t.galleryTitle}</h2><img className="rw-lightbox" src={gallery[lightbox]?.src} alt={gallery[lightbox]?.alt} /></>}
            {modal === 'songs' && <><h2 id="rw-modal-title">{t.songsTitle}</h2>{songState === 'success' ? <p aria-live="polite">{t.songSuccess}</p> : <form className="rw-form" onSubmit={(event) => submit('song', event)}><label>{t.name}<input name="name" required /></label><label>{t.song}<input name="song" required /></label><button className="rw-btn" disabled={songState === 'loading'}>{songState === 'loading' ? '…' : t.send}</button>{songState === 'error' && <p aria-live="polite">{t.error} <button type="submit">{t.retry}</button></p>}</form>}</>}
            {modal === 'rsvp' && <><h2 id="rw-modal-title">{t.rsvpTitle}</h2>{rsvpState === 'success' ? <p aria-live="polite">{t.success}</p> : <form className="rw-form" onSubmit={(event) => submit('rsvp', event)}><label>{t.name}<input name="name" required /></label><label>{t.attendance}<select name="attendance" required defaultValue=""><option value="" disabled>{t.attendanceOptions[0]}</option><option value="yes">{t.attendanceOptions[1]}</option><option value="no">{t.attendanceOptions[2]}</option></select></label><label>{t.food}<select name="food" value={food} onChange={(event) => setFood(event.target.value)}>{['none', 'celiac', 'vegetarian', 'vegan', 'other'].map((value, index) => <option key={value} value={value}>{t.foodOptions[index]}</option>)}</select></label>{food === 'other' && <label>{t.otherFood}<input name="otherFood" required /></label>}<label>{t.message}<textarea name="message" /></label><button className="rw-btn" disabled={rsvpState === 'loading'}>{rsvpState === 'loading' ? '…' : t.submit}</button>{rsvpState === 'error' && <p aria-live="polite">{t.error} <button type="submit">{t.retry}</button></p>}</form>}</>}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionOrnament({ prefix, side, src }:{ prefix:string; side:'left'|'right'; src:string }) {
  return <div className={`${prefix}-section-ornament ${side}`} aria-hidden="true"><img src={src} alt="" loading="lazy" /></div>;
}
