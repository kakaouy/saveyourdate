import { useEffect, useRef } from 'react';
import { alibiFeedback, type AlibiName } from './alibi-feedback';

export default function FedericaFeedback({ suspect, onClose }: { suspect: AlibiName; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const feedback = alibiFeedback[suspect];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const dialog = ref.current;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="federica-feedback" aria-labelledby="federica-feedback-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="federica-coach-layout">
      <img className="federica-coach-cutout" src="/los-archivos-f/images/federica-ayuda.png" alt="Federica, con su expediente confidencial" />
      <div className="federica-speech">
        <button className="coach-close" onClick={onClose} aria-label="Cerrar mensaje de Federica">×</button>
        <p className="eyebrow">TRANSMISIÓN DE LA AGENCIA F</p>
        <h2 id="federica-feedback-title">Revisemos esa hipótesis.</h2>
        <p className="coach-subject">Sobre la coartada de {suspect}</p>
        <blockquote>{feedback.text}</blockquote>
        <audio controls preload="none" src={`/los-archivos-f/audio/federica-ayuda-${feedback.id}.wav`} aria-label="Escuchar la orientación de Federica" />
        <small>Voz sintética provisoria · También podés leer el mensaje.</small>
        <p className="coach-progress">Tu progreso sigue guardado. Esta orientación no consume pistas.</p>
        <button className="primary-button" onClick={onClose} autoFocus>VOLVER A REVISAR LAS COARTADAS <span>↗</span></button>
      </div>
    </div>
  </dialog>;
}
