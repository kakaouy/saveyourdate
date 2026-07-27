
import React, { useEffect, useMemo, useState } from "react";
import "../admin-prototype.css";

type Guest = {
  id: string;
  name: string;
  group: string;
  phone: string;
  seats: number;
  confirmed: number;
  status: "Confirmado" | "Pendiente" | "No asiste";
  food: string;
  song: string;
  reminded: string;
};

type AdminOrder = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  eventTitle: string;
  eventDate: string;
  eventType: string;
};

const guestsSeed: Guest[] = [];

const formatEventDate = (value: string) => {
  if (!value) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
};

const initials = (value: string) =>
  value.split(/\s+|&/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const nav = [
  ["Resumen", "⌂"],
  ["Invitados", "♙"],
  ["Confirmaciones", "✓"],
  ["Restricciones", "◇"],
  ["Canciones", "♫"],
  ["Recordatorios", "↗"],
  ["Mesas", "▦"],
  ["Accesos", "♢"],
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <img src="/logo.svg" alt="Save Your Date" />
      {!compact && <span>Panel de administración</span>}
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [contact, setContact] = useState<"email" | "whatsapp">("email");
  const [orderNumber, setOrderNumber] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const copySupportEmail = async () => {
    await navigator.clipboard.writeText("hola@saveyourdate.site");
    setEmailCopied(true);
  };

  const requestCode = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contact: contactValue })
      });
      const result = await response.json() as { challengeId?: string; maskedEmail?: string; error?: string };
      if (!response.ok || !result.challengeId) throw new Error(result.error || "No pudimos enviar el código.");
      setChallengeId(result.challengeId);
      setMaskedEmail(result.maskedEmail || "");
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos enviar el código.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos validar el código.");
      onLogin();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "No pudimos validar el código.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="story-orb story-orb-one" />
        <div className="story-orb story-orb-two" />
        <Logo />
        <div className="story-copy">
          <span className="eyebrow">Tu evento, bajo control</span>
          <h1>Todo listo para disfrutar el gran día.</h1>
          <p>Gestioná invitados, confirmaciones y cada detalle desde un único lugar.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="mobile-login-logo"><Logo compact /></div>
        <div className="login-card">
          <div className="login-step">Paso {step === "credentials" ? "1 de 2" : "2 de 2"}</div>
          {step === "credentials" ? (
            <>
              <h2>Ingresá a tu evento</h2>
              <p className="muted">Usá los datos asociados a tu pedido.</p>
              <label>
                Número de pedido
                <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Ej. SYD-ABCD-1234" aria-label="Número de pedido" />
              </label>
              <div className="segmented" aria-label="Tipo de contacto">
                <button className={contact === "email" ? "active" : ""} onClick={() => setContact("email")}>Email</button>
                <button className={contact === "whatsapp" ? "active" : ""} onClick={() => setContact("whatsapp")}>WhatsApp</button>
              </div>
              <label>
                {contact === "email" ? "Email registrado" : "WhatsApp registrado"}
                <input value={contactValue} onChange={(event) => setContactValue(event.target.value)} placeholder={contact === "email" ? "nombre@ejemplo.com" : "099 123 456"} aria-label="Contacto registrado" />
              </label>
              {error && <p className="login-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy || !orderNumber || !contactValue} onClick={requestCode}>{busy ? "Enviando…" : "Continuar"} <span>→</span></button>
              <p className="security-note"><span>✓</span> Tus datos están protegidos y nunca compartimos la planilla.</p>
            </>
          ) : (
            <>
              <button className="back-link" onClick={() => setStep("credentials")}>← Volver</button>
              <h2>Revisá tu email</h2>
              <p className="muted">Enviamos un código de seguridad a <strong>{maskedEmail}</strong>.</p>
              <label>
                Código de 6 dígitos
                <input className="code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} aria-label="Código de seguridad" />
              </label>
              <div className="code-meta"><span>Vence en 10 minutos</span><button disabled={busy} onClick={requestCode}>Reenviar código</button></div>
              {error && <p className="login-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy || code.length !== 6} onClick={verifyCode}>{busy ? "Validando…" : "Ingresar a mi evento"} <span>→</span></button>
              <p className="security-note"><span>✓</span> La sesión permanecerá activa durante 24 horas.</p>
            </>
          )}
          <button className="help-link" type="button" onClick={() => setShowHelp(true)}>¿Necesitás ayuda con tu acceso?</button>
        </div>
      </section>
      {showHelp && (
        <div className="modal-backdrop" onMouseDown={() => setShowHelp(false)}>
          <div className="modal access-help-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowHelp(false)} aria-label="Cerrar ayuda">×</button>
            <span className="eyebrow">Ayuda de acceso</span>
            <h2>¿No podés ingresar?</h2>
            <p>Encontrás el número de pedido en el email de confirmación de Save Your Date. Ingresá también el mismo email o WhatsApp que usaste al realizar el pedido.</p>
            <div className="support-email">
              <span>Soporte por email</span>
              <strong>hola@saveyourdate.site</strong>
              <button type="button" onClick={copySupportEmail}>{emailCopied ? "Email copiado ✓" : "Copiar email"}</button>
            </div>
            <p className="support-note">Si nos escribís, incluí tu nombre y cualquier dato que ayude a localizar el pedido. Nunca te vamos a pedir una contraseña.</p>
            <div className="modal-actions">
              <button className="outline-button" type="button" onClick={() => setShowHelp(false)}>Volver al ingreso</button>
              <a className="primary-button small" href="mailto:hola@saveyourdate.site?subject=Ayuda%20con%20el%20acceso%20al%20panel">Escribir a soporte</a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <article className={`metric metric-${tone}`}>
      <div><span>{label}</span><i /></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Status({ value }: { value: Guest["status"] }) {
  return <span className={`status status-${value.toLowerCase().replace(" ", "-")}`}>{value}</span>;
}

function Dashboard({ guests, onNavigate, order }: { guests: Guest[]; onNavigate: (view: string) => void; order: AdminOrder }) {
  const confirmed = guests.reduce((total, guest) => total + guest.confirmed, 0);
  const seats = guests.reduce((total, guest) => total + guest.seats, 0);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter((guest) => guest.status === "No asiste").length;
  const restrictions = guests.filter((guest) => guest.food !== "—" && guest.food !== "Ninguna").length;
  const songs = guests.filter((guest) => guest.song !== "—").length;
  const responseRate = guests.length
    ? Math.round(((guests.length - pending) / guests.length) * 100)
    : 0;

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">{order.eventType} · {formatEventDate(order.eventDate)}</span><h1>Buenas tardes, {order.customerName.split(" ")[0]}</h1><p>Este es el estado de tu evento hoy.</p></div>
        <button className="outline-button" onClick={() => onNavigate("Invitados")}>＋ Agregar invitado</button>
      </div>

      <section className="metrics-grid">
        <Metric label="Cupos asignados" value={String(seats)} note={`${guests.length} grupos cargados`} tone="blue" />
        <Metric label="Confirmados" value={String(confirmed)} note={`${confirmed} respuestas positivas`} tone="green" />
        <Metric label="Pendientes" value={String(pending)} note="Requieren seguimiento" tone="amber" />
        <Metric label="No asisten" value={String(declined)} note={`${responseRate}% de respuesta total`} tone="coral" />
      </section>

      <section className="dashboard-grid">
        <article className="panel response-panel">
          <div className="panel-title"><div><h2>Estado de confirmaciones</h2><p>Respuesta sobre el total de invitaciones</p></div><button>Últimos 30 días⌄</button></div>
          <div className="response-content">
            <div className="donut" style={{ "--rate": `${responseRate * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{responseRate}%</strong><span>respondió</span></div>
            </div>
            <div className="legend">
              <div><i className="dot dot-green" /><span>Confirmados</span><strong>{confirmed}</strong></div>
              <div><i className="dot dot-amber" /><span>Pendientes</span><strong>{pending}</strong></div>
              <div><i className="dot dot-coral" /><span>No asisten</span><strong>{declined}</strong></div>
            </div>
          </div>
        </article>

        <article className="panel next-actions">
          <div className="panel-title"><div><h2>Próximas acciones</h2><p>Recomendaciones para avanzar</p></div></div>
          <button onClick={() => onNavigate("Recordatorios")}><span className="action-icon action-yellow">↗</span><div><strong>Enviar recordatorios</strong><small>{pending} invitados todavía no respondieron</small></div><b>→</b></button>
          <button onClick={() => onNavigate("Restricciones")}><span className="action-icon action-coral">◇</span><div><strong>Revisar restricciones</strong><small>{restrictions} requerimientos alimentarios</small></div><b>→</b></button>
          <button onClick={() => onNavigate("Canciones")}><span className="action-icon action-blue">♫</span><div><strong>Armar playlist</strong><small>{songs} canciones sugeridas</small></div><b>→</b></button>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-title"><div><h2>Actividad reciente</h2><p>Últimas respuestas y cambios</p></div><button onClick={() => onNavigate("Confirmaciones")}>Ver todas →</button></div>
        <div className="activity-list">{guests.length === 0
          ? <div><p><strong>Todavía no hay actividad</strong><small>Los cambios aparecerán cuando agregues invitados y recibas respuestas.</small></p></div>
          : <div><p><strong>Invitados cargados</strong><small>{guests.length} registros disponibles.</small></p></div>}
        </div>
      </section>
    </>
  );
}

function Guests({ guests, setGuests }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>> }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [error, setError] = useState("");
  const filtered = guests.filter((guest) => {
    const matches = `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === "Todos" || guest.status === filter);
  });

  const addGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data))
      });
      const result = await response.json() as { guest?: Guest; error?: string };
      if (!response.ok || !result.guest) throw new Error(result.error || "No pudimos guardar el invitado.");
      setGuests((current) => [...current, result.guest!]);
      setShowModal(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el invitado.");
    } finally {
      setSaving(false);
    }
  };

  const deleteGuest = async (id: string) => {
    const response = await fetch(`/api/admin/guests?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setGuests((current) => current.filter((guest) => guest.id !== id));
  };

  const updateStatus = async (guest: Guest, status: Guest["status"]) => {
    setUpdatingId(guest.id);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guest.id,
          status,
          confirmed: status === "Confirmado" ? Math.max(guest.confirmed, guest.seats) : 0,
          food: guest.food,
          song: guest.song
        })
      });
      const result = await response.json() as { guest?: Guest; error?: string };
      if (!response.ok || !result.guest) throw new Error(result.error || "No pudimos actualizar la confirmación.");
      setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No pudimos actualizar la confirmación.");
    } finally {
      setUpdatingId("");
    }
  };

  const updateDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingGuest) return;
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGuest.id,
          status: editingGuest.status,
          confirmed: editingGuest.confirmed,
          food: data.get("food"),
          song: data.get("song")
        })
      });
      const result = await response.json() as { guest?: Guest; error?: string };
      if (!response.ok || !result.guest) throw new Error(result.error || "No pudimos guardar los datos.");
      setGuests((current) => current.map((item) => item.id === editingGuest.id ? result.guest! : item));
      setEditingGuest(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No pudimos guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Gestión del evento</span><h1>Invitados</h1><p>Administrá grupos, cupos y enlaces personalizados.</p></div><button className="primary-button small" onClick={() => setShowModal(true)}>＋ Agregar invitado</button></div>
      <section className="panel table-panel">
        <div className="table-tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar invitado o grupo…" /></label>
          <div className="filter-pills">{["Todos", "Confirmado", "Pendiente", "No asiste"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
          <button className="outline-button compact">⇩ Importar CSV</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Invitado</th><th>Grupo</th><th>Cupos</th><th>Estado</th><th>Restricción</th><th>Enlace</th><th /></tr></thead>
            <tbody>{filtered.map((guest) => (
              <tr key={guest.id}>
                <td><div className="person"><span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{guest.name}</strong><small>{guest.phone}</small></p></div></td>
                <td>{guest.group}</td><td>{guest.confirmed}/{guest.seats}</td><td><select className={`status-select status-${guest.status.toLowerCase().replace(" ", "-")}`} value={guest.status} disabled={updatingId === guest.id} onChange={(event) => updateStatus(guest, event.target.value as Guest["status"])} aria-label={`Estado de ${guest.name}`}><option>Confirmado</option><option>Pendiente</option><option>No asiste</option></select></td><td>{guest.food}</td>
                <td><button className="copy-button">Copiar link</button></td><td><div className="row-actions"><button className="copy-button" onClick={() => setEditingGuest(guest)}>Editar</button><button className="more-button" onClick={() => deleteGuest(guest.id)} aria-label={`Eliminar a ${guest.name}`}>Eliminar</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {error && <p className="table-error" role="alert">{error}</p>}
        <div className="table-footer"><span>Mostrando {filtered.length} de {guests.length} invitados</span><div><button>←</button><button className="active">1</button><button>→</button></div></div>
      </section>
      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}><form className="modal" onSubmit={addGuest} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowModal(false)}>×</button><span className="eyebrow">Nuevo registro</span><h2>Agregar invitado</h2><div className="form-grid"><label>Nombre y apellido<input name="name" required /></label><label>Grupo<input name="group" placeholder="Ej. Familia" /></label><label>WhatsApp<input name="phone" /></label><label>Cupos<input name="seats" type="number" min="1" max="20" defaultValue="1" /></label><label>Email<input name="email" type="email" /></label></div>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setShowModal(false)}>Cancelar</button><button className="primary-button small" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar invitado"}</button></div></form></div>}
      {editingGuest && <div className="modal-backdrop" onMouseDown={() => setEditingGuest(null)}><form className="modal" onSubmit={updateDetails} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setEditingGuest(null)}>×</button><span className="eyebrow">Información del invitado</span><h2>Editar a {editingGuest.name}</h2><div className="form-grid"><label>Restricción alimentaria<input name="food" defaultValue={editingGuest.food === "—" ? "" : editingGuest.food} placeholder="Ej. Vegetariano, celíaco…" /></label><label>Canción sugerida<input name="song" defaultValue={editingGuest.song === "—" ? "" : editingGuest.song} placeholder="Canción — Artista" /></label></div>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setEditingGuest(null)}>Cancelar</button><button className="primary-button small" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button></div></form></div>}
    </>
  );
}

function Confirmations({ guests }: { guests: Guest[] }) {
  const confirmed = guests.reduce((total, guest) => total + guest.confirmed, 0);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter((guest) => guest.status === "No asiste").length;
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Respuestas RSVP</span><h1>Confirmaciones</h1><p>Consultá las respuestas recibidas y su información asociada.</p></div><button className="outline-button">⇩ Exportar reporte</button></div>
      <section className="metrics-grid mini">
        <Metric label="Confirmaron" value={String(confirmed)} note="Personas" tone="green" />
        <Metric label="Pendientes" value={String(pending)} note="Invitaciones" tone="amber" />
        <Metric label="No asisten" value={String(declined)} note="Invitaciones" tone="coral" />
      </section>
      <section className="panel table-panel">
        <div className="table-scroll"><table><thead><tr><th>Invitado</th><th>Respuesta</th><th>Personas</th><th>Restricción</th><th>Canción</th><th>Fecha</th></tr></thead>
        <tbody>{guests.filter((guest) => guest.status !== "Pendiente").map((guest) => <tr key={guest.id}><td><strong>{guest.name}</strong><small className="cell-sub">{guest.group}</small></td><td><Status value={guest.status} /></td><td>{guest.confirmed}</td><td>{guest.food}</td><td>{guest.song}</td><td>22/07/2026</td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}

type EventTable = {
  id: string;
  name: string;
  capacity: number;
  guests: string[];
  note: string;
};

function Seating({ guests }: { guests: Guest[] }) {
  const confirmedGuests = guests.filter((guest) => guest.status === "Confirmado");
  const [tables, setTables] = useState<EventTable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventTable | null>(null);
  const [tableName, setTableName] = useState("Mesa 3");
  const [capacity, setCapacity] = useState(8);
  const [note, setNote] = useState("");

  const assignedIds = tables.flatMap((table) => table.guests);
  const unassigned = confirmedGuests.filter((guest) => !assignedIds.includes(guest.id));
  const assignedPeople = tables.reduce((total, table) => total + table.guests.reduce((sum, id) => sum + (guests.find((guest) => guest.id === id)?.confirmed ?? 0), 0), 0);
  const totalConfirmed = confirmedGuests.reduce((total, guest) => total + guest.confirmed, 0);
  const totalCapacity = tables.reduce((total, table) => total + table.capacity, 0);

  const openNew = () => {
    setEditing(null);
    setTableName(`Mesa ${tables.length + 1}`);
    setCapacity(8);
    setNote("");
    setShowModal(true);
  };

  const openEdit = (table: EventTable) => {
    setEditing(table);
    setTableName(table.name);
    setCapacity(table.capacity);
    setNote(table.note);
    setShowModal(true);
  };

  const saveTable = () => {
    if (editing) {
      setTables((current) => current.map((table) => table.id === editing.id ? { ...table, name: tableName, capacity, note } : table));
    } else {
      setTables((current) => [...current, { id: `table-${Date.now()}`, name: tableName, capacity, note, guests: [] }]);
    }
    setShowModal(false);
  };

  const deleteTable = (tableId: string) => {
    setTables((current) => current.filter((table) => table.id !== tableId));
  };

  const assignGuest = (guestId: string, tableId: string) => {
    setTables((current) => current.map((table) => ({
      ...table,
      guests: table.id === tableId
        ? [...table.guests.filter((id) => id !== guestId), guestId]
        : table.guests.filter((id) => id !== guestId),
    })));
  };

  const unassignGuest = (guestId: string) => {
    setTables((current) => current.map((table) => ({ ...table, guests: table.guests.filter((id) => id !== guestId) })));
  };

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">Distribución del salón</span><h1>Organización de mesas</h1><p>Asigná invitados confirmados y controlá la capacidad de cada mesa.</p></div>
        <button className="primary-button small" onClick={openNew}>＋ Agregar mesa</button>
      </div>

      <section className="seating-summary">
        <article><span>Mesas creadas</span><strong>{tables.length}</strong><small>{totalCapacity} lugares disponibles</small></article>
        <article><span>Personas ubicadas</span><strong>{assignedPeople}</strong><small>de {totalConfirmed} confirmadas</small></article>
        <article className={unassigned.length ? "summary-warning" : ""}><span>Sin asignar</span><strong>{totalConfirmed - assignedPeople}</strong><small>{unassigned.length ? "Requiere atención" : "Todos tienen mesa"}</small></article>
      </section>

      <div className="seating-layout">
        <aside className="panel unassigned-panel">
          <div className="panel-title"><div><h2>Invitados confirmados</h2><p>Asigná cada grupo a una mesa</p></div><span className="count-badge">{confirmedGuests.length}</span></div>
          <div className="guest-assign-list">
            {confirmedGuests.map((guest) => {
              const currentTable = tables.find((table) => table.guests.includes(guest.id));
              return (
                <div key={guest.id} className={currentTable ? "guest-assigned" : ""}>
                  <span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  <p><strong>{guest.name}</strong><small>{guest.confirmed} {guest.confirmed === 1 ? "persona" : "personas"} · {guest.group}</small></p>
                  <select value={currentTable?.id ?? ""} onChange={(event) => event.target.value ? assignGuest(guest.id, event.target.value) : unassignGuest(guest.id)} aria-label={`Mesa de ${guest.name}`}>
                    <option value="">Sin mesa</option>
                    {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="tables-workspace">
          <div className="workspace-heading"><div><h2>Plano de mesas</h2><p>La capacidad se calcula según las personas confirmadas de cada grupo.</p></div><span>Actualización automática</span></div>
          <div className="tables-grid">
            {tables.map((table, index) => {
              const tableGuests = table.guests.map((id) => guests.find((guest) => guest.id === id)).filter(Boolean) as Guest[];
              const occupied = tableGuests.reduce((total, guest) => total + guest.confirmed, 0);
              const remaining = table.capacity - occupied;
              const full = remaining === 0;
              const over = remaining < 0;
              return (
                <article className={`table-card ${over ? "table-over" : full ? "table-full" : ""}`} key={table.id}>
                  <div className="table-card-top">
                    <span className="table-number">{index + 1}</span>
                    <div><h3>{table.name}</h3><p>{table.note || "Sin observaciones"}</p></div>
                    <button onClick={() => openEdit(table)} aria-label={`Editar ${table.name}`}>•••</button>
                  </div>
                  <div className="capacity-row"><span>{occupied} de {table.capacity} lugares</span><strong>{over ? `${Math.abs(remaining)} de más` : full ? "Completa" : `${remaining} libres`}</strong></div>
                  <div className="capacity-bar"><i style={{ width: `${Math.min(100, (occupied / table.capacity) * 100)}%` }} /></div>
                  <div className="seated-guests">
                    {tableGuests.map((guest) => <div key={guest.id}><span>{guest.name}</span><small>{guest.confirmed} lugares</small><button onClick={() => unassignGuest(guest.id)} aria-label={`Quitar a ${guest.name}`}>×</button></div>)}
                    {!tableGuests.length && <button className="empty-table" onClick={() => document.querySelector<HTMLSelectElement>(".guest-assign-list select")?.focus()}>＋ Asignar invitados</button>}
                  </div>
                  {over && <div className="capacity-alert">La mesa supera la capacidad configurada.</div>}
                </article>
              );
            })}
            <button className="add-table-card" onClick={openNew}><span>＋</span><strong>Agregar otra mesa</strong><small>Definí nombre y capacidad</small></button>
          </div>
        </section>
      </div>

      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
        <div className="modal table-modal" onMouseDown={(event) => event.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          <span className="eyebrow">{editing ? "Configuración" : "Nueva mesa"}</span>
          <h2>{editing ? "Editar mesa" : "Agregar mesa"}</h2>
          <div className="form-grid">
            <label>Nombre o número<input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder="Ej. Mesa Familia" /></label>
            <label>Cantidad de personas<input type="number" min="1" max="30" value={capacity} onChange={(event) => setCapacity(Math.max(1, Number(event.target.value)))} /></label>
          </div>
          <label className="modal-note">Ubicación u observaciones<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. Cerca de la pista" /></label>
          <div className="modal-actions table-modal-actions">
            {editing && <button className="delete-button" onClick={() => { deleteTable(editing.id); setShowModal(false); }}>Eliminar mesa</button>}
            <span />
            <button className="outline-button" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="primary-button small" onClick={saveTable}>{editing ? "Guardar cambios" : "Crear mesa"}</button>
          </div>
        </div>
      </div>}
    </>
  );
}

function SimpleModule({ view, guests }: { view: string; guests: Guest[] }) {
  const restrictions = guests.filter((g) => g.food !== "—" && g.food !== "Ninguna");
  const songs = guests.filter((g) => g.song !== "—");
  const pending = guests.filter((g) => g.status === "Pendiente");
  const reminded = pending.filter((g) => g.reminded !== "—");
  const content = {
    Restricciones: { eyebrow: "Información para catering", title: "Restricciones alimentarias", description: "Organizá los requerimientos de tus invitados.", stats: [["Registradas", String(restrictions.length)], ["Personas", String(restrictions.reduce((total, guest) => total + (guest.confirmed || 1), 0))], ["Pendientes", String(restrictions.filter((guest) => guest.status === "Pendiente").length)]], rows: restrictions, headers: ["Invitado", "Grupo", "Restricción", "Personas"] },
    Canciones: { eyebrow: "Playlist colaborativa", title: "Canciones sugeridas", description: "Revisá y organizá las canciones enviadas.", stats: [["Sugeridas", String(songs.length)], ["Con respuesta", String(songs.filter((guest) => guest.status !== "Pendiente").length)], ["Pendientes", String(songs.filter((guest) => guest.status === "Pendiente").length)]], rows: songs, headers: ["Invitado", "Canción", "Estado", "Acción"] },
    Recordatorios: { eyebrow: "Seguimiento RSVP", title: "Recordatorios", description: "Contactá a quienes todavía no respondieron.", stats: [["Pendientes", String(pending.length)], ["Recordados", String(reminded.length)], ["Sin contactar", String(pending.length - reminded.length)]], rows: pending, headers: ["Invitado", "WhatsApp", "Último recordatorio", "Acción"] },
    Accesos: { eyebrow: "Seguridad del evento", title: "Administradores", description: "Gestioná quién puede acceder al panel.", stats: [["Activos", "1"], ["Invitados", "0"], ["Sesiones", "1"]], rows: [], headers: ["Administrador", "Contacto", "Rol", "Estado"] },
  }[view]!;

  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p></div><button className="primary-button small">＋ {view === "Accesos" ? "Agregar administrador" : view === "Recordatorios" ? "Recordar pendientes" : "Exportar"}</button></div>
      <section className="metrics-grid mini">{content.stats.map(([label, value], index) => <Metric key={label} label={label} value={value} note={view === "Accesos" ? "usuarios" : "registros"} tone={["blue", "green", "amber"][index]} />)}</section>
      <section className="panel table-panel"><div className="table-scroll"><table><thead><tr>{content.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{content.rows.map((guest, index) => <tr key={guest.id}>
          <td><div className="person"><span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{view === "Accesos" && index === 0 ? "Ana Pereira" : view === "Accesos" && index === 1 ? "Martín Costa" : guest.name}</strong><small>{guest.group}</small></p></div></td>
          {view === "Restricciones" && <><td>{guest.group}</td><td><span className="status status-pendiente">{guest.food}</span></td><td>{guest.confirmed || 1}</td></>}
          {view === "Canciones" && <><td>{guest.song}</td><td><span className={`status ${index < 2 ? "status-confirmado" : "status-pendiente"}`}>{index < 2 ? "Aprobada" : "Pendiente"}</span></td><td><button className="copy-button">Revisar</button></td></>}
          {view === "Recordatorios" && <><td>{guest.phone}</td><td>{guest.reminded}</td><td><button className="whatsapp-button">Abrir WhatsApp ↗</button></td></>}
          {view === "Accesos" && <><td>{index === 0 ? "ana@ejemplo.com" : index === 1 ? "martin@ejemplo.com" : "sofia@ejemplo.com"}</td><td>{index === 0 ? "Propietaria" : index === 1 ? "Colaborador" : "Solo lectura"}</td><td><span className={`status ${index < 2 ? "status-confirmado" : "status-pendiente"}`}>{index < 2 ? "Activo" : "Invitación pendiente"}</span></td></>}
        </tr>)}</tbody></table></div></section>
    </>
  );
}

function Admin({ onLogout, order }: { onLogout: () => void; order: AdminOrder }) {
  const [view, setView] = useState("Resumen");
  const [guests, setGuests] = useState(guestsSeed);
  const [mobileNav, setMobileNav] = useState(false);
  const title = useMemo(() => view === "Resumen" ? "Panel principal" : view, [view]);

  useEffect(() => {
    fetch("/api/admin/guests")
      .then(async (response) => {
        if (!response.ok) return;
        setGuests(((await response.json()) as { guests: Guest[] }).guests);
      });
  }, []);

  const navigate = (item: string) => {
    setView(item);
    setMobileNav(false);
  };

  return (
    <main className="admin-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-top"><Logo compact /><button className="mobile-close" onClick={() => setMobileNav(false)}>×</button></div>
        <div className="event-switcher"><span>{initials(order.eventTitle)}</span><div><strong>{order.eventTitle}</strong><small>Pedido {order.orderNumber}</small></div><button>⌄</button></div>
        <nav>{nav.map(([item, icon]) => <button key={item} className={view === item ? "active" : ""} onClick={() => navigate(item)}><span>{icon}</span>{item}{item === "Recordatorios" && <b>2</b>}</button>)}</nav>
        <div className="sidebar-help"><span>?</span><div><strong>¿Necesitás ayuda?</strong><small>Estamos para acompañarte.</small></div><button>Contactar soporte</button></div>
        <button className="logout" onClick={onLogout}><span>↪</span>Cerrar sesión</button>
      </aside>
      {mobileNav && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} />}
      <section className="admin-main">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)}>☰</button><div><span>{title}</span><small>Última actualización: ahora</small></div><div className="topbar-actions"><button className="notification">♢</button><div className="admin-user"><span>{initials(order.customerName)}</span><div><strong>{order.customerName}</strong><small>Propietaria</small></div><button>⌄</button></div></div></header>
        <div className="admin-content">
          {view === "Resumen" && <Dashboard guests={guests} onNavigate={navigate} order={order} />}
          {view === "Invitados" && <Guests guests={guests} setGuests={setGuests} />}
          {view === "Confirmaciones" && <Confirmations guests={guests} />}
          {view === "Mesas" && <Seating guests={guests} />}
          {["Restricciones", "Canciones", "Recordatorios", "Accesos"].includes(view) && <SimpleModule view={view} guests={guests} />}
        </div>
        <footer><span>Save Your Date</span><small>Invitaciones digitales para momentos inolvidables · Panel v106</small></footer>
      </section>
    </main>
  );
}

export function AdminPrototype() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { order: AdminOrder };
        setOrder(result.order);
        setLoggedIn(true);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
  };

  if (checkingSession) return <main className="admin-loading">Verificando acceso…</main>;
  return loggedIn && order
    ? <Admin onLogout={logout} order={order} />
    : <Login onLogin={() => window.location.reload()} />;
}

export default AdminPrototype;
