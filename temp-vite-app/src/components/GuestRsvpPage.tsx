import { useEffect, useState } from 'react';
import '../admin-prototype.css';

type Companion = {
  name: string;
  food: string;
  identificationType: string;
  identificationNumber: string;
};

type RsvpData = {
  event: { title: string; date: string };
  guest: {
    name: string; group: string; seats: number; confirmed: number;
    status: 'Confirmado' | 'Pendiente' | 'No asiste'; food: string; song: string;
    identificationType: string; identificationNumber: string;
    companions: Companion[];
    transportOption: string; transportStop: string; menuChoice: string;
    accessibilityNeeds: string; guestNotes: string;
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
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [transportOption, setTransportOption] = useState('');
  const [transportStop, setTransportStop] = useState('');
  const [menuChoice, setMenuChoice] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
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
        setTransportOption(result.guest.transportOption || '');
        setTransportStop(result.guest.transportStop || '');
        setMenuChoice(result.guest.menuChoice || '');
        setAccessibilityNeeds(result.guest.accessibilityNeeds || '');
        setGuestNotes(result.guest.guestNotes || '');
        setCompanions(Array.from({ length: Math.max(0, (result.guest.confirmed || 1) - 1) }, (_, index) => result.guest.companions?.[index] || {
          name: '', food: '', identificationType: '', identificationNumber: ''
        }));
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
        body: JSON.stringify({ status, confirmed, food, song, identificationType, identificationNumber, companions, transportOption, transportStop, menuChoice, accessibilityNeeds, guestNotes })
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

  const changeConfirmed = (value: number) => {
    setConfirmed(value);
    setCompanions((current) => Array.from({ length: Math.max(0, value - 1) }, (_, index) => current[index] || {
      name: '', food: '', identificationType: '', identificationNumber: ''
    }));
  };

  const updateCompanion = (index: number, changes: Partial<Companion>) => {
    setCompanions((current) => current.map((companion, position) => position === index ? { ...companion, ...changes } : companion));
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
          {status === 'Confirmado' && <label>Personas que asistirán<select value={confirmed} onChange={(event) => changeConfirmed(Number(event.target.value))}>{Array.from({ length: data.guest.seats }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>}
          {status === 'Confirmado' && <label>Restricciones alimentarias<input value={food} onChange={(event) => setFood(event.target.value)} placeholder="Ej. vegetariano, celíaco…" /></label>}
          {status === 'Confirmado' && <label>Canción sugerida<input value={song} onChange={(event) => setSong(event.target.value)} placeholder="Canción — Artista" /></label>}
          {status === 'Confirmado' && <label>Transporte<select value={transportOption} onChange={(event) => setTransportOption(event.target.value)}><option value="">No necesito transporte</option><option value="Ida">Necesito transporte de ida</option><option value="Regreso">Necesito transporte de regreso</option><option value="Ida y regreso">Necesito ida y regreso</option></select></label>}
          {status === 'Confirmado' && transportOption && <label>Parada o zona preferida<input value={transportStop} onChange={(event) => setTransportStop(event.target.value)} placeholder="Ej. Centro, Tres Cruces…" /></label>}
          {status === 'Confirmado' && <label>Preferencia de menú<input value={menuChoice} onChange={(event) => setMenuChoice(event.target.value)} placeholder="Ej. estándar, infantil, vegetariano…" /></label>}
          {status === 'Confirmado' && <label>Accesibilidad o movilidad<input value={accessibilityNeeds} onChange={(event) => setAccessibilityNeeds(event.target.value)} placeholder="Ej. acceso sin escalones, espacio para silla…" /></label>}
          {status === 'Confirmado' && <label>Otra información para la organización<textarea value={guestNotes} onChange={(event) => setGuestNotes(event.target.value)} rows={3} placeholder="Contanos cualquier detalle que debamos considerar" /></label>}
          {status === 'Confirmado' && <label>Tipo de identificación (opcional)<select value={identificationType} onChange={(event) => setIdentificationType(event.target.value)}><option value="">No completar</option><option>CI</option><option>DNI</option><option>CPF</option><option>Pasaporte</option><option>Otro</option></select></label>}
          {status === 'Confirmado' && identificationType && <label>Número de identificación<input value={identificationNumber} onChange={(event) => setIdentificationNumber(event.target.value)} placeholder="Ingresá el número" /></label>}
          {status === 'Confirmado' && companions.map((companion, index) => <fieldset className="companion-card" key={index}>
            <legend>Acompañante {index + 1}</legend>
            <label>Nombre y apellido<input required value={companion.name} onChange={(event) => updateCompanion(index, { name: event.target.value })} /></label>
            <label>Restricciones alimentarias<input value={companion.food} onChange={(event) => updateCompanion(index, { food: event.target.value })} placeholder="Ej. vegetariano, celíaco…" /></label>
            <label>Tipo de identificación (opcional)<select value={companion.identificationType} onChange={(event) => updateCompanion(index, { identificationType: event.target.value, identificationNumber: event.target.value ? companion.identificationNumber : '' })}><option value="">No completar</option><option>CI</option><option>DNI</option><option>CPF</option><option>Pasaporte</option><option>Otro</option></select></label>
            {companion.identificationType && <label>Número de identificación<input value={companion.identificationNumber} onChange={(event) => updateCompanion(index, { identificationNumber: event.target.value })} placeholder="Ingresá el número" /></label>}
          </fieldset>)}
          <button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Confirmar respuesta'}</button>
          {message && <p className="rsvp-message" role="status">{message}</p>}
        </form>
      </>}
    </section>
  </main>;
}
