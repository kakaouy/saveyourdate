import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { DEFAULT_CONFIG, DICTIONARIES, PALETTES } from './config';
import type { VarezziaConfig, VarezziaLocale, VarezziaPalette } from './config';
import './varezzia.css';

type ModalName = 'map' | 'dress' | 'hotels' | 'gifts' | 'songs' | 'qr' | 'rsvp' | 'lightbox';
type Props = { locale:VarezziaLocale; palette:VarezziaPalette; embedded?:boolean; onClose?:()=>void; config?:Partial<VarezziaConfig> };

export function VarezziaInvitation({ locale, palette, embedded=false, onClose, config }:Props) {
  const t = DICTIONARIES[locale];
  const data = useMemo(() => ({ ...DEFAULT_CONFIG, ...config, event:{...DEFAULT_CONFIG.event,...config?.event}, links:{...DEFAULT_CONFIG.links,...config?.links}, gifts:{...DEFAULT_CONFIG.gifts,...config?.gifts}, content:{...DEFAULT_CONFIG.content,...config?.content}, songSuggestions:{...DEFAULT_CONFIG.songSuggestions,...config?.songSuggestions}, qrPass:{...DEFAULT_CONFIG.qrPass,...config?.qrPass}, assets:{...DEFAULT_CONFIG.assets,...config?.assets}, theme:{...DEFAULT_CONFIG.theme,...config?.theme}, sections:{...DEFAULT_CONFIG.sections,...config?.sections}, metadata:{...DEFAULT_CONFIG.metadata,...config?.metadata} }), [config]);
  const [loaded,setLoaded] = useState(false); const [modal,setModal] = useState<ModalName|null>(null); const [lightbox,setLightbox] = useState(0);
  const [countdown,setCountdown] = useState([0,0,0,0]); const [copyStatus,setCopyStatus] = useState(''); const [food,setFood] = useState('none');
  const [rsvpState,setRsvpState] = useState<'idle'|'loading'|'success'|'error'>('idle'); const [songState,setSongState] = useState<'idle'|'loading'|'success'|'error'>('idle'); const [qr,setQr] = useState('');
  const modalRef = useRef<HTMLDivElement>(null); const triggerRef = useRef<HTMLElement|null>(null);
  const invitationRef = useRef<HTMLDivElement>(null); const parallaxRef = useRef<HTMLElement>(null); const parallaxImageRef = useRef<HTMLDivElement>(null);
  const colors = PALETTES[palette];
  const cssVars = {
    '--color-fondo':colors.fondo, '--color-fondo-alterno':colors.alterno, '--color-titulos':colors.titulos,
    '--color-secundario':colors.secundario, '--color-acento':colors.acento, '--color-texto':colors.texto,
    '--color-botones':colors.botones, '--color-bordes':colors.bordes, '--color-ornamentos':colors.ornamentos,
    '--color-texto-claro':colors.claro, '--color-foco':colors.foco, '--color-principal':colors.titulos,
    '--font-title':`"${data.theme.titleFont}", cursive`, '--font-body':`"${data.theme.bodyFont}", sans-serif`,
    '--font-signature':`"${data.theme.signatureFont}", cursive`, '--hero-image':`url("${data.assets.hero}")`,
    '--parallax-image':`url("${data.assets.parallax}")`, '--hero-position-mobile':data.assets.heroPositionMobile,
    '--hero-position-desktop':data.assets.heroPositionDesktop, '--image-overlay-opacity':data.assets.heroOverlay
  } as React.CSSProperties;

  useEffect(() => { const safety=window.setTimeout(()=>setLoaded(true),2600); const ready=window.setTimeout(()=>setLoaded(true),450); return()=>{clearTimeout(safety);clearTimeout(ready)} },[]);
  useEffect(() => { const update=()=>{ const delta=Math.max(0,new Date(data.event.dateTime).getTime()-Date.now()); setCountdown([Math.floor(delta/86400000),Math.floor(delta/3600000)%24,Math.floor(delta/60000)%60,Math.floor(delta/1000)%60]) }; update(); const id=setInterval(update,1000); return()=>clearInterval(id) },[data.event.dateTime]);
  useEffect(() => { QRCode.toDataURL(data.qrPass.value,{ width:240, margin:2, color:{dark:colors.texto,light:colors.claro} }).then(setQr).catch(()=>setQr('')) },[data.qrPass.value,colors.texto,colors.claro]);
  useEffect(() => { document.title=data.metadata.title||`${t.eventType} · ${data.event.name}`; const meta=document.querySelector<HTMLMetaElement>('meta[name="description"]'); if(meta)meta.content=data.metadata.description||t.quote.replace(/[“”]/g,''); },[data.metadata,data.event.name,t]);
  useEffect(() => { const nodes=[...document.querySelectorAll<HTMLElement>('.varezzia .vz-reveal')]; if(!('IntersectionObserver' in window)){nodes.forEach(n=>n.classList.add('visible'));return} const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1}); nodes.forEach(n=>io.observe(n)); return()=>io.disconnect() },[]);
  useEffect(() => {
    const scroller=invitationRef.current, section=parallaxRef.current, image=parallaxImageRef.current;
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(!scroller||!section||!image||reduceMotion.matches)return;
    let frame=0;
    const update=()=>{frame=0;const sectionRect=section.getBoundingClientRect();const scrollerRect=scroller.getBoundingClientRect();const viewportHeight=scroller.clientHeight;const progress=(scrollerRect.top+viewportHeight/2-(sectionRect.top+sectionRect.height/2))/(viewportHeight+sectionRect.height);const offset=Math.max(-70,Math.min(70,progress*140));image.style.setProperty('--parallax-y',`${offset.toFixed(2)}px`)};
    const requestUpdate=()=>{if(!frame)frame=requestAnimationFrame(update)};
    update();scroller.addEventListener('scroll',requestUpdate,{passive:true});window.addEventListener('resize',requestUpdate);
    return()=>{scroller.removeEventListener('scroll',requestUpdate);window.removeEventListener('resize',requestUpdate);if(frame)cancelAnimationFrame(frame)};
  },[]);
  useEffect(() => { if(!modal)return; document.body.classList.add('vz-modal-open'); const box=modalRef.current; const focusable=()=>[...(box?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]')||[])].filter(el=>!el.hasAttribute('disabled')); focusable()[0]?.focus(); const key=(e:KeyboardEvent)=>{if(e.key==='Escape')closeModal();if(e.key==='Tab'){const f=focusable();if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}; document.addEventListener('keydown',key); return()=>{document.removeEventListener('keydown',key);document.body.classList.remove('vz-modal-open')} },[modal]);
  const openModal=(name:ModalName,e:React.MouseEvent<HTMLElement>)=>{triggerRef.current=e.currentTarget;setModal(name)}; const closeModal=()=>{setModal(null);setTimeout(()=>triggerRef.current?.focus(),0)};
  const fmt=(withTime=false)=>{const opts:Intl.DateTimeFormatOptions={weekday:'long',day:'numeric',month:'long',timeZone:data.event.timezone};if(withTime)Object.assign(opts,{hour:'2-digit',minute:'2-digit',hour12:locale==='en'});const value=new Intl.DateTimeFormat(t.region,opts).format(new Date(data.event.dateTime));return value[0].toUpperCase()+value.slice(1)};
  const external=(url?:string)=>url?window.open(url,'_blank','noopener,noreferrer'):window.alert(t.missingLink);
  const calendar=()=>{const clean=(date:string)=>new Date(date).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const esc=(v:string)=>v.replace(/[\\;,]/g,m=>`\\${m}`);const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Save Your Date//Varezzia//EN','BEGIN:VEVENT',`DTSTART:${clean(data.event.dateTime)}`,`DTEND:${clean(data.event.endDateTime)}`,`SUMMARY:${esc(data.event.calendarTitle)}`,`LOCATION:${esc(`${data.event.venue}, ${data.event.address}`)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));const a=document.createElement('a');a.href=url;a.download='varezzia.ics';a.click();URL.revokeObjectURL(url)};
  const submitRsvp=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setRsvpState('loading');const payload=Object.fromEntries(new FormData(e.currentTarget));try{if(data.links.rsvpEndpoint){const res=await fetch(data.links.rsvpEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!res.ok)throw new Error()}else await new Promise(resolve=>setTimeout(resolve,700));setRsvpState('success')}catch{setRsvpState('error')}};
  const songs = locale==='es'
    ? {title:'Sugerí una canción',copy:'¿Qué canción no puede faltar?',button:'Sugerir canción',song:'Canción o link',artist:'Artista',guest:'Tu nombre',submit:'Enviar sugerencia',loading:'Enviando...',success:'¡Gracias! Guardamos tu sugerencia.',error:'No pudimos guardar la sugerencia.',retry:'Reintentar'}
    : locale==='pt'
      ? {title:'Sugira uma música',copy:'Qual música não pode faltar?',button:'Sugerir música',song:'Música ou link',artist:'Artista',guest:'Seu nome',submit:'Enviar sugestão',loading:'Enviando...',success:'Obrigado! Salvamos sua sugestão.',error:'Não foi possível salvar a sugestão.',retry:'Tentar novamente'}
      : {title:'Suggest a song',copy:'Which song should be on the playlist?',button:'Suggest a song',song:'Song or link',artist:'Artist',guest:'Your name',submit:'Send suggestion',loading:'Sending...',success:'Thank you! We saved your suggestion.',error:'We could not save the suggestion.',retry:'Try again'};
  const submitSong=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setSongState('loading');const payload=Object.fromEntries(new FormData(e.currentTarget));try{if(data.links.songSuggestionsEndpoint){const response=await fetch(data.links.songSuggestionsEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok)throw new Error()}else await new Promise(resolve=>setTimeout(resolve,700));setSongState('success')}catch{setSongState('error')}};
  const section=(tone:string,title:string,copy:string,children?:React.ReactNode)=><section className={`vz-section vz-${tone} vz-reveal`}><div className="vz-container"><h2>{title}</h2><p>{copy}</p>{children}</div></section>;

  const gallery=data.gallery;
  return <div ref={invitationRef} className={`varezzia${embedded?' vz-embedded':''}`} lang={locale} data-palette={palette} style={cssVars}>
    <a className="vz-skip" href="#varezzia-main">{t.skip}</a>{!embedded&&onClose&&<button className="vz-site-close" onClick={onClose} aria-label={t.close}>×</button>}
    <div className={`vz-loader ${loaded?'hidden':''}`} role="status"><span/><p>{t.loading}</p></div>
    <main id="varezzia-main">
      {data.sections.hero&&<section className="vz-hero"><img src={data.assets.topRight} className="vz-corner top" alt="" aria-hidden="true"/><img src={data.assets.bottomLeft} className="vz-corner bottom" alt="" aria-hidden="true"/><div><p className="vz-name">{data.event.name}</p><p className="vz-date">{fmt()}</p><h1>{data.event.type||t.eventType}</h1></div></section>}
      {data.sections.countdown&&<section className="vz-section vz-light"><div className="vz-container"><small>{t.countdownEyebrow}</small><h2>{t.countdownTitle}</h2>{countdown.some(Boolean)?<div className="vz-countdown" role="timer">{countdown.map((n,i)=><div key={t.units[i]}><strong>{String(n).padStart(2,'0')}</strong><span>{t.units[i]}</span></div>)}</div>:<p>{t.countdownDone}</p>}</div></section>}
      {data.sections.location&&<><Ornament side="right" src={data.assets.ornamentRight}/>{section('accent',t.locationTitle,`${fmt(true)} · ${data.event.venue} · ${data.event.address}`,<div className="vz-buttons"><button className="vz-btn outline" onClick={e=>openModal('map',e)}>{t.map}</button><button className="vz-btn outline" onClick={calendar}>{t.calendar}</button></div>)}</>}
      {data.sections.quote&&<><section className="vz-section vz-light vz-reveal"><p className="vz-quote">{data.content.quote||t.quote}</p></section><Ornament side="left" src={data.assets.ornamentLeft}/></>}
      {data.sections.dressCode&&section('accent',t.dressTitle,t.dressSummary,<button className="vz-btn outline" onClick={e=>openModal('dress',e)}>{t.dressButton}</button>)}
      {data.sections.schedule&&<section className="vz-section vz-light vz-reveal"><div className="vz-container"><h2>{t.scheduleTitle}</h2><div className="vz-schedule">{data.schedule.map((item,i)=><div className="vz-schedule-item" key={`${item.time}-${i}`}><time>{item.time}</time><i/><div><h3>{item.title||t.schedule[i]?.[0]||''}</h3><p>{item.description||t.schedule[i]?.[1]||''}</p></div></div>)}</div></div></section>}
      {data.sections.parallax&&<section ref={parallaxRef} className="vz-parallax"><div ref={parallaxImageRef} className="vz-parallax-image" aria-hidden="true"/><h2>{t.parallax}</h2></section>}
      {data.sections.gallery&&<section className="vz-section vz-accent vz-reveal"><div className="vz-container"><h2>{t.galleryTitle}</h2><p>{t.galleryCopy}</p><div className="vz-gallery">{gallery.map((image,i)=><button key={`${image.src}-${i}`} onClick={e=>{setLightbox(i);openModal('lightbox',e)}} aria-label={`${t.lightbox}: ${image.alt||t.galleryAlts[i]||t.galleryTitle}`}><img src={image.src} alt={image.alt||t.galleryAlts[i]||t.galleryTitle} loading="lazy"/></button>)}</div></div></section>}
      {data.sections.hotels&&<><Ornament side="right" src={data.assets.ornamentRight}/>{section('buttons-tone',t.hotelsTitle,t.hotelsCopy,<button className="vz-btn outline" onClick={e=>openModal('hotels',e)}>{t.hotelsButton}</button>)}</>}
      {data.sections.gifts&&data.gifts.visible&&<>{section('light',t.giftsTitle,t.giftsCopy,<button className="vz-btn" onClick={e=>openModal('gifts',e)}>{t.giftsButton}</button>)}<Ornament side="left" src={data.assets.ornamentLeft}/></>}
      {data.sections.photoUpload&&section('accent',t.photosTitle,t.photosCopy,<button className="vz-btn outline" onClick={()=>external(data.links.photoUpload)}>{t.photosButton}</button>)}
      {data.sections.social&&section('buttons-tone',t.socialTitle,t.socialCopy,<><p className="vz-hashtag">{data.content.hashtag}</p><button className="vz-btn outline" onClick={()=>external(data.links.instagram)}>{t.socialButton}</button></>)}
      {data.sections.songSuggestions&&data.songSuggestions.enabled&&section('light',songs.title,songs.copy,<button className="vz-btn" onClick={e=>openModal('songs',e)}>{songs.button}</button>)}
      {data.sections.qrPass&&<><Ornament side="right" src={data.assets.ornamentRight}/>{section('accent',t.qrTitle,t.qrCopy,<button className="vz-btn outline" onClick={e=>openModal('qr',e)}>{t.qrButton}</button>)}</>}
      {data.sections.rsvp&&section('light',t.rsvpTitle,data.event.rsvpDeadline||t.rsvpDeadline,<button className="vz-btn" onClick={e=>openModal('rsvp',e)}>{t.rsvpButton}</button>)}
    </main>
    <footer className="vz-footer"><strong>Save Your Date</strong><p>{t.footer}</p><hr/><small>© {new Date().getFullYear()} Save Your Date · {t.rights}</small></footer>
    {modal&&<div className="vz-modal" onMouseDown={e=>{if(e.currentTarget===e.target)closeModal()}}><div ref={modalRef} className="vz-modal-box" role="dialog" aria-modal="true" aria-label={modal==='lightbox'?t.lightbox:undefined}><button className="vz-modal-close" onClick={closeModal} aria-label={t.close}>×</button>
      {modal==='map'&&<><h2>{t.mapTitle}</h2><p>{data.event.venue}<br/>{data.event.address}</p><button className="vz-btn" onClick={()=>external(data.links.maps)}>{t.map}</button></>}
      {modal==='dress'&&<><h2>{t.dressTitle}</h2><p>{t.dressDetails}</p></>}
      {modal==='hotels'&&<><h2>{t.hotelsModal}</h2>{data.hotels.length?<ul>{data.hotels.map(h=><li key={h.name}><strong>{h.name}</strong>{h.address&&<> · {h.address}</>}{h.bookingUrl&&<> · <a href={h.bookingUrl} target="_blank" rel="noreferrer">{t.hotelsButton}</a></>}</li>)}</ul>:<p>{t.hotelsEmpty}</p>}</>}
      {modal==='gifts'&&<><h2>{t.giftsModal}</h2><dl><dt>{data.gifts.bank}</dt><dd>{data.gifts.holder}</dd><dd>{data.gifts.currency} · {data.gifts.account}</dd><dd>{data.gifts.alias}</dd></dl><button className="vz-btn" onClick={async()=>{try{await navigator.clipboard.writeText(data.gifts.alias);setCopyStatus(t.copied)}catch{setCopyStatus(`${t.copy}: ${data.gifts.alias}`)}}}>{t.copy}</button><p role="status">{copyStatus}</p></>}
      {modal==='songs'&&<><h2>{songs.title}</h2><form className="vz-form" onSubmit={submitSong}><label>{songs.song}<input name="song" required/></label><label>{songs.artist}<input name="artist"/></label><label>{songs.guest}<input name="guestName" autoComplete="name"/></label><button className="vz-btn" disabled={songState==='loading'}>{songState==='loading'?songs.loading:songs.submit}</button>{songState==='error'&&<button className="vz-btn outline" type="submit">{songs.retry}</button>}<p role="status">{songState==='success'?songs.success:songState==='error'?songs.error:''}</p></form></>}
      {modal==='qr'&&<><h2>{t.qrModal}</h2>{qr?<img className="vz-qr" src={qr} alt={t.qrAlt}/>:<p>{t.error}</p>}</>}
      {modal==='lightbox'&&gallery[lightbox]&&<img className="vz-lightbox" src={gallery[lightbox].src} alt={gallery[lightbox].alt||t.galleryAlts[lightbox]||t.galleryTitle}/>} 
      {modal==='rsvp'&&<><h2>{t.rsvpTitle}</h2><form className="vz-form" onSubmit={submitRsvp}><label>{t.name}<input name="name" autoComplete="name" required/></label><label>{t.attendance}<select name="attendance" required><option value="">{t.attendanceOptions[0]}</option><option value="yes">{t.attendanceOptions[1]}</option><option value="no">{t.attendanceOptions[2]}</option></select></label><label>{t.food}<select name="food" value={food} onChange={e=>setFood(e.target.value)}>{t.foodValues.map((v,i)=><option key={v} value={v}>{t.foodOptions[i]}</option>)}</select></label>{food==='other'&&<label>{t.otherFood}<input name="foodOther" required/></label>}<label>{t.message}<textarea name="message"/></label><button className="vz-btn" disabled={rsvpState==='loading'}>{rsvpState==='loading'?t.loadingState:t.submit}</button>{rsvpState==='error'&&<button className="vz-btn outline" type="submit">{t.retry}</button>}<p role="status">{rsvpState==='success'?t.success:rsvpState==='error'?t.error:''}</p></form></>}
    </div></div>}
  </div>;
}

function Ornament({side,src}:{side:'left'|'right';src:string}) { return <div className={`vz-ornament ${side}`} aria-hidden="true"><img src={src} alt="" loading="lazy"/></div> }
