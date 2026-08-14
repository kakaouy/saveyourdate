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
  AuroraPaletteTokens,
  AuroraTone
} from './config';
import './aurora.css';
import { applySectionDomOrder } from '../../domain/section-dom-order';

type ModalName = 'dress' | 'hotels' | 'gifts' | 'songs' | 'qr' | 'rsvp' | 'lightbox';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';
type Props = {
  locale: AuroraLocale;
  palette: AuroraPalette;
  embedded?: boolean;
  onClose?: () => void;
  config?: Partial<AuroraConfig>;
  modelClass?: string;
  paletteTokens?: AuroraPaletteTokens;
  editorialHero?: boolean;
  marfilHero?: boolean;
  votoHero?: boolean;
  oliviaHero?: boolean;
  sweetJaneHero?: boolean;
  gardenHero?: boolean;
  eucaliptoHero?: boolean;
  astraeaHero?: boolean;
  globalPetals?: boolean;
  carouselGallery?: boolean;
  sectionOrder?: string[];
};

const sectionClass = (tone: AuroraTone = 'light') => `au-section au-tone-${tone}`;

export function AuroraInvitation({
  locale,
  palette,
  embedded = false,
  onClose,
  config,
  modelClass = '',
  paletteTokens,
  editorialHero = false,
  marfilHero = false,
  votoHero = false,
  oliviaHero = false,
  sweetJaneHero = false,
  gardenHero = false,
  eucaliptoHero = false,
  astraeaHero = false,
  globalPetals = false,
  carouselGallery = false,
  sectionOrder
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
  const colors = paletteTokens || AURORA_PALETTES[palette];
  const ornamentLeft = data.assets.ornamentLeft || data.assets.ornamentRight;
  const ornamentRight = data.assets.ornamentRight || data.assets.ornamentLeft;
  const mirrorLeftOrnament = !data.assets.ornamentLeft && Boolean(data.assets.ornamentRight);
  const mirrorRightOrnament = (!data.assets.ornamentRight && Boolean(data.assets.ornamentLeft)) ||
    (Boolean(ornamentLeft) && ornamentLeft === ornamentRight);
  const customCopy = data.content as typeof data.content & Record<string, string | undefined>;
  const copy = (key: string, fallback: string) => customCopy[key] || fallback;
  const rootRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLElement>(null);
  const parallaxImageRef = useRef<HTMLDivElement>(null);
  const musicButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalName | null>(null);
  const [modalTop, setModalTop] = useState(0);
  const [lightbox, setLightbox] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
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
    , '--modular-ornament-right': `url("${ornamentRight}")`
    , '--modular-ornament-left': `url("${ornamentLeft}")`
    , '--modular-ornament-right-scale-x': mirrorRightOrnament ? '-1' : '1'
    , '--modular-ornament-left-scale-x': mirrorLeftOrnament ? '-1' : '1'
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
    if (!(sweetJaneHero || gardenHero) || !data.sections.gallery || data.gallery.length < 2) return;
    const timer = window.setInterval(() => setGalleryIndex((current) => (current + 1) % data.gallery.length), 4200);
    return () => window.clearInterval(timer);
  }, [sweetJaneHero, gardenHero, data.sections.gallery, data.gallery.length]);

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
    applySectionDomOrder(rootRef.current?.querySelector<HTMLElement>('#aurora-main') || null, sectionOrder, 'data-au-section', '.au-section-ornament');
  }, [sectionOrder, data.sections]);

  useEffect(() => {
    const scroller = rootRef.current;
    const button = musicButtonRef.current;
    if (!marfilHero || !embedded || !scroller || !button) return;
    let frame = 0;
    const update = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        button.style.top = `${scroller.scrollTop + scroller.clientHeight - button.offsetHeight - 14}px`;
      });
    };
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [embedded, marfilHero]);

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
    if (embedded) setModalTop(rootRef.current?.scrollTop || 0);
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
      className={`aurora${embedded ? ' au-embedded' : ''}${modelClass ? ` ${modelClass}` : ''}`}
      lang={locale}
      data-palette={palette}
      style={cssVars}
    >
      {globalPetals && <div className="au-global-petals" aria-hidden="true">{[
        [6,8,13,-7,34],[14,11,17,-2,-28],[23,7,15,-11,42],[32,10,19,-5,-36],
        [41,8,14,-9,26],[50,12,20,-14,-44],[59,7,16,-4,38],[68,10,18,-12,-30],
        [77,8,14,-1,32],[85,11,21,-16,-40],[92,7,15,-6,24],[97,9,18,-10,-34]
      ].map(([left,width,duration,delay,drift],index)=><span key={index} style={{'--petal-left':`${left}%`,'--petal-width':`${width}px`,'--petal-duration':`${duration}s`,'--petal-delay':`${delay}s`,'--petal-drift':`${drift}px`} as React.CSSProperties}/>)}</div>}
      <a className="au-skip" href="#aurora-main">{t.skip}</a>
      {!embedded && onClose && <button className="au-site-close" onClick={onClose} aria-label={t.close}>×</button>}
      <div className={`au-loader${loaded ? ' is-hidden' : ''}`} aria-hidden={loaded}>
        <span />
        <p>{t.loading}</p>
      </div>

      <main id="aurora-main">
        {data.sections.hero && (
          <section className="au-hero" data-au-section="hero">
            {!astraeaHero && !marfilHero && !votoHero && !oliviaHero && !sweetJaneHero && !gardenHero && !eucaliptoHero && <><img className="au-hero-ornament au-hero-ornament-top" src={data.assets.ornamentTop} alt="" aria-hidden="true" /><img className="au-hero-ornament au-hero-ornament-bottom" src={data.assets.ornamentBottom} alt="" aria-hidden="true" /></>}
            <div className="au-particles" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((number) => <i className={`au-spark au-spark-${number}`} key={`spark-${number}`} />)}
              {[1, 2, 3, 4].map((number) => <i className={`au-petal au-petal-${number}`} key={`petal-${number}`} />)}
            </div>
            <div className="au-hero-content">
              {eucaliptoHero ? (
                <div className="au-eucalipto-intro">
                  <img className="au-eucalipto-hero-decoration" src="/desarrollo/boda/invite_004/assets/portada-esquina.png" alt="" aria-hidden="true" />
                  <div className="au-eucalipto-copy">
                    <p className="au-eucalipto-kicker au-reveal">¡Nos casamos!</p>
                    <h1 className="au-eucalipto-names au-reveal">{data.event.name.split(/\s*&\s*/).map((name, index) => <span key={name}>{index > 0 && <i>&amp;</i>}{name}</span>)}</h1>
                    <p className="au-eucalipto-message au-reveal">Junto a nuestras familias tenemos la alegría de invitarte a celebrar nuestro matrimonio</p>
                  </div>
                  <span className="au-eucalipto-discover">Deslizá para descubrir</span>
                </div>
              ) : gardenHero ? (
                <div className="au-garden-intro">
                  <img className="au-garden-ornament au-garden-ornament-top" src={data.assets.ornamentTop} alt="" aria-hidden="true" />
                  <div className="au-garden-copy">
                    <h1>{data.event.name}</h1>
                    <div className="au-garden-details">
                      <div className="au-garden-identity"><p><span>{heroDate.day}</span> {heroDate.month} {heroDate.year}</p><strong>Mis 15</strong></div>
                      <p className="au-garden-message">Quiero invitarte a una noche épica, llena de magia y alegría.</p>
                    </div>
                  </div>
                  <img className="au-garden-ornament au-garden-ornament-bottom" src={data.assets.ornamentBottom} alt="" aria-hidden="true" />
                  <button className="au-navigate au-garden-navigate" type="button" onClick={nextSection} aria-label={t.navigate}><img src={data.assets.navigationIcon} alt="" /></button>
                </div>
              ) : sweetJaneHero ? (
                <div className="au-sweet-intro">
                  <p className="au-sweet-date">{heroDate.day} • {String(new Date(data.event.dateTime).getMonth() + 1).padStart(2, '0')} • {heroDate.year}</p>
                  <h1 className="au-sweet-name">{data.event.name}</h1>
                  <p className="au-sweet-event"><span>Mis 15 años</span></p>
                  <p className="au-sweet-message">Llegó esta gran noche,<br />¡y quiero compartirla con vos!</p>
                  <span className="au-sweet-flourish" aria-hidden="true">♡</span>
                  <button className="au-btn au-sweet-open" type="button" onClick={nextSection}>Ver invitación</button>
                </div>
              ) : oliviaHero ? (
                <div className="au-olivia-intro">
                  <div className="au-olivia-branches" aria-hidden="true">{[1, 2, 3, 4, 5].map((number) => <i className={`au-olivia-branch au-olivia-branch-${number}`} key={number} />)}</div>
                  <div className="au-olivia-photo" aria-hidden="true"><img src={data.assets.hero} alt="" /></div>
                  <h1 className="au-olivia-names">{data.event.name.split(/\s*&\s*/).map((name, index) => <span key={name}>{index > 0 && <i>&amp;</i>}{name}</span>)}</h1>
                  <p className="au-olivia-message">¡Nos casamos!<br />Con mucha alegría queremos invitarte a ser parte de nuestro matrimonio</p>
                </div>
              ) : votoHero ? (
                <div className="au-voto-intro">
                  <p className="au-voto-kicker">{copy('heroKicker', 'NOS CASAMOS')}</p>
                  <h1 className="au-voto-names">{data.event.name.split(/\s*&\s*/).map((name, index) => <span key={name}>{index > 0 && <i>y</i>}{name}</span>)}</h1>
                  <p className="au-voto-message">Nos encantaría que nos acompañaras a celebrar nuestro casamiento</p>
                  <p className="au-voto-date">{heroDate.day} · {String(new Date(data.event.dateTime).getMonth() + 1).padStart(2, '0')} · {heroDate.year}</p>
                  <p className="au-voto-place"><span>A las {heroDate.time}</span><span>{data.event.venue} · {data.event.address}</span></p>
                  <span className="au-voto-discover">Descubrí la invitación</span>
                </div>
              ) : marfilHero ? (
                <div className="au-marfil-intro">
                  <p className="au-marfil-kicker">{copy('heroKicker', 'NOS CASAMOS')}</p>
                  <h1 className="au-marfil-names">{data.event.name.split(/\s*&\s*/).map((name, index) => <span key={name}>{index > 0 && <i>&amp;</i>}{name}</span>)}</h1>
                  <p className="au-marfil-meta"><span>Montevideo</span><span aria-hidden="true" className="au-marfil-meta-line" /><span>2026</span></p>
                  <div className="au-marfil-polaroids" aria-hidden="true">
                    {(data.gallery.length ? data.gallery : [{ src: data.assets.hero }, { src: data.assets.parallax }]).slice(0, 4).map((image, index) => <img key={`${image.src}-${index}`} src={image.src} alt="" />)}
                  </div>
                </div>
              ) : astraeaHero ? (
                <div className="au-astraea-intro">
                  <p className="au-name">{data.event.name}</p>
                  <h1 className="au-astraea-title">{copy('heroKicker', t.heroKicker)}</h1>
                  <p className="au-astraea-quote">{data.content.heroQuote || data.content.quote || t.quote}</p>
                  <div className="au-astraea-divider au-reveal" aria-hidden="true" />
                  <div className="au-astraea-date au-reveal" aria-label={formatDate(true)}><span>{heroDate.day}</span><span>{String(new Date(data.event.dateTime).getMonth() + 1).padStart(2, '0')}</span><span>{heroDate.year.slice(-2)}</span></div>
                </div>
              ) : editorialHero ? (
                <div className="au-editorial-intro">
                  <p className="au-editorial-date" aria-label={formatDate(true)}>{heroDate.day} · {String(new Date(data.event.dateTime).getMonth() + 1).padStart(2, '0')} · {heroDate.year}</p>
                  <p className="au-name">{data.event.name}</p>
                  <h1 className="au-editorial-title">¡{copy('heroKicker', t.heroKicker)}!</h1>
                </div>
              ) : (
                <>
                  <p className="au-kicker">{copy('heroKicker', t.heroKicker)}</p>
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
                  <h1 className="au-visually-hidden">{copy('eventType', t.eventType)}</h1>
                  <div className="au-date-card" aria-label={formatDate(true)}>
                    <div><span />{heroDate.weekday}<span /></div>
                    <div><b>{heroDate.month}</b><strong>{heroDate.day}</strong><b>{heroDate.year}</b></div>
                    <div><span />{heroDate.time}<span /></div>
                  </div>
                </>
              )}
            </div>
            <button className="au-navigate" type="button" onClick={nextSection} aria-label={t.navigate}>
              <img src={data.assets.navigationIcon} alt="" aria-hidden="true" />
            </button>
          </section>
        )}

        {data.sections.dateStack && (
          <section className={`${sectionClass(data.tones.dateStack)} au-date-stack-section`} data-au-section="dateStack">
            {eucaliptoHero ? <div className="au-eucalipto-date au-reveal" aria-label={formatDate(true)}>
              <div className="au-eucalipto-date-heading"><span>{heroDate.weekday}</span><strong>{heroDate.month}</strong><span>{heroDate.year}</span></div>
              <div className="au-eucalipto-day">{heroDate.day}</div>
              <div className="au-eucalipto-time"><span>A las</span><strong>{heroDate.time}</strong><span>horas</span></div>
              <div className="au-eucalipto-countdown">{countdown.map((value, index) => <div key={t.units[index]}><strong>{value}</strong><span>{t.units[index]}</span></div>)}</div>
            </div> : oliviaHero ? <div className="au-olivia-calendar au-reveal" aria-label={formatDate(true)}>
              <img className="au-olivia-calendar-icon" src="/catalog/boda-boho/calendar-icon.png" alt="" aria-hidden="true" />
              <h2>{heroDate.month}</h2>
              <div className="au-olivia-week">{['L','M','M','J','V','S','D'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
              <div className="au-olivia-days">{[0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((day, index) => <span className={day === Number(heroDate.day) ? 'is-chosen' : ''} key={index}>{day || ''}</span>)}</div>
              <p>{formatDate(true)}</p>
            </div> : <>
              <div className="au-date-wave au-date-wave-top au-reveal" aria-hidden="true"><svg viewBox="0 0 40 140"><path d="M20 0 C5 18 35 32 20 50 C5 68 35 82 20 100 C8 116 28 126 20 140"/></svg></div>
              <div className="au-date-stack au-reveal" aria-label={formatDate(true)}><span>{heroDate.day}</span><span>{String(new Date(data.event.dateTime).getMonth() + 1).padStart(2, '0')}</span><span>{heroDate.year.slice(-2)}</span></div>
              <div className="au-date-wave au-date-wave-bottom au-reveal" aria-hidden="true"><svg viewBox="0 0 40 140"><path d="M20 0 C5 18 35 32 20 50 C5 68 35 82 20 100 C8 116 28 126 20 140"/></svg></div>
            </>}
          </section>
        )}

        {data.sections.countdown && (
          <section className={sectionClass(data.tones.countdown)} data-au-section="countdown">
            <div className="au-container au-reveal">
              <small>{copy('countdownEyebrow', t.countdownEyebrow)}</small>
              <h2>{copy('countdownTitle', t.countdownTitle)}</h2>
              <div className="au-countdown">
                {countdown.map((value, index) => <div key={t.units[index]}><strong>{value}</strong><span>{t.units[index]}</span></div>)}
              </div>
              {countdown.every((value) => value === 0) && <p aria-live="polite">{t.countdownDone}</p>}
            </div>
          </section>
        )}

        {data.sections.location && (
          <><section className={sectionClass(data.tones.location)} data-au-section="location">
            {eucaliptoHero ? <div className="au-eucalipto-events">
              <article className="au-eucalipto-event-card au-reveal"><i aria-hidden="true" /><img src="/desarrollo/boda/invite_004/assets/icon-church-gd.png" alt="" /><small>Ceremonia</small><h2>Basílica Nuestra Señora<br />del Pilar</h2><p>Junín 1904, Recoleta<br />Ciudad Autónoma de Buenos Aires · 18:30 hs</p><button className="au-btn" onClick={() => external('https://maps.google.com/?q=Bas%C3%ADlica+Nuestra+Se%C3%B1ora+del+Pilar+Buenos+Aires')}>Cómo llegar</button></article>
              <article className="au-eucalipto-event-card au-reveal"><i aria-hidden="true" /><img src="/desarrollo/boda/invite_004/assets/icon-wine-gd.png" alt="" /><small>Recepción</small><h2>Palacio Duhau</h2><p>Av. Alvear 1661, Recoleta<br />Ciudad Autónoma de Buenos Aires · 20:30 hs</p><button className="au-btn" onClick={() => external('https://maps.google.com/?q=Palacio+Duhau+Buenos+Aires')}>Cómo llegar</button></article>
            </div> : oliviaHero ? <div className="au-container au-olivia-locations au-reveal">
              <div className="au-olivia-location-grid">
                <article><img src="/catalog/boda-boho/location-ceremony.png" alt="" /><h3>Ceremonia religiosa</h3><p>Basílica del Santísimo Sacramento<br />San Martín 1035, Ciudad de Buenos Aires</p><button className="au-btn" onClick={() => external(data.links.maps)}>Ver ubicación</button></article>
                <article><img src="/catalog/boda-boho/location-reception.png" alt="" /><h3>Recepción</h3><p>Palacio Sans Souci<br />Paz 705, Victoria, Buenos Aires</p><button className="au-btn" onClick={() => external(data.links.maps)}>Ver ubicación</button></article>
              </div>
              <button className="au-btn au-btn-outline au-olivia-calendar-button" onClick={downloadCalendar}>{copy('calendarLabel', t.calendar)}</button>
            </div> : <div className="au-container au-reveal">
              <h2>{copy('locationTitle', t.locationTitle)}</h2><p><strong>{formatDate(true)}</strong></p><p>{data.event.venue}<br />{data.event.address}</p>
              <div className="au-buttons"><button className="au-btn" onClick={() => external(data.links.maps)}>{marfilHero ? 'Google Maps' : copy('mapLabel', t.map)}</button><button className="au-btn au-btn-outline" onClick={marfilHero ? () => external('https://waze.com/') : downloadCalendar}>{marfilHero ? 'Waze' : copy('calendarLabel', t.calendar)}</button></div>
            </div>}
          </section><SectionOrnament prefix="au" side="right" src={ornamentRight} mirrored={mirrorRightOrnament} /></>
        )}

        {data.sections.quote && (
          <><section className={sectionClass(data.tones.quote)} data-au-section="quote">
            <div className="au-container au-reveal"><blockquote>{data.content.quote || t.quote}</blockquote></div>
          </section><SectionOrnament prefix="au" side="left" src={ornamentLeft} mirrored={mirrorLeftOrnament} /></>
        )}

        {data.sections.dressCode && (
          <section className={sectionClass(data.tones.dressCode)} data-au-section="dressCode">
            {eucaliptoHero ? <div className="au-container au-eucalipto-details"><small className="au-reveal">Detalles de la celebración</small><h2 className="au-reveal">Todo lo que necesitás saber</h2><div className="au-eucalipto-detail-grid">
              <article className="au-reveal"><img src="/desarrollo/boda/invite_004/assets/icon-dress-gd.png" alt="" /><h3>Dress code</h3><p>Formal elegante<br />Tonos libres</p></article>
              <article className="au-reveal"><img src="/desarrollo/boda/invite_004/assets/icon-gift-gd.png" alt="" /><h3>Regalos</h3><p>Tu presencia es nuestro mejor regalo</p><button className="au-btn" onClick={(event)=>openModal('gifts',event)}>Ver datos</button></article>
              <article className="au-reveal"><img src="/desarrollo/boda/invite_004/assets/icon-camera-gd.png" alt="" /><h3>Fotos</h3><p>Compartí tus recuerdos<br />#MartinySofia</p></article>
              <article className="au-reveal"><img src="/desarrollo/boda/invite_004/assets/icon-date-gd.png" alt="" /><h3>Agendalo</h3><p>14 de noviembre<br />de 2026</p><button className="au-btn" onClick={downloadCalendar}>Agendar</button></article>
            </div></div> : <div className="au-container au-reveal"><h2>{sweetJaneHero ? 'Dress code' : copy('dressTitle', t.dressTitle)}</h2><p>{sweetJaneHero ? 'Orientación para tu vestuario: Elegante. Reservamos el blanco para la cumpleañera.' : data.content.dressSummary || t.dressSummary}</p><button className="au-btn au-btn-outline" onClick={(event) => openModal('dress', event)}>{copy('dressButton', t.dressButton)}</button></div>}
          </section>
        )}

        {data.sections.schedule && (
          <><section className={sectionClass(data.tones.schedule)} data-au-section="schedule">
            {eucaliptoHero ? <div className="au-container au-eucalipto-menu"><img className="au-reveal" src="/desarrollo/boda/invite_004/assets/icon-cake-gd.png" alt="" /><small className="au-reveal">Nuestro menú</small><h2 className="au-reveal">Una noche para disfrutar</h2><ul className="au-reveal"><li><strong>Recepción</strong><span>Bocados de estación y espumante</span></li><li><strong>Principal</strong><span>Lomo braseado con vegetales de huerta</span></li><li><strong>Postre</strong><span>Texturas de chocolate y frutos rojos</span></li></ul><p className="au-reveal">Si tenés alguna restricción alimentaria, podés indicarla al confirmar tu asistencia.</p></div> : <div className="au-container au-reveal">
              <h2>{copy('scheduleTitle', t.scheduleTitle)}</h2>
              {marfilHero && <p className="au-marfil-schedule-date">Sábado 22 de agosto de 2026</p>}
              <div className={`au-schedule${oliviaHero ? ' au-olivia-schedule' : ''}`}>
                {schedule.map((item, index) => (
                  <article key={`${item.time}-${index}`}>
                    {oliviaHero ? <><div className="au-olivia-moment"><img src={`/catalog/boda-boho/schedule-${index + 1}.png`} alt="" /><time>{item.time}</time><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div><i aria-hidden="true" /></> : <><time>{item.time}</time><i aria-hidden="true" /><div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div></>}
                  </article>
                ))}
              </div>
            </div>}
          </section><SectionOrnament prefix="au" side="right" src={ornamentRight} mirrored={mirrorRightOrnament} /></>
        )}

        {data.sections.parallax && (
          <section ref={parallaxRef} className="au-parallax" data-au-section="parallax">
            <div ref={parallaxImageRef} className="au-parallax-image" aria-hidden="true" />
            <h2 className="au-reveal">{eucaliptoHero ? 'Nuestro lugar favorito es juntos' : data.content.parallaxTitle || t.parallax}</h2>
          </section>
        )}

        {data.sections.gallery && (
          <section className={sectionClass(data.tones.gallery)} data-au-section="gallery">
            <div className="au-container au-reveal">
              {oliviaHero && <img className="au-olivia-gallery-icon" src="/catalog/boda-boho/gallery-icon.png" alt="" />}
              <h2>{oliviaHero ? 'Galería' : copy('galleryTitle', t.galleryTitle)}</h2><p>{oliviaHero ? 'Un recorrido por momentos inolvidables' : copy('galleryCopy', t.galleryCopy)}</p>
              {carouselGallery ? <div className="au-gallery-carousel">
                <button className="au-gallery-control prev" type="button" aria-label="Ver foto anterior" onClick={()=>setGalleryIndex((galleryIndex-1+gallery.length)%gallery.length)}>‹</button>
                <div className="au-gallery-viewport"><div className="au-gallery-track" style={{'--gallery-index':galleryIndex} as React.CSSProperties}>
                  {gallery.map((image,index)=><button className={`au-gallery-slide${index===galleryIndex?' is-active':''}`} key={`${image.src}-${index}`} onClick={(event)=>openModal('lightbox',event,index)} aria-label={image.alt}><img src={image.src} alt={image.alt} loading="lazy"/></button>)}
                </div></div>
                <button className="au-gallery-control next" type="button" aria-label="Ver foto siguiente" onClick={()=>setGalleryIndex((galleryIndex+1)%gallery.length)}>›</button>
                <div className="au-gallery-dots">{gallery.map((image,index)=><button key={image.src} className={index===galleryIndex?'is-active':''} aria-label={`Ver fotografía ${index+1}`} onClick={()=>setGalleryIndex(index)}/>)}</div>
              </div> : <div className="au-gallery">
                {gallery.map((image, index) => <button key={`${image.src}-${index}`} onClick={(event) => openModal('lightbox', event, index)} aria-label={image.alt}><img src={image.src} alt={image.alt} loading="lazy" /></button>)}
              </div>}
            </div>
          </section>
        )}

        {data.sections.hotels && (
          <section className={sectionClass(data.tones.hotels)} data-au-section="hotels">
            <div className="au-container au-reveal"><h2>{copy('hotelsTitle', t.hotelsTitle)}</h2><p>{copy('hotelsCopy', t.hotelsCopy)}</p><button className="au-btn au-btn-outline" onClick={(event) => openModal('hotels', event)}>{copy('hotelsButton', t.hotelsButton)}</button></div>
          </section>
        )}
        {data.sections.gifts && data.gifts.visible && (
          <><section className={sectionClass(data.tones.gifts)} data-au-section="gifts">
            <div className="au-container au-reveal">{marfilHero && <small>Un detalle</small>}<h2>{marfilHero ? 'Regalos' : copy('giftsTitle', t.giftsTitle)}</h2><p>{marfilHero ? 'Tu presencia es nuestro mejor regalo.' : copy('giftsCopy', t.giftsCopy)}</p><button className="au-btn" onClick={(event) => openModal('gifts', event)}>{marfilHero ? 'Ver información' : copy('giftsButton', t.giftsButton)}</button></div>
          </section><SectionOrnament prefix="au" side="left" src={ornamentLeft} mirrored={mirrorLeftOrnament} /></>
        )}
        {data.sections.photoUpload && (
          <section className={sectionClass(data.tones.photoUpload)} data-au-section="photoUpload">
            <div className="au-container au-reveal"><h2>{copy('photosTitle', t.photosTitle)}</h2><p>{copy('photosCopy', t.photosCopy)}</p><button className="au-btn" onClick={() => external(data.links.photoUpload)}>{copy('photosButton', t.photosButton)}</button></div>
          </section>
        )}
        {data.sections.social && (
          <><section className={sectionClass(data.tones.social)} data-au-section="social">
            <div className="au-container au-reveal"><h2>{sweetJaneHero ? 'Una gran fiesta junto a vos' : copy('socialTitle', t.socialTitle)}</h2><p>{sweetJaneHero ? 'Subí tus fotos y etiquetame en Instagram.' : copy('socialCopy', t.socialCopy)}</p><p className="au-hashtag">{sweetJaneHero ? '@emma.15' : data.content.hashtag}</p><button className="au-btn au-btn-outline" onClick={() => external(data.links.instagram)}>{copy('socialButton', t.socialButton)}</button></div>
          </section><SectionOrnament prefix="au" side="right" src={ornamentRight} mirrored={mirrorRightOrnament} /></>
        )}
        {data.sections.songSuggestions && (
          <section className={sectionClass(data.tones.songSuggestions)} data-au-section="songSuggestions">
            <div className="au-container au-reveal"><h2>{sweetJaneHero ? '¡Cumple Emma!' : copy('songsTitle', t.songsTitle)}</h2><p>{sweetJaneHero ? '¿Qué canción no puede faltar?' : copy('songsCopy', t.songsCopy)}</p><button className="au-btn" onClick={(event) => openModal('songs', event)}>{copy('songsButton', t.songsButton)}</button>{sweetJaneHero && <div className="au-sweet-playlist"><p>Así va quedando la playlist:</p><iframe title="Playlist de Emma" src="https://open.spotify.com/embed/playlist/19A5kIBEEw2MNgSqqsyOr7?utm_source=generator&theme=0" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /></div>}</div>
          </section>
        )}
        {data.sections.qrPass && (
          <><section className={sectionClass(data.tones.qrPass)} data-au-section="qrPass">
            <div className="au-container au-reveal"><h2>{copy('qrTitle', t.qrTitle)}</h2><p>{copy('qrCopy', t.qrCopy)}</p><button className="au-btn" onClick={(event) => openModal('qr', event)}>{copy('qrButton', t.qrButton)}</button></div>
          </section><SectionOrnament prefix="au" side="left" src={ornamentLeft} mirrored={mirrorLeftOrnament} /></>
        )}
        {data.sections.rsvp && (
          <section className={sectionClass(data.tones.rsvp)} data-au-section="rsvp">
            {eucaliptoHero ? <div className="au-container au-eucalipto-rsvp"><img className="au-reveal" src="/desarrollo/boda/invite_004/assets/icon-rsvp-gd.png" alt="" /><small className="au-reveal">Queremos que nos acompañes</small><h2 className="au-reveal">Confirmá tu asistencia</h2><p className="au-reveal">Por favor, respondé antes del 14 de octubre de 2026.</p>{rsvpState==='success'?<p className="au-eucalipto-success">¡Gracias por confirmar!<br /><small>Tu respuesta quedó registrada para la muestra.</small></p>:<form className="au-form au-eucalipto-rsvp-form au-reveal" onSubmit={(event)=>submit('rsvp',event)}><input name="name" placeholder="Nombre y apellido" required/><select name="attendance" required defaultValue=""><option value="" disabled>¿Vas a asistir?</option><option value="yes">Sí, confirmo mi asistencia</option><option value="no">No podré asistir</option></select><select name="food" value={food} onChange={(event)=>setFood(event.target.value)}><option value="none">Sin restricciones alimentarias</option><option value="celiac">Celíaco/a - sin TACC</option><option value="vegetarian">Vegetariano/a</option><option value="vegan">Vegano/a</option><option value="other">Otra restricción</option></select>{food==='other'&&<input name="otherFood" placeholder="Indicá tu restricción" required/>}<textarea name="message" rows={3} placeholder="Mensaje para los novios (opcional)"/><button className="au-btn" disabled={rsvpState==='loading'}>{rsvpState==='loading'?'…':'Enviar confirmación'}</button></form>}</div> : <div className="au-container au-reveal">{marfilHero && <small>Queremos contar contigo</small>}<h2>{marfilHero ? 'Confirmar asistencia' : copy('rsvpTitle', t.rsvpTitle)}</h2><p>{marfilHero ? 'Por favor, confirmá tu asistencia.' : data.content.rsvpDeadline || t.rsvpDeadline}</p><button className="au-btn" onClick={(event) => openModal('rsvp', event)}>{copy('rsvpButton', t.rsvpButton)}</button></div>}
          </section>
        )}
        {eucaliptoHero && <section className="au-section au-eucalipto-closing" data-au-section="closing"><div className="au-container"><img className="au-reveal" src="/desarrollo/boda/invite_004/assets/icon-heart-gd.png" alt="" /><h2 className="au-reveal">Martín &amp; Sofía</h2><p className="au-reveal">Gracias por ser parte de nuestra historia.<br />¡Te esperamos!</p></div></section>}
      </main>

      {eucaliptoHero ? <footer className="au-footer au-eucalipto-footer"><strong>Save Your Date</strong><p>Invitaciones digitales para momentos inolvidables</p><p>© 2026 Save Your Date · Todos los derechos reservados</p></footer> : oliviaHero ? <footer className="au-footer au-olivia-footer"><img src="/catalog/boda-boho/footer-icon.png" alt="" /><strong>Te esperamos</strong><span>Save Your Date</span></footer> : marfilHero ? <footer className="au-footer au-marfil-footer"><strong>{data.event.name}</strong><p>Invitación creada por <span>Save Your Date</span></p></footer> : <footer className="au-footer"><strong>Save Your Date</strong><p>{t.footer}</p><hr /><p>© {new Date().getFullYear()} Save Your Date · {t.rights}</p></footer>}

      {marfilHero && <button ref={musicButtonRef} className="au-music-float" type="button" aria-label="Música">♪</button>}

      {modal && (
        <div className="au-modal" style={embedded ? { top: modalTop, bottom: 'auto', height: rootRef.current?.clientHeight || '100%' } : undefined} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div ref={modalRef} className="au-modal-box" role="dialog" aria-modal="true" aria-labelledby="au-modal-title">
            <button className="au-modal-close" onClick={closeModal} aria-label={t.close}>
              <span aria-hidden="true">×</span>
            </button>
            {modal === 'dress' && <><h2 id="au-modal-title">{copy('dressTitle', t.dressTitle)}</h2><p>{data.content.dressDetails || t.dressDetails}</p></>}
            {modal === 'hotels' && <><h2 id="au-modal-title">{copy('hotelsTitle', t.hotelsTitle)}</h2>{data.hotels.map((hotel) => <article className="au-hotel" key={hotel.name}><h3>{hotel.name}</h3>{hotel.address && <p>{hotel.address}</p>}{hotel.distance && <p>{hotel.distance}</p>}{hotel.discount && <p>{hotel.discount}</p>}{hotel.notes && <p>{hotel.notes}</p>}{hotel.phone && <a href={`tel:${hotel.phone}`}>{hotel.phone}</a>}{hotel.bookingUrl && <button className="au-btn" onClick={() => external(hotel.bookingUrl)}>Reserva</button>}</article>)}</>}
            {modal === 'gifts' && <><h2 id="au-modal-title">{copy('giftsTitle', t.giftsTitle)}</h2><dl><dt>Banco</dt><dd>{data.gifts.bank}</dd><dt>Titular</dt><dd>{data.gifts.holder}</dd><dt>{data.gifts.currency}</dt><dd>{data.gifts.account}</dd><dt>Alias</dt><dd>{data.gifts.alias}</dd></dl><button className="au-btn" onClick={copyAlias}>{t.copy}</button><p aria-live="polite">{copyStatus}</p>{data.gifts.link && <button className="au-btn au-btn-outline" onClick={() => external(data.gifts.link)}>Lista</button>}</>}
            {modal === 'qr' && <><h2 id="au-modal-title">{copy('qrTitle', t.qrTitle)}</h2>{qr ? <img className="au-qr" src={qr} alt={copy('qrTitle', t.qrTitle)} /> : <p>{t.error}</p>}</>}
            {modal === 'lightbox' && <><h2 id="au-modal-title" className="au-visually-hidden">{copy('galleryTitle', t.galleryTitle)}</h2><img className="au-lightbox" src={gallery[lightbox]?.src} alt={gallery[lightbox]?.alt} /></>}
            {modal === 'songs' && <><h2 id="au-modal-title">{copy('songsTitle', t.songsTitle)}</h2>{songState === 'success' ? <p aria-live="polite">{t.songSuccess}</p> : <form className="au-form" onSubmit={(event) => submit('song', event)}><label>{t.name}<input name="name" required /></label><label>{t.song}<input name="song" required /></label><button className="au-btn" disabled={songState === 'loading'}>{songState === 'loading' ? '…' : t.send}</button>{songState === 'error' && <p aria-live="polite">{t.error} <button type="submit">{t.retry}</button></p>}</form>}</>}
            {modal === 'rsvp' && <><h2 id="au-modal-title">{copy('rsvpTitle', t.rsvpTitle)}</h2>{rsvpState === 'success' ? <p aria-live="polite">{t.success}</p> : <form className="au-form" onSubmit={(event) => submit('rsvp', event)}><label>{t.name}<input name="name" required /></label><label>{t.attendance}<select name="attendance" required defaultValue=""><option value="" disabled>{t.attendanceOptions[0]}</option><option value="yes">{t.attendanceOptions[1]}</option><option value="no">{t.attendanceOptions[2]}</option></select></label><label>{t.food}<select name="food" value={food} onChange={(event) => setFood(event.target.value)}>{['none', 'celiac', 'vegetarian', 'vegan', 'other'].map((value, index) => <option key={value} value={value}>{t.foodOptions[index]}</option>)}</select></label>{food === 'other' && <label>{t.otherFood}<input name="otherFood" required /></label>}<label>{t.message}<textarea name="message" /></label><button className="au-btn" disabled={rsvpState === 'loading'}>{rsvpState === 'loading' ? '…' : t.submit}</button>{rsvpState === 'error' && <p aria-live="polite">{t.error} <button type="submit">{t.retry}</button></p>}</form>}</>}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionOrnament({ prefix, side, src, mirrored = false }:{ prefix:string; side:'left'|'right'; src:string; mirrored?:boolean }) {
  if (!src) return null;
  return <div className={`${prefix}-section-ornament ${side}${mirrored ? ' is-mirrored' : ''}`} aria-hidden="true"><img src={src} alt="" loading="lazy" /></div>;
}
