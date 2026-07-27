import { useEffect, useState } from 'react';
import '../admin-prototype.css';

type RsvpData = {
  event: { title: string; date: string };
  guest: {
    name: string; group: string; seats: number; confirmed: number;
    status: 'Confirmado' | 'Pendiente' | 'No asiste'; food: string; song: string;
    identificationType: string; identificationNumber: string;
  };
};

export default function GuestRsvpPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [data, setData] = useState<RsvpData | null>(null);
  const [status, setStatus] = useState<'Confirmado' | 'No asiste'>('Confirmado');
  const [confirmed, setConfirmed] = useState(1);
  const [food, setFood] = useState('');
  const [song, setSong] = useState('');
  const [identificationType, setIdentificationType] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/rsvp?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const result = await response.json() as RsvpData & { error?: string };
        if (!response.ok) throw new Error(result.error || 'No pudimos abrir la invitación.');
        setData(result);
        setStatus(result.guest.status === 'No asiste' ? 'No asiste' : 'Confirmado');
        setConfirmed(result.guest.confirmed || 1);
        setFood(result.guest.food === '—' || result.guest.food === 'Ninguna' ? '' : result.guest.food);
        setSong(result.guest.song === '—' ? '' : result.guest.song);
        setIdentificationType(result.guest.identificationType || '');
        setIdentificationNumber(result.guest.identificationNumber || '');
      })
      .catch((error: Error) => setMessage(error.message));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/rsvp?token=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, confirmed, food, song, identificationType, identificationNumber })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No pudimos guardar tu respuesta.');
      setMessage('¡Gracias! Tu confirmación quedó guardada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos guardar tu respuesta.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="rsvp-shell">
    <section className="rsvp-card">
      <img src="/logo.svg" alt="Save Your Date" />
      {!data ? <p role="status">{message || 'Cargando invitación…'}</p> : <>
        <span className="eyebrow">{data.event.date || 'Próximo evento'}</span>
        <h1>{data.event.title}</h1>
        <p>Hola, <strong>{data.guest.name}</strong>. Confirmá tu asistencia y completá tus preferencias.</p>
        <form onSubmit={submit}>
          <label>¿Vas a asistir?<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="Confirmado">Sí, voy a asistir</option><option value="No asiste">No podré asistir</option></select></label>
          {status === 'Confirmado' && <label>Personas que asistirán<select value={confirmed} onChange={(event) => setConfirmed(Number(event.target.value))}>{Array.from({ length: data.guest.seats }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>}
          {status === 'Confirmado' && <label>Restricciones alimentarias<input value={food} onChange={(event) => setFood(event.target.value)} placeholder="Ej. vegetariano, celíaco…" /></label>}
          {status === 'Confirmado' && <label>Canción sugerida<input value={song} onChange={(event) => setSong(event.target.value)} placeholder="Canción — Artista" /></label>}
          {status === 'Confirmado' && <label>Tipo de identificación (opcional)<select value={identificationType} onChange={(event) => setIdentificationType(event.target.value)}><option value="">No completar</option><option>CI</option><option>DNI</option><option>CPF</option><option>Pasaporte</option><option>Otro</option></select></label>}
          {status === 'Confirmado' && identificationType && <label>Número de identificación<input value={identificationNumber} onChange={(event) => setIdentificationNumber(event.target.value)} placeholder="Ingresá el número" /></label>}
          <button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Confirmar respuesta'}</button>
          {message && <p className="rsvp-message" role="status">{message}</p>}
        </form>
      </>}
    </section>
  </main>;
}
