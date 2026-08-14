import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { DEFAULT_AURORA_CONFIG, type AuroraConfig, type AuroraLocale, type AuroraPaletteTokens } from '../aurora/config';
import './noir.css';

type Props = {
  locale: AuroraLocale;
  embedded?: boolean;
  config?: Partial<AuroraConfig>;
  paletteTokens: AuroraPaletteTokens;
  sectionOrder?: string[];
};

const copy = {
  es: { wedding:'Nos casamos', discover:'Deslizá para descubrir', less:'Falta cada vez menos...', countdown:'Cuenta regresiva', ceremony:'Ceremonia', celebration:'Celebración', directions:'Cómo llegar', quote:'Elegimos caminar juntos', details:'Detalles de la celebración', prepared:'Todo preparado para compartir', dress:'Dress code', dressText:'Elegante · Black & white', gifts:'Regalos', giftsText:'Tu presencia es nuestro mejor regalo', giftButton:'Ver datos', save:'Agendalo', story:'Nuestra historia', moments:'Instantes que elegimos guardar', menu:'Menú', night:'Una noche para disfrutar', food:'Si tenés alguna restricción alimentaria, opción vegetariana, vegana o sin TACC, indicalo al confirmar tu asistencia.', join:'Queremos que nos acompañes', confirm:'Confirmá tu asistencia', deadline:'Por favor, respondé antes del 10 de septiembre de 2026.', send:'Enviar confirmación', thanks:'¡Gracias por confirmar!', closing:'Gracias por ser parte de nuestra historia', closingText:'Nos emociona compartir este día con ustedes.', units:['Días','Horas','Minutos','Segundos'] },
  en: { wedding:'We are getting married', discover:'Scroll to discover', less:'The wait is getting shorter...', countdown:'Countdown', ceremony:'Ceremony', celebration:'Celebration', directions:'Get directions', quote:'We chose to walk through life together', details:'Celebration details', prepared:'Everything prepared to share', dress:'Dress code', dressText:'Formal · Black & white', gifts:'Gifts', giftsText:'Your presence is our greatest gift', giftButton:'View details', save:'Save the date', story:'Our story', moments:'Moments we chose to keep', menu:'Menu', night:'A night to enjoy', food:'Please share any dietary restrictions when confirming.', join:'We hope you can join us', confirm:'Confirm your attendance', deadline:'Please reply by September 10, 2026.', send:'Send confirmation', thanks:'Thank you for confirming!', closing:'Thank you for being part of our story', closingText:'We are excited to share this day with you.', units:['Days','Hours','Minutes','Seconds'] },
  pt: { wedding:'Vamos nos casar', discover:'Deslize para descobrir', less:'Falta cada vez menos...', countdown:'Contagem regressiva', ceremony:'Cerimônia', celebration:'Celebração', directions:'Como chegar', quote:'Escolhemos caminhar juntos', details:'Detalhes da celebração', prepared:'Tudo preparado para compartilhar', dress:'Dress code', dressText:'Elegante · Black & white', gifts:'Presentes', giftsText:'Sua presença é o nosso maior presente', giftButton:'Ver dados', save:'Reserve a data', story:'Nossa história', moments:'Momentos que escolhemos guardar', menu:'Menu', night:'Uma noite para aproveitar', food:'Informe qualquer restrição alimentar ao confirmar.', join:'Queremos você conosco', confirm:'Confirme sua presença', deadline:'Por favor, responda até 10 de setembro de 2026.', send:'Enviar confirmação', thanks:'Obrigado por confirmar!', closing:'Obrigado por fazer parte da nossa história', closingText:'Estamos felizes em compartilhar este dia com vocês.', units:['Dias','Horas','Minutos','Segundos'] }
} as const;

export function NoirInvitation({ locale, embedded = false, config, paletteTokens, sectionOrder }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<{ context: AudioContext; oscillators: OscillatorNode[] } | null>(null);
  const [modal, setModal] = useState<'gifts' | null>(null);
  const [sent, setSent] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const data = useMemo<AuroraConfig>(() => ({
    ...DEFAULT_AURORA_CONFIG,
    ...config,
    event: { ...DEFAULT_AURORA_CONFIG.event, ...config?.event },
    content: { ...DEFAULT_AURORA_CONFIG.content, ...config?.content },
    assets: { ...DEFAULT_AURORA_CONFIG.assets, ...config?.assets },
    links: { ...DEFAULT_AURORA_CONFIG.links, ...config?.links },
    gifts: { ...DEFAULT_AURORA_CONFIG.gifts, ...config?.gifts },
    sections: { ...DEFAULT_AURORA_CONFIG.sections, ...config?.sections },
    tones: { ...DEFAULT_AURORA_CONFIG.tones, ...config?.tones },
    metadata: { ...DEFAULT_AURORA_CONFIG.metadata, ...config?.metadata },
    gallery: config?.gallery ?? DEFAULT_AURORA_CONFIG.gallery,
    schedule: config?.schedule ?? DEFAULT_AURORA_CONFIG.schedule
  }), [config]);
  const t = copy[locale];
  const eventDate = useMemo(() => new Date(data.event.dateTime), [data.event.dateTime]);
  const [countdown, setCountdown] = useState([0,0,0,0]);
  const names = data.event.name.split(/\s*&\s*/);
  const gallery = data.gallery.length ? data.gallery : [1,3,4].map(n => ({ src:`/desarrollo/boda/invite_005/assets/photo-0${n}.jpg`, alt:data.event.name }));
  const sections = data.sections;
  const branch = '/desarrollo/boda/invite_005/assets/branch-white.png';
  const dateLabel = `${String(eventDate.getDate()).padStart(2,'0')} · ${String(eventDate.getMonth()+1).padStart(2,'0')} · ${eventDate.getFullYear()}`;
  const month = eventDate.toLocaleDateString(locale === 'es' ? 'es-UY' : locale, { month:'long' });

  useEffect(() => {
    const update = () => { const gap=Math.max(0,eventDate.getTime()-Date.now()); setCountdown([Math.floor(gap/86400000),Math.floor(gap/3600000)%24,Math.floor(gap/60000)%60,Math.floor(gap/1000)%60]); };
    update(); const timer=window.setInterval(update,1000); return()=>window.clearInterval(timer);
  }, [eventDate]);

  useEffect(() => {
    const root=rootRef.current; if(!root) return;
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.08});
    root.querySelectorAll('.noir-section').forEach(section=>observer.observe(section)); return()=>observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const photo = root?.querySelector<HTMLElement>('.noir-photo-break img');
    const section = root?.querySelector<HTMLElement>('.noir-photo-break');
    if (!root || !photo || !section) return;
    let frame = 0;
    const move = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rootBox = root.getBoundingClientRect();
        const box = section.getBoundingClientRect();
        const progress = (box.top + box.height / 2 - (rootBox.top + rootBox.height / 2)) / (rootBox.height + box.height);
        photo.style.setProperty('--noir-parallax-y', `${Math.max(-72, Math.min(72, progress * -150))}px`);
      });
    };
    move();
    root.addEventListener('scroll', move, { passive: true });
    return () => { cancelAnimationFrame(frame); root.removeEventListener('scroll', move); };
  }, [sections.parallax]);

  const style = {
    '--noir-gold': paletteTokens.botones,
    '--noir-smoke': paletteTokens.acento,
    '--noir-smoke-dark': paletteTokens.acentoOscuro
  } as CSSProperties;

  const preferredOrder = ['hero','countdown','location','parallax','dressCode','gallery','schedule','rsvp','closing'];
  const order = [...preferredOrder, ...(sectionOrder || []).filter((id) => !preferredOrder.includes(id))];
  const rank=(id:string)=>{ const index=order.indexOf(id); return index < 0 ? order.length + (id === 'closing' ? 2 : 1) : index; };
  const submit=(event:FormEvent)=>{event.preventDefault();setSent(true)};
  const calendar=()=>{const blob=new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${eventDate.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}\nSUMMARY:${data.event.calendarTitle}\nEND:VEVENT\nEND:VCALENDAR`],{type:'text/calendar'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='boda-renata-nicolas.ics';a.click();URL.revokeObjectURL(a.href)};
  const toggleMusic = () => {
    if (musicRef.current) {
      musicRef.current.oscillators.forEach((oscillator) => oscillator.stop());
      void musicRef.current.context.close();
      musicRef.current = null;
      setMusicPlaying(false);
      return;
    }
    const context = new AudioContext();
    const master = context.createGain();
    const pulse = context.createOscillator();
    const pulseDepth = context.createGain();
    master.gain.value = 0.018;
    pulse.frequency.value = 0.085;
    pulseDepth.gain.value = 0.008;
    pulse.connect(pulseDepth).connect(master.gain);
    master.connect(context.destination);
    const oscillators = [261.63, 329.63, 392].map((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(master);
      oscillator.start();
      return oscillator;
    });
    pulse.start();
    musicRef.current = { context, oscillators: [...oscillators, pulse] };
    setMusicPlaying(true);
  };

  useEffect(() => () => {
    musicRef.current?.oscillators.forEach((oscillator) => oscillator.stop());
    if (musicRef.current) void musicRef.current.context.close();
  }, []);

  return <div ref={rootRef} className={`noir ${embedded ? 'noir-embedded' : ''}`} style={style}>
    <main className="noir-main">
      {sections.hero && <section className="noir-section noir-hero" data-noir-section="hero" style={{order:rank('hero')}}>
        <img className="noir-hero-photo" src="/desarrollo/boda/invite_005/assets/photo-01.jpg" alt={data.event.name}/><div className="noir-veil"/>
        <div className="noir-content noir-hero-copy"><p className="noir-eyebrow">{t.wedding}</p><h1>{names.map((name,index)=><span key={name}>{index>0&&<i>&amp;</i>}{name}</span>)}</h1><p className="noir-date">{dateLabel}</p></div>
        <img className="noir-branch noir-hero-boundary-branch" src={branch} alt=""/><span className="noir-scroll">{t.discover} ↓</span>
      </section>}
      {sections.countdown && <section className="noir-section noir-gold noir-boundary" data-noir-section="countdown" style={{order:rank('countdown')}}><div className="noir-content"><p className="noir-eyebrow">{t.less}</p><h2>{t.countdown}</h2><div className="noir-countdown">{countdown.map((value,index)=><div key={t.units[index]}><strong>{String(value).padStart(2,'0')}</strong><span>{t.units[index]}</span></div>)}</div></div></section>}
      {sections.location && <section className="noir-section noir-paper" data-noir-section="location" style={{order:rank('location')}}><div className="noir-events">
        <article><div className="noir-line-icon">◎</div><p className="noir-eyebrow">{t.ceremony}</p><h3>Basílica del<br/>Santísimo Sacramento</h3><p>San Martín 1035, Buenos Aires<br/>18:30 horas</p><button className="noir-btn" onClick={()=>window.open(data.links.maps,'_blank','noopener')}>{t.directions}</button></article>
        <article><div className="noir-line-icon">♢</div><p className="noir-eyebrow">{t.celebration}</p><h3>Palacio Sans Souci</h3><p>Paz 705, Victoria<br/>20:30 horas</p><button className="noir-btn" onClick={()=>window.open(data.links.maps,'_blank','noopener')}>{t.directions}</button></article>
      </div></section>}
      {sections.parallax && <section className="noir-section noir-photo-break" data-noir-section="parallax" style={{order:rank('parallax')}}><img src="/desarrollo/boda/invite_005/assets/photo-02.jpg" alt={data.event.name}/><p>{t.quote}</p></section>}
      {sections.dressCode && <section className="noir-section noir-dark" data-noir-section="dressCode" style={{order:rank('dressCode')}}><div className="noir-content"><p className="noir-eyebrow">{t.details}</p><h2>{t.prepared}</h2><div className="noir-details"><article><div className="noir-line-icon">◇</div><h3>{t.dress}</h3><p>{t.dressText}</p></article><article><div className="noir-line-icon">♧</div><h3>{t.gifts}</h3><p>{t.giftsText}</p><button className="noir-btn" onClick={()=>setModal('gifts')}>{t.giftButton}</button></article><article><div className="noir-line-icon">▣</div><h3>{t.save}</h3><p>{eventDate.getDate()} {locale==='es'?'de ':''}{month} {locale==='es'?'de ':''}{eventDate.getFullYear()}</p><button className="noir-btn" onClick={calendar}>{t.save}</button></article></div></div></section>}
      {sections.gallery && <section className="noir-section noir-paper noir-boundary" data-noir-section="gallery" style={{order:rank('gallery')}}><img className="noir-branch noir-branch-left" src={branch} alt=""/><div className="noir-content"><p className="noir-eyebrow">{t.story}</p><h2>{t.moments}</h2><div className="noir-gallery">{gallery.slice(0,3).map((photo,index)=><img key={`${photo.src}-${index}`} src={photo.src} alt={photo.alt||data.event.name}/>)}</div></div></section>}
      {sections.schedule && <section className="noir-section noir-gold" data-noir-section="schedule" style={{order:rank('schedule')}}><div className="noir-content"><div className="noir-line-icon">♧</div><p className="noir-eyebrow">{t.menu}</p><h2>{t.night}</h2><p className="noir-copy">{t.food}</p></div></section>}
      {sections.rsvp && <section className="noir-section noir-paper noir-boundary" data-noir-section="rsvp" style={{order:rank('rsvp')}}><img className="noir-branch noir-branch-right" src={branch} alt=""/><div className="noir-content"><div className="noir-line-icon">✉</div><p className="noir-eyebrow">{t.join}</p><h2>{t.confirm}</h2><p className="noir-copy">{t.deadline}</p>{sent?<p className="noir-thanks">{t.thanks}</p>:<form className="noir-rsvp" onSubmit={submit}><input required placeholder="Nombre y apellido"/><select required defaultValue=""><option value="" disabled>¿Vas a asistir?</option><option>Sí, confirmo mi asistencia</option><option>No podré asistir</option></select><select><option>Sin restricciones alimentarias</option><option>Vegetariano/a</option><option>Vegano/a</option><option>Celíaco/a - sin TACC</option></select><textarea rows={3} placeholder="Mensaje para los novios (opcional)"/><button className="noir-btn" type="submit">{t.send}</button></form>}</div></section>}
      <section className="noir-section noir-dark noir-closing noir-boundary" data-noir-section="closing" style={{order:rank('closing')}}><img className="noir-branch noir-branch-left noir-branch-gold" src={branch} alt=""/><div className="noir-content"><p className="noir-eyebrow">{t.closing}</p><h2>{names.map((name,index)=><span key={name}>{index>0&&<i>&amp;</i>}{name}</span>)}</h2><p className="noir-copy">{t.closingText}</p></div></section>
    </main>
    <footer className="noir-footer"><strong>Save Your Date</strong><p>Invitaciones digitales para momentos inolvidables · © 2026</p></footer>
    {sections.songSuggestions && <button className={`noir-music ${musicPlaying ? 'is-playing' : ''}`} type="button" aria-label={musicPlaying ? 'Pausar música' : 'Reproducir música'} aria-pressed={musicPlaying} onClick={toggleMusic}>♫</button>}
    {modal==='gifts'&&<div className="noir-modal" role="dialog" aria-modal="true" aria-label={t.gifts}><div><button aria-label="Cerrar" onClick={()=>setModal(null)}>×</button><h2>{t.gifts}</h2><p>Alias: RENATA.NICO.2026</p></div></div>}
  </div>;
}
