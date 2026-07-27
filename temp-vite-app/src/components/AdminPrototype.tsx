
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../admin-prototype.css";

type Guest = {
  id: string;
  inviteToken: string;
  name: string;
  group: string;
  phone: string;
  phoneCountryCode: string;
  identificationType: string;
  identificationNumber: string;
  seats: number;
  confirmed: number;
  status: "Confirmado" | "Pendiente" | "No asiste";
  food: string;
  song: string;
  reminded: string;
  updatedAt: string;
};

type AdminOrder = {
  orderNumber: string;
  customerName: string;
  plan: string;
  modelName: string;
  eventTitle: string;
  eventDate: string;
  eventType: string;
  defaultPhoneCountryCode: string;
  accessRole: "owner" | "editor" | "viewer";
  loginEmail: string;
};

const guestsSeed: Guest[] = [];

const formatEventDate = (value: string) => {
  if (!value) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
};

const initials = (value: string) =>
  value.split(/\s+|&/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const exportCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const safeCell = (value: string | number) => {
    const text = String(value ?? "");
    const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${protectedText.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows].map((row) => row.map(safeCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const reportDate = (value: string) => value
  ? new Intl.DateTimeFormat("es-UY", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
  : "—";

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter = (text.split(/\r?\n/, 1)[0].match(/;/g)?.length || 0) > (text.split(/\r?\n/, 1)[0].match(/,/g)?.length || 0) ? ";" : ",";
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const nav = [
  ["Resumen", "⌂"],
  ["Invitados", "♙"],
  ["Confirmaciones", "✓"],
  ["Restricciones", "◇"],
  ["Canciones", "♫"],
  ["Recordatorios", "↗"],
  ["Mesas", "▦"],
  ["Accesos", "♢"],
  ["Configuración", "⚙"],
];

const countryCodes = [
  ["Uruguay", "+598"], ["Argentina", "+54"], ["Brasil", "+55"], ["Paraguay", "+595"],
  ["Chile", "+56"], ["Bolivia", "+591"], ["Perú", "+51"], ["Colombia", "+57"],
  ["México", "+52"], ["Estados Unidos / Canadá", "+1"], ["España", "+34"],
  ["Italia", "+39"], ["Francia", "+33"], ["Reino Unido", "+44"]
];

const suggestedIdentification = (code: string) =>
  code === "+598" ? "CI" : code === "+54" ? "DNI" : code === "+55" ? "CPF" : "Pasaporte";

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

function Guests({ guests, setGuests, defaultPhoneCountryCode }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; defaultPhoneCountryCode: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [newGuestCode, setNewGuestCode] = useState(defaultPhoneCountryCode);
  const [newIdentificationType, setNewIdentificationType] = useState(suggestedIdentification(defaultPhoneCountryCode));
  const [customGuestCode, setCustomGuestCode] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  const filtered = guests.filter((guest) => {
    const matches = `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === "Todos" || guest.status === filter);
  });

  const addGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(data), phoneCountryCode: newGuestCode === "custom" ? customGuestCode : newGuestCode })
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
          song: data.get("song"),
          phone: data.get("phone"),
          phoneCountryCode: data.get("phoneCountryCode"),
          identificationType: data.get("identificationType"),
          identificationNumber: data.get("identificationNumber")
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

  const copyInviteLink = async (guest: Guest) => {
    if (!guest.inviteToken) {
      setError("Falta aplicar la migración de enlaces personalizados en Supabase.");
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/confirmar?token=${guest.inviteToken}`);
    setCopiedId(guest.id);
    window.setTimeout(() => setCopiedId(""), 1800);
  };

  const downloadTemplate = () => exportCsv(
    "plantilla-invitados.csv",
    ["Nombre", "Grupo", "WhatsApp", "Código país", "Cupos", "Email", "Tipo identificación", "Identificación"],
    [["Valentina Pérez", "Familia Pérez", "99123456", defaultPhoneCountryCode, 2, "valentina@ejemplo.com", suggestedIdentification(defaultPhoneCountryCode), ""]]
  );

  const importCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("El archivo no contiene invitados.");
      const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
      const headers = rows[0].map(normalize);
      const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
      const nameIndex = column("nombre", "invitado", "nombre y apellido");
      if (nameIndex < 0) throw new Error('La plantilla debe incluir una columna "Nombre".');
      const groupIndex = column("grupo", "familia");
      const phoneIndex = column("whatsapp", "telefono", "celular");
      const codeIndex = column("codigo pais", "codigo de pais", "pais", "caracteristica");
      const seatsIndex = column("cupos", "personas", "cantidad");
      const emailIndex = column("email", "correo");
      const identificationTypeIndex = column("tipo identificacion", "tipo de identificacion", "documento");
      const identificationNumberIndex = column("identificacion", "numero identificacion", "numero de identificacion");
      const imported = rows.slice(1).map((values) => ({
        name: values[nameIndex],
        group: groupIndex >= 0 ? values[groupIndex] : "",
        phone: phoneIndex >= 0 ? values[phoneIndex] : "",
        phoneCountryCode: codeIndex >= 0 && values[codeIndex] ? values[codeIndex] : defaultPhoneCountryCode,
        seats: seatsIndex >= 0 ? values[seatsIndex] : "1",
        email: emailIndex >= 0 ? values[emailIndex] : "",
        identificationType: identificationTypeIndex >= 0 && values[identificationTypeIndex] ? values[identificationTypeIndex] : "",
        identificationNumber: identificationNumberIndex >= 0 ? values[identificationNumberIndex] : ""
      })).filter((guest) => guest.name);
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: imported, defaultPhoneCountryCode })
      });
      const result = await response.json() as { guests?: Guest[]; error?: string };
      if (!response.ok || !result.guests) throw new Error(result.error || "No pudimos importar los invitados.");
      setGuests((current) => [...current, ...result.guests!]);
      setNotice(`${result.guests.length} invitados importados correctamente.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "No pudimos importar el archivo.");
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
          <div className="import-actions"><button className="copy-button" onClick={downloadTemplate}>Plantilla</button><button className="outline-button compact" disabled={saving} onClick={() => importInput.current?.click()}>{saving ? "Importando…" : "⇩ Importar CSV"}</button><input ref={importInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv} /></div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Invitado</th><th>Grupo</th><th>Cupos</th><th>Estado</th><th>Restricción</th><th>Enlace</th><th /></tr></thead>
            <tbody>{filtered.map((guest) => (
              <tr key={guest.id}>
                <td><div className="person"><span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{guest.name}</strong><small>{guest.phone}</small></p></div></td>
                <td>{guest.group}</td><td>{guest.confirmed}/{guest.seats}</td><td><select className={`status-select status-${guest.status.toLowerCase().replace(" ", "-")}`} value={guest.status} disabled={updatingId === guest.id} onChange={(event) => updateStatus(guest, event.target.value as Guest["status"])} aria-label={`Estado de ${guest.name}`}><option>Confirmado</option><option>Pendiente</option><option>No asiste</option></select></td><td>{guest.food}</td>
                <td><button className="copy-button" onClick={() => copyInviteLink(guest)}>{copiedId === guest.id ? "¡Copiado!" : "Copiar link"}</button></td><td><div className="row-actions"><button className="copy-button" onClick={() => setEditingGuest(guest)}>Editar</button><button className="more-button" onClick={() => deleteGuest(guest.id)} aria-label={`Eliminar a ${guest.name}`}>Eliminar</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {notice && <p className="import-success" role="status">{notice}</p>}
        {error && <p className="table-error" role="alert">{error}</p>}
        <div className="table-footer"><span>Mostrando {filtered.length} de {guests.length} invitados</span><div><button>←</button><button className="active">1</button><button>→</button></div></div>
      </section>
      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}><form className="modal" onSubmit={addGuest} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowModal(false)}>×</button><span className="eyebrow">Nuevo registro</span><h2>Agregar invitado</h2><div className="form-grid"><label>Nombre y apellido<input name="name" required /></label><label>Grupo<input name="group" placeholder="Ej. Familia" /></label><label>País de WhatsApp<select value={countryCodes.some(([, code]) => code === newGuestCode) ? newGuestCode : "custom"} onChange={(event) => { const code = event.target.value; setNewGuestCode(code); if (code !== "custom") setNewIdentificationType(suggestedIdentification(code)); }}>{countryCodes.map(([country, code]) => <option key={code} value={code}>{country} {code}</option>)}<option value="custom">Otro país</option></select></label>{newGuestCode === "custom" && <label>Código internacional<input value={customGuestCode} onChange={(event) => setCustomGuestCode(event.target.value)} placeholder="+___" required /></label>}<label>WhatsApp<input name="phone" inputMode="tel" placeholder="99 123 456" /></label><label>Cupos<input name="seats" type="number" min="1" max="20" defaultValue="1" /></label><label>Email<input name="email" type="email" /></label><label>Tipo de identificación<select name="identificationType" value={newIdentificationType} onChange={(event) => setNewIdentificationType(event.target.value)}><option value="">Sin identificación</option><option>CI</option><option>DNI</option><option>CPF</option><option>Pasaporte</option><option>Otro</option></select></label><label>Número de identificación<input name="identificationNumber" placeholder="Opcional" /></label></div>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setShowModal(false)}>Cancelar</button><button className="primary-button small" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar invitado"}</button></div></form></div>}
      {editingGuest && <div className="modal-backdrop" onMouseDown={() => setEditingGuest(null)}><form className="modal" onSubmit={updateDetails} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setEditingGuest(null)}>×</button><span className="eyebrow">Información del invitado</span><h2>Editar a {editingGuest.name}</h2><div className="form-grid"><label>Código de país<input name="phoneCountryCode" defaultValue={editingGuest.phoneCountryCode || defaultPhoneCountryCode} placeholder="+598" required /></label><label>WhatsApp<input name="phone" inputMode="tel" defaultValue={editingGuest.phone.replace(editingGuest.phoneCountryCode || defaultPhoneCountryCode, "")} /></label><label>Tipo de identificación<select name="identificationType" defaultValue={editingGuest.identificationType}><option value="">Sin identificación</option><option>CI</option><option>DNI</option><option>CPF</option><option>Pasaporte</option><option>Otro</option></select></label><label>Número de identificación<input name="identificationNumber" defaultValue={editingGuest.identificationNumber} placeholder="Opcional" /></label><label>Restricción alimentaria<input name="food" defaultValue={editingGuest.food === "—" ? "" : editingGuest.food} placeholder="Ej. Vegetariano, celíaco…" /></label><label>Canción sugerida<input name="song" defaultValue={editingGuest.song === "—" ? "" : editingGuest.song} placeholder="Canción — Artista" /></label></div>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setEditingGuest(null)}>Cancelar</button><button className="primary-button small" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button></div></form></div>}
    </>
  );
}

function Confirmations({ guests }: { guests: Guest[] }) {
  const confirmed = guests.reduce((total, guest) => total + guest.confirmed, 0);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter((guest) => guest.status === "No asiste").length;
  const exportReport = () => exportCsv(
    `confirmaciones-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Invitado", "Grupo", "Estado", "Cupos asignados", "Personas confirmadas", "WhatsApp", "Tipo identificación", "Identificación", "Restricción", "Canción", "Última actualización"],
    guests.map((guest) => [guest.name, guest.group, guest.status, guest.seats, guest.confirmed, guest.phone, guest.identificationType, guest.identificationNumber, guest.food, guest.song, reportDate(guest.updatedAt)])
  );
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Respuestas RSVP</span><h1>Confirmaciones</h1><p>Consultá las respuestas recibidas y su información asociada.</p></div><button className="outline-button" onClick={exportReport}>⇩ Exportar reporte</button></div>
      <section className="metrics-grid mini">
        <Metric label="Confirmaron" value={String(confirmed)} note="Personas" tone="green" />
        <Metric label="Pendientes" value={String(pending)} note="Invitaciones" tone="amber" />
        <Metric label="No asisten" value={String(declined)} note="Invitaciones" tone="coral" />
      </section>
      <section className="panel table-panel">
        <div className="table-scroll"><table><thead><tr><th>Invitado</th><th>Respuesta</th><th>Personas</th><th>Restricción</th><th>Canción</th><th>Fecha</th></tr></thead>
        <tbody>{guests.filter((guest) => guest.status !== "Pendiente").map((guest) => <tr key={guest.id}><td><strong>{guest.name}</strong><small className="cell-sub">{guest.group}</small></td><td><Status value={guest.status} /></td><td>{guest.confirmed}</td><td>{guest.food}</td><td>{guest.song}</td><td>{reportDate(guest.updatedAt)}</td></tr>)}</tbody></table></div>
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    fetch("/api/admin/tables")
      .then(async (response) => {
        const result = await response.json() as { tables?: EventTable[]; error?: string };
        if (!response.ok || !result.tables) throw new Error(result.error || "No pudimos cargar las mesas.");
        setTables(result.tables);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No pudimos cargar las mesas."))
      .finally(() => setLoading(false));
  }, []);

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

  const saveTable = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tables", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing?.id, name: tableName, capacity, note })
      });
      const result = await response.json() as { table?: EventTable; error?: string };
      if (!response.ok || !result.table) throw new Error(result.error || "No pudimos guardar la mesa.");
      setTables((current) => editing
        ? current.map((table) => table.id === editing.id ? { ...result.table!, guests: table.guests } : table)
        : [...current, result.table!]);
      setShowModal(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar la mesa.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/tables?id=${encodeURIComponent(tableId)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos eliminar la mesa.");
      setTables((current) => current.filter((table) => table.id !== tableId));
      setShowModal(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No pudimos eliminar la mesa.");
    } finally {
      setSaving(false);
    }
  };

  const assignGuest = async (guestId: string, tableId: string) => {
    setError("");
    try {
      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", guestId, tableId })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos asignar el invitado.");
      setTables((current) => current.map((table) => ({
        ...table,
        guests: table.id === tableId
          ? [...table.guests.filter((id) => id !== guestId), guestId]
          : table.guests.filter((id) => id !== guestId),
      })));
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "No pudimos asignar el invitado.");
    }
  };

  const unassignGuest = (guestId: string) => assignGuest(guestId, "");

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">Distribución del salón</span><h1>Organización de mesas</h1><p>Asigná invitados confirmados y controlá la capacidad de cada mesa.</p></div>
        <button className="primary-button small" onClick={openNew}>＋ Agregar mesa</button>
      </div>
      {loading && <p className="module-notice">Cargando organización de mesas…</p>}
      {error && <p className="table-error seating-error" role="alert">{error}</p>}

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
            {editing && <button className="delete-button" disabled={saving} onClick={() => deleteTable(editing.id)}>Eliminar mesa</button>}
            <span />
            <button className="outline-button" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="primary-button small" disabled={saving} onClick={saveTable}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear mesa"}</button>
          </div>
        </div>
      </div>}
    </>
  );
}

function SimpleModule({ view, guests, setGuests, order }: { view: string; guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; order: AdminOrder }) {
  const [remindingId, setRemindingId] = useState("");
  const [moduleError, setModuleError] = useState("");
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

  const exportModule = () => {
    if (view === "Restricciones") {
      exportCsv(
        `restricciones-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Invitado", "Grupo", "Restricción", "Personas confirmadas", "Estado"],
        restrictions.map((guest) => [guest.name, guest.group, guest.food, guest.confirmed, guest.status])
      );
    }
    if (view === "Canciones") {
      exportCsv(
        `canciones-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Invitado", "Grupo", "Canción sugerida", "Estado"],
        songs.map((guest) => [guest.name, guest.group, guest.song, guest.status])
      );
    }
  };

  const reminderDate = (value: string) => value === "—"
    ? value
    : new Intl.DateTimeFormat("es-UY", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

  const remindGuest = async (guest: Guest) => {
    const rawPhone = guest.phone.replace(/\D/g, "").replace(/^00/, "");
    const phone = rawPhone.startsWith("5980")
      ? `598${rawPhone.slice(4)}`
      : rawPhone.startsWith("0") && rawPhone.length === 9
        ? `598${rawPhone.slice(1)}`
        : rawPhone;
    if (phone.length < 8) {
      setModuleError(`${guest.name} no tiene un número válido. Editalo incluyendo el código de país, por ejemplo +598.`);
      return;
    }
    const personalizedLink = `${window.location.origin}/confirmar?token=${guest.inviteToken}`;
    const message = `Hola ${guest.name}, te recordamos confirmar tu asistencia a ${order.eventTitle}. Podés responder acá: ${personalizedLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
    const whatsappWindow = window.open("", "_blank");
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.location.href = whatsappUrl;
    } else {
      window.location.href = whatsappUrl;
    }
    setRemindingId(guest.id);
    setModuleError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, action: "remind" })
      });
      const result = await response.json() as { guest?: Guest; error?: string };
      if (!response.ok || !result.guest) throw new Error(result.error || "No pudimos registrar el recordatorio.");
      setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : "No pudimos registrar el recordatorio.");
    } finally {
      setRemindingId("");
    }
  };

  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p></div>{view !== "Recordatorios" && <button className="primary-button small" onClick={view === "Accesos" ? undefined : exportModule}>＋ {view === "Accesos" ? "Agregar administrador" : "Exportar CSV"}</button>}</div>
      <section className="metrics-grid mini">{content.stats.map(([label, value], index) => <Metric key={label} label={label} value={value} note={view === "Accesos" ? "usuarios" : "registros"} tone={["blue", "green", "amber"][index]} />)}</section>
      <section className="panel table-panel"><div className="table-scroll"><table><thead><tr>{content.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{content.rows.map((guest, index) => <tr key={guest.id}>
          <td><div className="person"><span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{view === "Accesos" && index === 0 ? "Ana Pereira" : view === "Accesos" && index === 1 ? "Martín Costa" : guest.name}</strong><small>{guest.group}</small></p></div></td>
          {view === "Restricciones" && <><td>{guest.group}</td><td><span className="status status-pendiente">{guest.food}</span></td><td>{guest.confirmed || 1}</td></>}
          {view === "Canciones" && <><td>{guest.song}</td><td><span className={`status ${index < 2 ? "status-confirmado" : "status-pendiente"}`}>{index < 2 ? "Aprobada" : "Pendiente"}</span></td><td><button className="copy-button">Revisar</button></td></>}
          {view === "Recordatorios" && <><td>{guest.phone || "Sin número"}</td><td>{reminderDate(guest.reminded)}</td><td><button className="whatsapp-button" disabled={remindingId === guest.id} onClick={() => remindGuest(guest)}>{remindingId === guest.id ? "Registrando…" : "Abrir WhatsApp ↗"}</button></td></>}
          {view === "Accesos" && <><td>{index === 0 ? "ana@ejemplo.com" : index === 1 ? "martin@ejemplo.com" : "sofia@ejemplo.com"}</td><td>{index === 0 ? "Propietaria" : index === 1 ? "Colaborador" : "Solo lectura"}</td><td><span className={`status ${index < 2 ? "status-confirmado" : "status-pendiente"}`}>{index < 2 ? "Activo" : "Invitación pendiente"}</span></td></>}
        </tr>)}</tbody></table></div>{moduleError && <p className="table-error" role="alert">{moduleError}</p>}</section>
    </>
  );
}

function Settings({ code, onChange }: { code: string; onChange: (value: string) => void }) {
  const knownCode = countryCodes.some(([, value]) => value === code);
  const [selection, setSelection] = useState(knownCode ? code : "custom");
  const [customCode, setCustomCode] = useState(knownCode ? "" : code);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const value = selection === "custom" ? customCode.trim() : selection;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultPhoneCountryCode: value })
      });
      const result = await response.json() as { defaultPhoneCountryCode?: string; error?: string };
      if (!response.ok || !result.defaultPhoneCountryCode) throw new Error(result.error || "No pudimos guardar la configuración.");
      onChange(result.defaultPhoneCountryCode);
      setMessage("Configuración guardada. Los invitados nuevos usarán este código automáticamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return <>
    <div className="page-heading"><div><span className="eyebrow">Preferencias del evento</span><h1>Configuración</h1><p>Definí valores predeterminados para automatizar la gestión.</p></div></div>
    <section className="panel settings-panel">
      <div className="panel-title"><div><h2>País predeterminado de WhatsApp</h2><p>Se aplicará automáticamente al agregar invitados y se podrá cambiar en cada caso.</p></div></div>
      <div className="settings-form">
        <label>País<select value={selection} onChange={(event) => setSelection(event.target.value)}>{countryCodes.map(([country, value]) => <option key={value} value={value}>{country} {value}</option>)}<option value="custom">Otro país</option></select></label>
        {selection === "custom" && <label>Código internacional<input value={customCode} onChange={(event) => setCustomCode(event.target.value)} placeholder="+___" /></label>}
        <button className="primary-button small" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar configuración"}</button>
      </div>
      {message && <p className="settings-message" role="status">{message}</p>}
    </section>
  </>;
}

type AdminAccess = { id: string; email: string; role: "editor" | "viewer"; created_at: string };

function Accesses({ order }: { order: AdminOrder }) {
  const [accesses, setAccesses] = useState<AdminAccess[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/access").then(async (response) => {
      if (response.ok) setAccesses(((await response.json()) as { accesses: AdminAccess[] }).accesses);
    });
  }, []);
  useEffect(load, [load]);

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/access", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data))
      });
      const result = await response.json() as { access?: AdminAccess; error?: string };
      if (!response.ok || !result.access) throw new Error(result.error || "No pudimos invitar al colaborador.");
      setAccesses((current) => [...current, result.access!]); setShowModal(false);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "No pudimos invitar al colaborador.");
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/admin/access?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setAccesses((current) => current.filter((access) => access.id !== id));
  };

  return <>
    <div className="page-heading"><div><span className="eyebrow">Seguridad del evento</span><h1>Accesos</h1><p>Gestioná quién puede ingresar y qué puede modificar.</p></div>{order.accessRole === "owner" && <button className="primary-button small" onClick={() => setShowModal(true)}>＋ Agregar colaborador</button>}</div>
    <section className="metrics-grid mini"><Metric label="Propietarios" value="1" note="acceso total" tone="blue" /><Metric label="Editores" value={String(accesses.filter((access) => access.role === "editor").length)} note="pueden modificar" tone="green" /><Metric label="Solo lectura" value={String(accesses.filter((access) => access.role === "viewer").length)} note="sin cambios" tone="amber" /></section>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Administrador</th><th>Rol</th><th>Estado</th><th /></tr></thead><tbody>
      <tr><td><strong>{order.loginEmail}</strong></td><td>Propietario</td><td><span className="status status-confirmado">Activo</span></td><td /></tr>
      {accesses.map((access) => <tr key={access.id}><td><strong>{access.email}</strong></td><td>{access.role === "editor" ? "Editor" : "Solo lectura"}</td><td><span className="status status-confirmado">Activo</span></td><td>{order.accessRole === "owner" && <button className="more-button" onClick={() => remove(access.id)}>Eliminar</button>}</td></tr>)}
    </tbody></table></div></section>
    {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}><form className="modal" onSubmit={invite} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowModal(false)}>×</button><span className="eyebrow">Nuevo acceso</span><h2>Agregar colaborador</h2><div className="form-grid"><label>Email<input name="email" type="email" required /></label><label>Rol<select name="role"><option value="editor">Editor</option><option value="viewer">Solo lectura</option></select></label></div><p className="dynamic-help">Recibirá un email y podrá ingresar con el número de pedido y su propia dirección.</p>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setShowModal(false)}>Cancelar</button><button className="primary-button small" disabled={saving}>{saving ? "Enviando…" : "Enviar invitación"}</button></div></form></div>}
  </>;
}

function Admin({ onLogout, order }: { onLogout: () => void; order: AdminOrder }) {
  const [view, setView] = useState("Resumen");
  const [guests, setGuests] = useState(guestsSeed);
  const [mobileNav, setMobileNav] = useState(false);
  const [defaultPhoneCountryCode, setDefaultPhoneCountryCode] = useState(order.defaultPhoneCountryCode || "+598");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const title = useMemo(() => view === "Resumen" ? "Panel principal" : view, [view]);

  const refreshGuests = useCallback(async (showProgress = false) => {
    if (showProgress) setSyncing(true);
    try {
      const response = await fetch("/api/admin/guests", { cache: "no-store" });
      if (!response.ok) return;
      setGuests(((await response.json()) as { guests: Guest[] }).guests);
      setLastSynced(new Date());
    } finally {
      if (showProgress) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refreshGuests(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshGuests();
    }, 30000);
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refreshGuests();
    };
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refreshGuests]);

  const navigate = (item: string) => {
    setView(item);
    setMobileNav(false);
  };

  return (
    <main className="admin-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-top"><Logo compact /><button className="mobile-close" onClick={() => setMobileNav(false)}>×</button></div>
        <div className="event-switcher"><span>{initials(order.eventTitle)}</span><div><strong>{order.eventTitle}</strong><small>Pedido {order.orderNumber}</small></div><button>⌄</button></div>
        <nav>{nav.filter(([item]) => item !== "Configuración" || order.accessRole === "owner").map(([item, icon]) => <button key={item} className={view === item ? "active" : ""} onClick={() => navigate(item)}><span>{icon}</span>{item}{item === "Recordatorios" && guests.filter((guest) => guest.status === "Pendiente").length > 0 && <b>{guests.filter((guest) => guest.status === "Pendiente").length}</b>}</button>)}</nav>
        <div className="sidebar-help"><span>?</span><div><strong>¿Necesitás ayuda?</strong><small>Estamos para acompañarte.</small></div><button>Contactar soporte</button></div>
        <button className="logout" onClick={onLogout}><span>↪</span>Cerrar sesión</button>
      </aside>
      {mobileNav && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} />}
      <section className="admin-main">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)}>☰</button><div><span>{title}</span><small>{lastSynced ? `Sincronizado ${lastSynced.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}` : "Sincronizando datos…"}</small></div><div className="topbar-actions"><button className={`notification sync-button ${syncing ? "syncing" : ""}`} onClick={() => refreshGuests(true)} aria-label="Actualizar datos" title="Actualizar datos">↻</button><div className="admin-user"><span>{initials(order.loginEmail || order.customerName)}</span><div><strong>{order.loginEmail || order.customerName}</strong><small>{order.accessRole === "owner" ? "Propietario" : order.accessRole === "editor" ? "Editor" : "Solo lectura"}</small></div><button>⌄</button></div></div></header>
        <div className="admin-content">
          {view === "Resumen" && <Dashboard guests={guests} onNavigate={navigate} order={order} />}
          {view === "Invitados" && <Guests guests={guests} setGuests={setGuests} defaultPhoneCountryCode={defaultPhoneCountryCode} />}
          {view === "Confirmaciones" && <Confirmations guests={guests} />}
          {view === "Mesas" && <Seating guests={guests} />}
          {["Restricciones", "Canciones", "Recordatorios"].includes(view) && <SimpleModule view={view} guests={guests} setGuests={setGuests} order={order} />}
          {view === "Accesos" && <Accesses order={order} />}
          {view === "Configuración" && <Settings code={defaultPhoneCountryCode} onChange={setDefaultPhoneCountryCode} />}
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
