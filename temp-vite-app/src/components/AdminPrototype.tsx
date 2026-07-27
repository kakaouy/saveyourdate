
import React, { useCallback, useEffect, useRef, useState } from "react";
import "../admin-prototype.css";
import { AdminI18nProvider, adminStatus, adminText, useAdminI18n, type AdminLanguage } from "./admin-i18n";

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
  companions: Array<{ name: string; food: string; identificationType: string; identificationNumber: string }>;
  reminded: string;
  updatedAt: string;
  whatsappStatus?: string;
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
  language: AdminLanguage;
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

const reportDate = (value: string, locale = "es-UY") => value
  ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
  : "—";

function ContextHelp({ title, children }: { title: string; children: React.ReactNode }) {
  return <aside className="context-help"><span aria-hidden="true">?</span><div><strong>{title}</strong><p>{children}</p></div></aside>;
}

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
  const { text: t } = useAdminI18n();
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <img src="/logo.svg" alt="Save Your Date" />
      {!compact && <span>{t("Panel de administración", "Admin dashboard", "Painel administrativo")}</span>}
    </div>
  );
}

function LanguageSwitcher({ value, onChange, compact = false }: { value: AdminLanguage; onChange: (language: AdminLanguage) => void; compact?: boolean }) {
  const labels: Record<AdminLanguage, string> = { es: "Español", en: "English", pt: "Português" };
  return (
    <label className={`language-switcher ${compact ? "is-compact" : ""}`}>
      <span className="visually-hidden">{adminText(value, "Idioma", "Language", "Idioma")}</span>
      <span aria-hidden="true">🌐</span>
      <select value={value} onChange={(event) => onChange(event.target.value as AdminLanguage)} aria-label={adminText(value, "Cambiar idioma", "Change language", "Alterar idioma")}>
        {(Object.keys(labels) as AdminLanguage[]).map((language) => <option key={language} value={language}>{labels[language]}</option>)}
      </select>
    </label>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [language, setLanguage] = useState<AdminLanguage>("es");
  const [languageTouched, setLanguageTouched] = useState(false);
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
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recovering, setRecovering] = useState(false);
  const t = (es: string, en: string, pt: string) => adminText(language, es, en, pt);
  useEffect(() => {
    document.documentElement.lang = language;
    window.sessionStorage.setItem("syd-admin-language", language);
  }, [language]);

  const copySupportEmail = async () => {
    await navigator.clipboard.writeText("hola@saveyourdate.site");
    setEmailCopied(true);
  };

  const recoverAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    setRecovering(true);
    setRecoveryMessage("");
    try {
      const response = await fetch("/api/admin/recover-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos procesar la solicitud.");
      setRecoveryMessage(result.message || "Revisá tu email.");
    } catch (recoveryError) {
      setRecoveryMessage(recoveryError instanceof Error ? recoveryError.message : "No pudimos procesar la solicitud.");
    } finally {
      setRecovering(false);
    }
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
      const result = await response.json() as { challengeId?: string; maskedEmail?: string; language?: "es" | "en" | "pt"; error?: string };
      if (!response.ok || !result.challengeId) throw new Error(result.error || "No pudimos enviar el código.");
      setChallengeId(result.challengeId);
      setMaskedEmail(result.maskedEmail || "");
      if (!languageTouched) setLanguage(result.language || "es");
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
    <AdminI18nProvider language={language}>
    <main className="login-shell">
      <section className="login-story">
        <div className="story-orb story-orb-one" />
        <div className="story-orb story-orb-two" />
        <Logo />
        <div className="story-copy">
          <span className="eyebrow">{t("Tu evento, bajo control", "Your event, under control", "Seu evento sob controle")}</span>
          <h1>{t("Todo listo para disfrutar el gran día.", "Everything ready to enjoy the big day.", "Tudo pronto para aproveitar o grande dia.")}</h1>
          <p>{t("Gestioná invitados, confirmaciones y cada detalle desde un único lugar.", "Manage guests, RSVPs and every detail from one place.", "Gerencie convidados, confirmações e cada detalhe em um só lugar.")}</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-language"><LanguageSwitcher value={language} onChange={(nextLanguage) => { setLanguageTouched(true); setLanguage(nextLanguage); }} /></div>
        <div className="mobile-login-logo"><Logo compact /></div>
        <div className="login-card">
          <div className="login-step">{t("Paso", "Step", "Etapa")} {step === "credentials" ? "1 / 2" : "2 / 2"}</div>
          {step === "credentials" ? (
            <>
              <h2>{t("Ingresá a tu evento", "Access your event", "Acesse seu evento")}</h2>
              <p className="muted">{t("Usá los datos asociados a tu pedido.", "Use the details associated with your order.", "Use os dados associados ao seu pedido.")}</p>
              <label>
                {t("Número de pedido", "Order number", "Número do pedido")}
                <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder={t("Ej. SYD-ABCD-1234", "E.g. SYD-ABCD-1234", "Ex. SYD-ABCD-1234")} aria-label={t("Número de pedido", "Order number", "Número do pedido")} />
              </label>
              <div className="segmented" aria-label="Tipo de contacto">
                <button className={contact === "email" ? "active" : ""} onClick={() => setContact("email")}>Email</button>
                <button className={contact === "whatsapp" ? "active" : ""} onClick={() => setContact("whatsapp")}>WhatsApp</button>
              </div>
              <label>
                {contact === "email" ? t("Email registrado", "Registered email", "Email cadastrado") : t("WhatsApp registrado", "Registered WhatsApp", "WhatsApp cadastrado")}
                <input value={contactValue} onChange={(event) => setContactValue(event.target.value)} placeholder={contact === "email" ? t("nombre@ejemplo.com", "name@example.com", "nome@exemplo.com") : "099 123 456"} aria-label={t("Contacto registrado", "Registered contact", "Contato cadastrado")} />
              </label>
              {error && <p className="login-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy || !orderNumber || !contactValue} onClick={requestCode}>{busy ? t("Enviando…", "Sending…", "Enviando…") : t("Continuar", "Continue", "Continuar")} <span>→</span></button>
              <p className="security-note"><span>✓</span> {t("Tus datos están protegidos y nunca compartimos la información del evento.", "Your data is protected and we never share your event information.", "Seus dados estão protegidos e nunca compartilhamos as informações do evento.")}</p>
            </>
          ) : (
            <>
              <button className="back-link" onClick={() => setStep("credentials")}>← {t("Volver", "Back", "Voltar")}</button>
              <h2>{language === "en" ? "Check your email" : language === "pt" ? "Verifique seu e-mail" : "Revisá tu email"}</h2>
              <p className="muted">{language === "en" ? "We sent a security code to" : language === "pt" ? "Enviamos um código de segurança para" : "Enviamos un código de seguridad a"} <strong>{maskedEmail}</strong>.</p>
              <label>
                {language === "en" ? "6-digit code" : language === "pt" ? "Código de 6 dígitos" : "Código de 6 dígitos"}
                <input className="code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} aria-label="Código de seguridad" />
              </label>
              <div className="code-meta"><span>{language === "en" ? "Expires in 10 minutes" : language === "pt" ? "Expira em 10 minutos" : "Vence en 10 minutos"}</span><button disabled={busy} onClick={requestCode}>{language === "en" ? "Resend code" : language === "pt" ? "Reenviar código" : "Reenviar código"}</button></div>
              {error && <p className="login-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy || code.length !== 6} onClick={verifyCode}>{busy ? t("Validando…", "Verifying…", "Validando…") : t("Ingresar a mi evento", "Open my event", "Entrar no meu evento")} <span>→</span></button>
              <p className="security-note"><span>✓</span> {t("La sesión permanecerá activa durante 24 horas.", "Your session will remain active for 24 hours.", "Sua sessão permanecerá ativa por 24 horas.")}</p>
            </>
          )}
          <button className="help-link" type="button" onClick={() => setShowHelp(true)}>{t("¿Necesitás ayuda con tu acceso?", "Need help signing in?", "Precisa de ajuda para acessar?")}</button>
        </div>
      </section>
      {showHelp && (
        <div className="modal-backdrop" onMouseDown={() => setShowHelp(false)}>
          <div className="modal access-help-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowHelp(false)} aria-label={t("Cerrar ayuda", "Close help", "Fechar ajuda")}>×</button>
            <span className="eyebrow">{t("Ayuda de acceso", "Access help", "Ajuda de acesso")}</span>
            <h2>{t("¿No podés ingresar?", "Can't sign in?", "Não consegue acessar?")}</h2>
            <p>{t("Encontrás el número de pedido en el email de confirmación de Save Your Date. Ingresá también el mismo email o WhatsApp que usaste al realizar el pedido.", "Your order number is in the Save Your Date confirmation email. Use the same email or WhatsApp number used for the order.", "O número do pedido está no email de confirmação da Save Your Date. Use também o mesmo email ou WhatsApp utilizado no pedido.")}</p>
            <form className="recovery-form" onSubmit={recoverAccess}>
              <label>{t("Email asociado", "Associated email", "Email associado")}<input type="email" required value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder={t("nombre@ejemplo.com", "name@example.com", "nome@exemplo.com")} /></label>
              <button className="primary-button small" disabled={recovering}>{recovering ? t("Buscando…", "Searching…", "Buscando…") : t("Recuperar número de pedido", "Recover order number", "Recuperar número do pedido")}</button>
              {recoveryMessage && <p className="settings-message" role="status">{recoveryMessage}</p>}
            </form>
            <div className="support-email">
              <span>{t("Soporte por email", "Email support", "Suporte por email")}</span>
              <strong>hola@saveyourdate.site</strong>
              <button type="button" onClick={copySupportEmail}>{emailCopied ? t("Email copiado ✓", "Email copied ✓", "Email copiado ✓") : t("Copiar email", "Copy email", "Copiar email")}</button>
            </div>
            <p className="support-note">{t("Si nos escribís, incluí tu nombre y cualquier dato que ayude a localizar el pedido. Nunca te vamos a pedir una contraseña.", "If you contact us, include your name and any details that help locate the order. We will never ask for a password.", "Ao entrar em contato, inclua seu nome e qualquer dado que ajude a localizar o pedido. Nunca pediremos uma senha.")}</p>
            <div className="modal-actions">
              <button className="outline-button" type="button" onClick={() => setShowHelp(false)}>{t("Volver al ingreso", "Back to sign in", "Voltar ao acesso")}</button>
              <a className="primary-button small" href="mailto:hola@saveyourdate.site?subject=Ayuda%20con%20el%20acceso%20al%20panel">{t("Escribir a soporte", "Contact support", "Falar com o suporte")}</a>
            </div>
          </div>
        </div>
      )}
    </main>
    </AdminI18nProvider>
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
  const { language } = useAdminI18n();
  return <span className={`status status-${value.toLowerCase().replace(" ", "-")}`}>{adminStatus(language, value)}</span>;
}

function Dashboard({ guests, onNavigate, order, canEdit }: { guests: Guest[]; onNavigate: (view: string) => void; order: AdminOrder; canEdit: boolean }) {
  const { text: t } = useAdminI18n();
  const confirmed = guests.reduce((total, guest) => total + guest.confirmed, 0);
  const seats = guests.reduce((total, guest) => total + guest.seats, 0);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter((guest) => guest.status === "No asiste").length;
  const restrictions = guests.reduce((total, guest) => total
    + (guest.food !== "—" && guest.food !== "Ninguna" ? 1 : 0)
    + guest.companions.filter((companion) => companion.food).length, 0);
  const songs = guests.filter((guest) => guest.song !== "—").length;
  const responseRate = guests.length
    ? Math.round(((guests.length - pending) / guests.length) * 100)
    : 0;
  const recentGuests = [...guests]
    .filter((guest) => guest.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const activityCopy = (guest: Guest) => {
    if (guest.status === "Confirmado") return { title: `${guest.name} confirmó asistencia`, detail: `${guest.confirmed} ${guest.confirmed === 1 ? "persona" : "personas"} confirmadas`, tone: "avatar-mint" };
    if (guest.status === "No asiste") return { title: `${guest.name} no asistirá`, detail: "La respuesta quedó registrada", tone: "avatar-coral" };
    const remindedRecently = guest.reminded !== "—" && Math.abs(new Date(guest.reminded).getTime() - new Date(guest.updatedAt).getTime()) < 5000;
    if (remindedRecently) return { title: `Recordatorio enviado a ${guest.name}`, detail: guest.phone || "WhatsApp sin registrar", tone: "avatar-blue" };
    return { title: `${guest.name} fue actualizado`, detail: guest.group || "Sin grupo asignado", tone: "avatar-blue" };
  };
  const relativeTime = (value: string) => {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.round(hours / 24);
    return `Hace ${days} d`;
  };
  const guide = order.language === "en"
    ? ["Quick start", "An invitation is one guest group; seats are the people allowed in that group.", ["Guests", "Confirmations", "Tables", "Reminders", "Backup"]]
    : order.language === "pt"
      ? ["Início rápido", "Um convite representa um grupo; as vagas são as pessoas permitidas nesse grupo.", ["Convidados", "Confirmações", "Mesas", "Lembretes", "Backup"]]
      : ["Inicio rápido", "Una invitación representa un grupo; los cupos son las personas permitidas dentro de ese grupo.", ["Invitados", "Confirmaciones", "Mesas", "Recordatorios", "Respaldo"]];

  return (
    <>
      <section className="panel getting-started-panel">
        <div><span className="eyebrow">{guide[0] as string}</span><p>{guide[1] as string}</p></div>
        <nav>{(guide[2] as string[]).map((label, index) => <button key={label} onClick={() => onNavigate(index === 4 ? "Configuración" : ["Invitados", "Confirmaciones", "Mesas", "Recordatorios"][index])}><b>{index + 1}</b>{label}<span>→</span></button>)}</nav>
      </section>
      <div className="page-heading">
        <div><span className="eyebrow">{order.eventType} · {formatEventDate(order.eventDate)}</span><h1>{t("Buenas tardes", "Good afternoon", "Boa tarde")}, {order.customerName.split(" ")[0]}</h1><p>{t("Este es el estado de tu evento hoy.", "This is your event status today.", "Este é o estado do seu evento hoje.")}</p></div>
        {canEdit && <button className="outline-button" onClick={() => onNavigate("Invitados")}>＋ {t("Agregar invitado", "Add guest", "Adicionar convidado")}</button>}
      </div>

      <section className="metrics-grid">
        <Metric label={t("Cupos asignados", "Assigned seats", "Vagas atribuídas")} value={String(seats)} note={`${guests.length} ${t("grupos cargados", "groups added", "grupos adicionados")}`} tone="blue" />
        <Metric label={t("Confirmados", "Confirmed", "Confirmados")} value={String(confirmed)} note={`${confirmed} ${t("respuestas positivas", "positive responses", "respostas positivas")}`} tone="green" />
        <Metric label={t("Pendientes", "Pending", "Pendentes")} value={String(pending)} note={t("Requieren seguimiento", "Need follow-up", "Precisam de acompanhamento")} tone="amber" />
        <Metric label={t("No asisten", "Not attending", "Não comparecem")} value={String(declined)} note={`${responseRate}% ${t("de respuesta total", "total response rate", "de resposta total")}`} tone="coral" />
      </section>

      <section className="dashboard-grid">
        <article className="panel response-panel">
          <div className="panel-title"><div><h2>{t("Estado de confirmaciones", "RSVP status", "Status das confirmações")}</h2><p>{t("Respuesta sobre el total de invitaciones", "Responses across all invitations", "Respostas sobre o total de convites")}</p></div><span className="panel-context">{t("Estado actual", "Current status", "Status atual")}</span></div>
          <div className="response-content">
            <div className="donut" style={{ "--rate": `${responseRate * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{responseRate}%</strong><span>{t("respondió", "replied", "respondeu")}</span></div>
            </div>
            <div className="legend">
              <div><i className="dot dot-green" /><span>{t("Confirmados", "Confirmed", "Confirmados")}</span><strong>{confirmed}</strong></div>
              <div><i className="dot dot-amber" /><span>{t("Pendientes", "Pending", "Pendentes")}</span><strong>{pending}</strong></div>
              <div><i className="dot dot-coral" /><span>{t("No asisten", "Declined", "Não comparecem")}</span><strong>{declined}</strong></div>
            </div>
          </div>
        </article>

        <article className="panel next-actions">
          <div className="panel-title"><div><h2>{t("Próximas acciones", "Next actions", "Próximas ações")}</h2><p>{t("Recomendaciones para avanzar", "Recommended next steps", "Recomendações para avançar")}</p></div></div>
          <button onClick={() => onNavigate("Recordatorios")}><span className="action-icon action-yellow">↗</span><div><strong>{t("Enviar recordatorios", "Send reminders", "Enviar lembretes")}</strong><small>{pending} {t("invitados todavía no respondieron", "guests have not replied yet", "convidados ainda não responderam")}</small></div><b>→</b></button>
          <button onClick={() => onNavigate("Restricciones")}><span className="action-icon action-coral">◇</span><div><strong>{t("Revisar restricciones", "Review dietary needs", "Revisar restrições")}</strong><small>{restrictions} {t("requerimientos alimentarios", "dietary requirements", "restrições alimentares")}</small></div><b>→</b></button>
          <button onClick={() => onNavigate("Canciones")}><span className="action-icon action-blue">♫</span><div><strong>{t("Armar playlist", "Build playlist", "Montar playlist")}</strong><small>{songs} {t("canciones sugeridas", "suggested songs", "músicas sugeridas")}</small></div><b>→</b></button>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-title"><div><h2>{t("Actividad reciente", "Recent activity", "Atividade recente")}</h2><p>{t("Últimas respuestas y cambios", "Latest responses and changes", "Últimas respostas e alterações")}</p></div><button onClick={() => onNavigate("Confirmaciones")}>{t("Ver todas", "View all", "Ver todas")} →</button></div>
        <div className="activity-list">{recentGuests.length === 0
          ? <div><p><strong>{t("Todavía no hay actividad", "No activity yet", "Ainda não há atividade")}</strong><small>{t("Los cambios aparecerán cuando agregues invitados y recibas respuestas.", "Changes will appear as you add guests and receive responses.", "As alterações aparecerão quando você adicionar convidados e receber respostas.")}</small></p></div>
          : recentGuests.map((guest) => {
            const activity = activityCopy(guest);
            return <div key={guest.id}><span className={`avatar ${activity.tone}`}>{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{activity.title}</strong><small>{activity.detail}</small></p><time dateTime={guest.updatedAt} title={reportDate(guest.updatedAt)}>{relativeTime(guest.updatedAt)}</time></div>;
          })}
        </div>
      </section>
    </>
  );
}

function Guests({ guests, setGuests, defaultPhoneCountryCode, canEdit }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; defaultPhoneCountryCode: string; canEdit: boolean }) {
  const { text: t, language } = useAdminI18n();
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
    const guest = guests.find((item) => item.id === id);
    if (!window.confirm(t(
      `¿Eliminar a ${guest?.name || "este invitado"}? Esta acción también quitará su enlace personalizado.`,
      `Delete ${guest?.name || "this guest"}? Their personalized link will also be removed.`,
      `Excluir ${guest?.name || "este convidado"}? O link personalizado também será removido.`
    ))) return;
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
    [t("Nombre", "Name", "Nome"), t("Grupo", "Group", "Grupo"), "WhatsApp", t("Código país", "Country code", "Código do país"), t("Cupos", "Seats", "Vagas"), "Email", t("Tipo identificación", "ID type", "Tipo de identificação"), t("Identificación", "ID number", "Identificação")],
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
      <div className="page-heading"><div><span className="eyebrow">{t("Gestión del evento", "Event management", "Gestão do evento")}</span><h1>{t("Invitados", "Guests", "Convidados")}</h1><p>{canEdit ? t("Administrá grupos, cupos y enlaces personalizados.", "Manage groups, seats and personalized links.", "Gerencie grupos, vagas e links personalizados.") : t("Consultá grupos, cupos y enlaces personalizados.", "View groups, seats and personalized links.", "Consulte grupos, vagas e links personalizados.")}</p></div>{canEdit && <button className="primary-button small" onClick={() => setShowModal(true)}>＋ {t("Agregar invitado", "Add guest", "Adicionar convidado")}</button>}</div>
      <ContextHelp title={t("Cómo funciona una invitación", "How an invitation works", "Como funciona um convite")}>
        {t("Cada registro representa una invitación. Los cupos indican cuántas personas pueden confirmar con ese mismo enlace personalizado.", "Each record represents one invitation. Seats indicate how many people can RSVP through that personalized link.", "Cada registro representa um convite. As vagas indicam quantas pessoas podem confirmar pelo mesmo link personalizado.")}
      </ContextHelp>
      <section className="panel table-panel">
        <div className="table-tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado o grupo…", "Search guest or group…", "Buscar convidado ou grupo…")} /></label>
          <div className="filter-pills">{["Todos", "Confirmado", "Pendiente", "No asiste"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "Todos" ? t("Todos", "All", "Todos") : adminStatus(language, item)}</button>)}</div>
          {canEdit && <div className="import-actions"><button className="copy-button" onClick={downloadTemplate}>{t("Plantilla", "Template", "Modelo")}</button><button className="outline-button compact" disabled={saving} onClick={() => importInput.current?.click()}>{saving ? t("Importando…", "Importing…", "Importando…") : `⇩ ${t("Importar CSV", "Import CSV", "Importar CSV")}`}</button><input ref={importInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv} /></div>}
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>{t("Invitado", "Guest", "Convidado")}</th><th>{t("Grupo", "Group", "Grupo")}</th><th>{t("Cupos", "Seats", "Vagas")}</th><th>{t("Estado", "Status", "Status")}</th><th>{t("Restricción", "Dietary need", "Restrição")}</th><th>{t("Enlace", "Link", "Link")}</th>{canEdit && <th />}</tr></thead>
            <tbody>{filtered.map((guest) => (
              <tr key={guest.id}>
                <td><div className="person"><span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{guest.name}</strong><small>{guest.phone}</small></p></div></td>
                <td>{guest.group}</td><td>{guest.confirmed}/{guest.seats}</td><td>{canEdit ? <select className={`status-select status-${guest.status.toLowerCase().replace(" ", "-")}`} value={guest.status} disabled={updatingId === guest.id} onChange={(event) => updateStatus(guest, event.target.value as Guest["status"])} aria-label={`${t("Estado de", "Status for", "Status de")} ${guest.name}`}><option value="Confirmado">{adminStatus(language, "Confirmado")}</option><option value="Pendiente">{adminStatus(language, "Pendiente")}</option><option value="No asiste">{adminStatus(language, "No asiste")}</option></select> : <Status value={guest.status} />}</td><td>{guest.food}</td>
                <td><button className="copy-button" onClick={() => copyInviteLink(guest)}>{copiedId === guest.id ? t("¡Copiado!", "Copied!", "Copiado!") : t("Copiar link", "Copy link", "Copiar link")}</button></td>{canEdit && <td><div className="row-actions"><button className="copy-button" onClick={() => setEditingGuest(guest)}>{t("Editar", "Edit", "Editar")}</button><button className="more-button" onClick={() => deleteGuest(guest.id)} aria-label={`${t("Eliminar a", "Delete", "Excluir")} ${guest.name}`}>{t("Eliminar", "Delete", "Excluir")}</button></div></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
        {notice && <p className="import-success" role="status">{notice}</p>}
        {error && <p className="table-error" role="alert">{error}</p>}
        <div className="table-footer"><span>{t(`Mostrando ${filtered.length} de ${guests.length} invitados`, `Showing ${filtered.length} of ${guests.length} guests`, `Mostrando ${filtered.length} de ${guests.length} convidados`)}</span></div>
      </section>
      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}><form className="modal" onSubmit={addGuest} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowModal(false)}>×</button><span className="eyebrow">{t("Nuevo registro", "New record", "Novo registro")}</span><h2>{t("Agregar invitado", "Add guest", "Adicionar convidado")}</h2><div className="form-grid"><label>{t("Nombre y apellido", "Full name", "Nome completo")}<input name="name" required /></label><label>{t("Grupo", "Group", "Grupo")}<input name="group" placeholder={t("Ej. Familia", "E.g. Family", "Ex. Família")} /></label><label>{t("País de WhatsApp", "WhatsApp country", "País do WhatsApp")}<select value={countryCodes.some(([, code]) => code === newGuestCode) ? newGuestCode : "custom"} onChange={(event) => { const code = event.target.value; setNewGuestCode(code); if (code !== "custom") setNewIdentificationType(suggestedIdentification(code)); }}>{countryCodes.map(([country, code]) => <option key={code} value={code}>{country} {code}</option>)}<option value="custom">{t("Otro país", "Other country", "Outro país")}</option></select></label>{newGuestCode === "custom" && <label>{t("Código internacional", "International code", "Código internacional")}<input value={customGuestCode} onChange={(event) => setCustomGuestCode(event.target.value)} placeholder="+___" required /></label>}<label>WhatsApp<input name="phone" inputMode="tel" placeholder="99 123 456" /></label><label>{t("Cupos", "Seats", "Vagas")}<input name="seats" type="number" min="1" max="20" defaultValue="1" /></label><label>Email<input name="email" type="email" /></label><label>{t("Tipo de identificación", "ID type", "Tipo de identificação")}<select name="identificationType" value={newIdentificationType} onChange={(event) => setNewIdentificationType(event.target.value)}><option value="">{t("Sin identificación", "No ID", "Sem identificação")}</option><option>CI</option><option>DNI</option><option>CPF</option><option>{t("Pasaporte", "Passport", "Passaporte")}</option><option>{t("Otro", "Other", "Outro")}</option></select></label><label>{t("Número de identificación", "ID number", "Número de identificação")}<input name="identificationNumber" placeholder={t("Opcional", "Optional", "Opcional")} /></label></div>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setShowModal(false)}>{t("Cancelar", "Cancel", "Cancelar")}</button><button className="primary-button small" type="submit" disabled={saving}>{saving ? t("Guardando…", "Saving…", "Salvando…") : t("Guardar invitado", "Save guest", "Salvar convidado")}</button></div></form></div>}
      {editingGuest && <div className="modal-backdrop" onMouseDown={() => setEditingGuest(null)}><form className="modal" onSubmit={updateDetails} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setEditingGuest(null)}>×</button><span className="eyebrow">Información del invitado</span><h2>Editar a {editingGuest.name}</h2><div className="form-grid"><label>Código de país<input name="phoneCountryCode" defaultValue={editingGuest.phoneCountryCode || defaultPhoneCountryCode} placeholder="+598" required /></label><label>WhatsApp<input name="phone" inputMode="tel" defaultValue={editingGuest.phone.replace(editingGuest.phoneCountryCode || defaultPhoneCountryCode, "")} /></label><label>Tipo de identificación<select name="identificationType" defaultValue={editingGuest.identificationType}><option value="">Sin identificación</option><option>CI</option><option>DNI</option><option>CPF</option><option>Pasaporte</option><option>Otro</option></select></label><label>Número de identificación<input name="identificationNumber" defaultValue={editingGuest.identificationNumber} placeholder="Opcional" /></label><label>Restricción alimentaria<input name="food" defaultValue={editingGuest.food === "—" ? "" : editingGuest.food} placeholder="Ej. Vegetariano, celíaco…" /></label><label>Canción sugerida<input name="song" defaultValue={editingGuest.song === "—" ? "" : editingGuest.song} placeholder="Canción — Artista" /></label></div>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setEditingGuest(null)}>Cancelar</button><button className="primary-button small" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button></div></form></div>}
    </>
  );
}

function Confirmations({ guests }: { guests: Guest[] }) {
  const { text: t, locale, language } = useAdminI18n();
  const confirmed = guests.reduce((total, guest) => total + guest.confirmed, 0);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter((guest) => guest.status === "No asiste").length;
  const exportReport = () => exportCsv(
    `confirmaciones-${new Date().toISOString().slice(0, 10)}.csv`,
    [t("Invitado", "Guest", "Convidado"), t("Grupo", "Group", "Grupo"), t("Estado", "Status", "Status"), t("Cupos asignados", "Assigned seats", "Vagas atribuídas"), t("Personas confirmadas", "Confirmed people", "Pessoas confirmadas"), "WhatsApp", t("Tipo identificación", "ID type", "Tipo de identificação"), t("Identificación", "ID number", "Identificação"), t("Restricción", "Dietary need", "Restrição"), t("Canción", "Song", "Música"), t("Última actualización", "Last update", "Última atualização")],
    guests.flatMap((guest) => [
      [guest.name, guest.group, adminStatus(language, guest.status), guest.seats, guest.confirmed, guest.phone, guest.identificationType, guest.identificationNumber, guest.food, guest.song, reportDate(guest.updatedAt, locale)],
      ...guest.companions.map((companion) => [`↳ ${companion.name}`, guest.group, adminStatus(language, guest.status), "", "", "", companion.identificationType, companion.identificationNumber, companion.food || t("Ninguna", "None", "Nenhuma"), "", reportDate(guest.updatedAt, locale)])
    ])
  );
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">{t("Respuestas RSVP", "RSVP responses", "Respostas RSVP")}</span><h1>{t("Confirmaciones", "RSVPs", "Confirmações")}</h1><p>{t("Consultá las respuestas recibidas y su información asociada.", "Review received responses and their associated information.", "Consulte as respostas recebidas e suas informações.")}</p></div><button className="outline-button" onClick={exportReport}>⇩ {t("Exportar reporte", "Export report", "Exportar relatório")}</button></div>
      <section className="metrics-grid mini">
        <Metric label={t("Confirmaron", "Confirmed", "Confirmaram")} value={String(confirmed)} note={t("Personas", "People", "Pessoas")} tone="green" />
        <Metric label={t("Pendientes", "Pending", "Pendentes")} value={String(pending)} note={t("Invitaciones", "Invitations", "Convites")} tone="amber" />
        <Metric label={t("No asisten", "Declined", "Não comparecem")} value={String(declined)} note={t("Invitaciones", "Invitations", "Convites")} tone="coral" />
      </section>
      <section className="panel table-panel">
        <div className="table-scroll"><table><thead><tr><th>{t("Invitado", "Guest", "Convidado")}</th><th>{t("Respuesta", "Response", "Resposta")}</th><th>{t("Grupo confirmado", "Confirmed group", "Grupo confirmado")}</th><th>{t("Restricción", "Dietary need", "Restrição")}</th><th>{t("Canción", "Song", "Música")}</th><th>{t("Fecha", "Date", "Data")}</th></tr></thead>
        <tbody>{guests.filter((guest) => guest.status !== "Pendiente").map((guest) => <React.Fragment key={guest.id}><tr className="primary-guest-row"><td><span className="guest-role-badge primary-role">{t("Invitación principal", "Primary invitation", "Convite principal")}</span><strong>{guest.name}</strong><small className="cell-sub">{guest.group}</small></td><td><Status value={guest.status} /></td><td><strong>{guest.confirmed} {guest.confirmed === 1 ? t("persona", "person", "pessoa") : t("personas", "people", "pessoas")}</strong><small className="cell-sub">{t("Total de esta invitación", "Total for this invitation", "Total deste convite")}</small></td><td>{guest.food}</td><td>{guest.song}</td><td>{reportDate(guest.updatedAt, locale)}</td></tr>{guest.companions.map((companion, index) => <tr className="companion-row" key={`${guest.id}-${index}`}><td><span className="guest-role-badge companion-role">{t("Acompañante", "Companion", "Acompanhante")}</span><strong>{companion.name}</strong><small className="cell-sub">{t("Invitado por", "Invited by", "Convidado por")} {guest.name}</small></td><td><Status value={guest.status} /></td><td><span className="included-in-group">{t("Incluido en el total", "Included in total", "Incluído no total")} ↑</span></td><td>{companion.food || t("Ninguna", "None", "Nenhuma")}</td><td>—</td><td>{reportDate(guest.updatedAt, locale)}</td></tr>)}</React.Fragment>)}</tbody></table></div>
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

function Seating({ guests, canEdit }: { guests: Guest[]; canEdit: boolean }) {
  const { text: t } = useAdminI18n();
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
    const table = tables.find((item) => item.id === tableId);
    if (!window.confirm(`¿Eliminar ${table?.name || "esta mesa"}? Sus invitados quedarán sin mesa asignada.`)) return;
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
        <div><span className="eyebrow">{t("Distribución del salón", "Venue layout", "Distribuição do salão")}</span><h1>{t("Organización de mesas", "Table plan", "Organização de mesas")}</h1><p>{canEdit ? t("Asigná invitados confirmados y controlá la capacidad de cada mesa.", "Assign confirmed guests and control each table's capacity.", "Atribua convidados confirmados e controle a capacidade de cada mesa.") : t("Consultá la distribución y capacidad de las mesas.", "View table distribution and capacity.", "Consulte a distribuição e capacidade das mesas.")}</p></div>
        {canEdit && <button className="primary-button small" onClick={openNew}>＋ {t("Agregar mesa", "Add table", "Adicionar mesa")}</button>}
      </div>
      <ContextHelp title={t("Antes de asignar", "Before assigning", "Antes de atribuir")}>{t("Sólo aparecen invitaciones confirmadas. La capacidad cuenta a todas las personas confirmadas dentro de cada grupo.", "Only confirmed invitations appear. Capacity counts every confirmed person within each group.", "Apenas convites confirmados aparecem. A capacidade conta todas as pessoas confirmadas de cada grupo.")}</ContextHelp>
      {loading && <p className="module-notice">{t("Cargando organización de mesas…", "Loading table plan…", "Carregando organização das mesas…")}</p>}
      {error && <p className="table-error seating-error" role="alert">{error}</p>}

      <section className="seating-summary">
        <article><span>{t("Mesas creadas", "Tables created", "Mesas criadas")}</span><strong>{tables.length}</strong><small>{totalCapacity} {t("lugares disponibles", "available seats", "lugares disponíveis")}</small></article>
        <article><span>{t("Personas ubicadas", "People seated", "Pessoas alocadas")}</span><strong>{assignedPeople}</strong><small>{t("de", "of", "de")} {totalConfirmed} {t("confirmadas", "confirmed", "confirmadas")}</small></article>
        <article className={unassigned.length ? "summary-warning" : ""}><span>{t("Sin asignar", "Unassigned", "Sem atribuição")}</span><strong>{totalConfirmed - assignedPeople}</strong><small>{unassigned.length ? t("Requiere atención", "Needs attention", "Requer atenção") : t("Todos tienen mesa", "Everyone has a table", "Todos têm mesa")}</small></article>
      </section>

      <div className="seating-layout">
        <aside className="panel unassigned-panel">
          <div className="panel-title"><div><h2>{t("Invitados confirmados", "Confirmed guests", "Convidados confirmados")}</h2><p>{t("Asigná cada grupo a una mesa", "Assign each group to a table", "Atribua cada grupo a uma mesa")}</p></div><span className="count-badge">{confirmedGuests.length}</span></div>
          <div className="guest-assign-list">
            {confirmedGuests.map((guest) => {
              const currentTable = tables.find((table) => table.guests.includes(guest.id));
              return (
                <div key={guest.id} className={currentTable ? "guest-assigned" : ""}>
                  <span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  <p><strong>{guest.name}</strong><small>{guest.confirmed} {guest.confirmed === 1 ? t("persona", "person", "pessoa") : t("personas", "people", "pessoas")} · {guest.group}</small></p>
                  <select value={currentTable?.id ?? ""} disabled={!canEdit} onChange={(event) => event.target.value ? assignGuest(guest.id, event.target.value) : unassignGuest(guest.id)} aria-label={`${t("Mesa de", "Table for", "Mesa de")} ${guest.name}`}>
                    <option value="">{t("Sin mesa", "No table", "Sem mesa")}</option>
                    {tables.map((table) => {
                      const occupied = table.guests.reduce((total, id) => total + (guests.find((item) => item.id === id)?.confirmed ?? 0), 0);
                      const available = table.capacity - occupied;
                      const lacksSpace = table.id !== currentTable?.id && available < guest.confirmed;
                      return <option key={table.id} value={table.id} disabled={lacksSpace}>{table.name}{lacksSpace ? ` · ${t("faltan", "needs", "faltam")} ${guest.confirmed - available} ${t("lugares", "seats", "lugares")}` : ` · ${available} ${t("libres", "free", "livres")}`}</option>;
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="tables-workspace">
          <div className="workspace-heading"><div><h2>{t("Plano de mesas", "Table layout", "Plano de mesas")}</h2><p>{t("La capacidad se calcula según las personas confirmadas de cada grupo.", "Capacity is calculated from confirmed people in each group.", "A capacidade é calculada pelas pessoas confirmadas de cada grupo.")}</p></div><span>{t("Actualización automática", "Automatic updates", "Atualização automática")}</span></div>
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
                    <div><h3>{table.name}</h3><p>{table.note || t("Sin observaciones", "No notes", "Sem observações")}</p></div>
                    {canEdit && <button onClick={() => openEdit(table)} aria-label={`Editar ${table.name}`}>•••</button>}
                  </div>
                  <div className="capacity-row"><span>{occupied} {t("de", "of", "de")} {table.capacity} {t("lugares", "seats", "lugares")}</span><strong>{over ? `${Math.abs(remaining)} ${t("de más", "over", "a mais")}` : full ? t("Completa", "Full", "Completa") : `${remaining} ${t("libres", "free", "livres")}`}</strong></div>
                  <div className="capacity-bar"><i style={{ width: `${Math.min(100, (occupied / table.capacity) * 100)}%` }} /></div>
                  <div className="seated-guests">
                    {tableGuests.map((guest) => <div key={guest.id}><span>{guest.name}</span><small>{guest.confirmed} {t("lugares", "seats", "lugares")}</small>{canEdit && <button onClick={() => unassignGuest(guest.id)} aria-label={`${t("Quitar a", "Remove", "Remover")} ${guest.name}`}>×</button>}</div>)}
                    {!tableGuests.length && (canEdit ? <button className="empty-table" onClick={() => document.querySelector<HTMLSelectElement>(".guest-assign-list select")?.focus()}>＋ {t("Asignar invitados", "Assign guests", "Atribuir convidados")}</button> : <span className="empty-table">{t("Sin invitados asignados", "No assigned guests", "Sem convidados atribuídos")}</span>)}
                  </div>
                  {over && <div className="capacity-alert">{t("La mesa supera la capacidad configurada.", "This table exceeds its configured capacity.", "A mesa excede a capacidade configurada.")}</div>}
                </article>
              );
            })}
            {canEdit && <button className="add-table-card" onClick={openNew}><span>＋</span><strong>{t("Agregar otra mesa", "Add another table", "Adicionar outra mesa")}</strong><small>{t("Definí nombre y capacidad", "Set its name and capacity", "Defina nome e capacidade")}</small></button>}
          </div>
        </section>
      </div>

      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
        <div className="modal table-modal" onMouseDown={(event) => event.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          <span className="eyebrow">{editing ? t("Configuración", "Settings", "Configuração") : t("Nueva mesa", "New table", "Nova mesa")}</span>
          <h2>{editing ? t("Editar mesa", "Edit table", "Editar mesa") : t("Agregar mesa", "Add table", "Adicionar mesa")}</h2>
          <div className="form-grid">
            <label>{t("Nombre o número", "Name or number", "Nome ou número")}<input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder={t("Ej. Mesa Familia", "E.g. Family table", "Ex. Mesa Família")} /></label>
            <label>{t("Cantidad de personas", "Number of people", "Quantidade de pessoas")}<input type="number" min={editing ? editing.guests.reduce((total, id) => total + (guests.find((guest) => guest.id === id)?.confirmed ?? 0), 0) || 1 : 1} max="30" value={capacity} onChange={(event) => setCapacity(Math.max(1, Number(event.target.value)))} /></label>
          </div>
          <label className="modal-note">{t("Ubicación u observaciones", "Location or notes", "Localização ou observações")}<input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("Ej. Cerca de la pista", "E.g. Near the dance floor", "Ex. Perto da pista")} /></label>
          <div className="modal-actions table-modal-actions">
            {editing && <button className="delete-button" disabled={saving} onClick={() => deleteTable(editing.id)}>{t("Eliminar mesa", "Delete table", "Excluir mesa")}</button>}
            <span />
            <button className="outline-button" onClick={() => setShowModal(false)}>{t("Cancelar", "Cancel", "Cancelar")}</button>
            <button className="primary-button small" disabled={saving} onClick={saveTable}>{saving ? t("Guardando…", "Saving…", "Salvando…") : editing ? t("Guardar cambios", "Save changes", "Salvar alterações") : t("Crear mesa", "Create table", "Criar mesa")}</button>
          </div>
        </div>
      </div>}
    </>
  );
}

function SimpleModule({ view, guests, setGuests, canEdit }: { view: string; guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; canEdit: boolean }) {
  const { text: t, locale, language } = useAdminI18n();
  const [remindingId, setRemindingId] = useState("");
  const [moduleError, setModuleError] = useState("");
  const restrictions = guests.flatMap((guest) => [
    ...(guest.food !== "—" && guest.food !== "Ninguna" ? [guest] : []),
    ...guest.companions
      .map((companion, index) => ({ ...guest, id: `${guest.id}-companion-${index}`, name: companion.name, food: companion.food || "Ninguna", confirmed: 1 }))
      .filter((companion) => companion.food !== "Ninguna")
  ]);
  const songs = guests.filter((g) => g.song !== "—");
  const pending = guests.filter((g) => g.status === "Pendiente");
  const reminded = pending.filter((g) => g.reminded !== "—");
  const content = {
    Restricciones: { eyebrow: "", title: "", description: "", stats: [[t("Registradas", "Recorded", "Registradas"), String(restrictions.length)], [t("Personas", "People", "Pessoas"), String(restrictions.reduce((total, guest) => total + (guest.confirmed || 1), 0))], [t("Pendientes", "Pending", "Pendentes"), String(restrictions.filter((guest) => guest.status === "Pendiente").length)]], rows: restrictions, headers: [t("Invitado", "Guest", "Convidado"), t("Grupo", "Group", "Grupo"), t("Restricción", "Dietary need", "Restrição"), t("Personas", "People", "Pessoas")] },
    Canciones: { eyebrow: "", title: "", description: "", stats: [[t("Sugeridas", "Suggested", "Sugeridas"), String(songs.length)], [t("Con respuesta", "With response", "Com resposta"), String(songs.filter((guest) => guest.status !== "Pendiente").length)], [t("Pendientes", "Pending", "Pendentes"), String(songs.filter((guest) => guest.status === "Pendiente").length)]], rows: songs, headers: [t("Invitado", "Guest", "Convidado"), t("Canción", "Song", "Música"), t("Estado", "Status", "Status")] },
    Recordatorios: { eyebrow: "", title: "", description: "", stats: [[t("Pendientes", "Pending", "Pendentes"), String(pending.length)], [t("Recordados", "Reminded", "Lembrados"), String(reminded.length)], [t("Sin contactar", "Not contacted", "Sem contato"), String(pending.length - reminded.length)]], rows: pending, headers: [t("Invitado", "Guest", "Convidado"), "WhatsApp", t("Estado", "Status", "Status"), t("Último recordatorio", "Last reminder", "Último lembrete"), t("Acción", "Action", "Ação")] },
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
    : new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  const whatsappStatus = (value = "") => ({
    accepted: [adminStatus(language, "accepted"), "pending"],
    sent: [adminStatus(language, "sent"), "sent"],
    delivered: [adminStatus(language, "delivered"), "delivered"],
    read: [adminStatus(language, "read"), "read"],
    failed: [adminStatus(language, "failed"), "failed"]
  } as Record<string, [string, string]>)[value] || [t("Sin envío", "Not sent", "Não enviado"), "empty"];

  const remindGuest = async (guest: Guest) => {
    setRemindingId(guest.id);
    setModuleError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, action: "remind" })
      });
      const result = await response.json() as { guest?: Guest; mode?: "business" | "manual"; url?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos enviar el recordatorio.");
      if (result.mode === "manual" && result.url) {
        const whatsappWindow = window.open(result.url, "_blank", "noopener,noreferrer");
        if (!whatsappWindow) window.location.href = result.url;
        return;
      }
      if (!result.guest) throw new Error("No pudimos registrar el recordatorio.");
      setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : "No pudimos registrar el recordatorio.");
    } finally {
      setRemindingId("");
    }
  };

  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">{view === "Recordatorios" ? t("Seguimiento RSVP", "RSVP follow-up", "Acompanhamento RSVP") : view === "Restricciones" ? t("Información para catering", "Catering information", "Informações para o buffet") : t("Playlist colaborativa", "Collaborative playlist", "Playlist colaborativa")}</span><h1>{view === "Recordatorios" ? t("Recordatorios", "Reminders", "Lembretes") : view === "Restricciones" ? t("Restricciones alimentarias", "Dietary requirements", "Restrições alimentares") : t("Canciones sugeridas", "Suggested songs", "Músicas sugeridas")}</h1><p>{view === "Recordatorios" ? t("Contactá a quienes todavía no respondieron.", "Contact guests who have not replied yet.", "Entre em contato com quem ainda não respondeu.") : view === "Restricciones" ? t("Organizá los requerimientos de tus invitados.", "Organize your guests' requirements.", "Organize as necessidades dos convidados.") : t("Revisá y organizá las canciones enviadas.", "Review and organize submitted songs.", "Revise e organize as músicas enviadas.")}</p></div>{view !== "Recordatorios" && <button className="primary-button small" onClick={exportModule}>＋ {t("Exportar CSV", "Export CSV", "Exportar CSV")}</button>}</div>
      {view === "Recordatorios" && <ContextHelp title={t("Envío por WhatsApp", "WhatsApp delivery", "Envio pelo WhatsApp")}>{t("Si la integración Business está activa, el envío se registra automáticamente. En modo manual se abre WhatsApp con el mensaje preparado para que lo revises y envíes.", "With Business integration enabled, delivery is recorded automatically. In manual mode, WhatsApp opens with a prepared message for you to review and send.", "Com a integração Business ativa, o envio é registrado automaticamente. No modo manual, o WhatsApp abre com a mensagem pronta para você revisar e enviar.")}</ContextHelp>}
      <section className="metrics-grid mini">{content.stats.map(([label, value], index) => <Metric key={label} label={label} value={value} note={t("registros", "records", "registros")} tone={["blue", "green", "amber"][index]} />)}</section>
      <section className="panel table-panel"><div className="table-scroll"><table><thead><tr>{content.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{content.rows.map((guest, index) => <tr key={guest.id}>
          <td><div className="person"><span className="avatar avatar-blue">{guest.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><p><strong>{view === "Accesos" && index === 0 ? "Ana Pereira" : view === "Accesos" && index === 1 ? "Martín Costa" : guest.name}</strong><small>{guest.group}</small></p></div></td>
          {view === "Restricciones" && <><td>{guest.group}</td><td><span className="status status-pendiente">{guest.food}</span></td><td>{guest.confirmed || 1}</td></>}
          {view === "Canciones" && <><td>{guest.song}</td><td><span className="status status-confirmado">{t("Registrada", "Recorded", "Registrada")}</span></td></>}
          {view === "Recordatorios" && <><td>{guest.phone || t("Sin número", "No number", "Sem número")}</td><td><span className={`delivery-status is-${whatsappStatus(guest.whatsappStatus)[1]}`}><i aria-hidden="true" />{whatsappStatus(guest.whatsappStatus)[0]}</span></td><td>{reminderDate(guest.reminded)}</td><td>{canEdit ? <button className="whatsapp-button" disabled={remindingId === guest.id || !guest.phone} onClick={() => remindGuest(guest)}>{remindingId === guest.id ? t("Enviando…", "Sending…", "Enviando…") : guest.phone ? t("Enviar por WhatsApp", "Send via WhatsApp", "Enviar pelo WhatsApp") : t("Falta teléfono", "Phone missing", "Falta telefone")}</button> : <span className="muted">{t("Solo lectura", "View only", "Somente leitura")}</span>}</td></>}
          {view === "Accesos" && <><td>{index === 0 ? "ana@ejemplo.com" : index === 1 ? "martin@ejemplo.com" : "sofia@ejemplo.com"}</td><td>{index === 0 ? "Propietaria" : index === 1 ? "Colaborador" : "Solo lectura"}</td><td><span className={`status ${index < 2 ? "status-confirmado" : "status-pendiente"}`}>{index < 2 ? "Activo" : "Invitación pendiente"}</span></td></>}
        </tr>)}</tbody></table></div>{moduleError && <p className="table-error" role="alert">{moduleError}</p>}</section>
    </>
  );
}

function Settings({ code, onChange, orderNumber }: { code: string; onChange: (value: string) => void; orderNumber: string }) {
  const { text: t, locale } = useAdminI18n();
  const knownCode = countryCodes.some(([, value]) => value === code);
  const [selection, setSelection] = useState(knownCode ? code : "custom");
  const [customCode, setCustomCode] = useState(knownCode ? "" : code);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);
  const [automaticRemindersEnabled, setAutomaticRemindersEnabled] = useState(false);
  const [testingReminder, setTestingReminder] = useState(false);
  const [healthBusy, setHealthBusy] = useState(true);
  const [health, setHealth] = useState<{
    checkedAt: string;
    services: Record<"database" | "email" | "scheduler", { status: "ok" | "error"; detail: string }>;
  } | null>(null);
  const [retentionDeadline, setRetentionDeadline] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [restoreBackup, setRestoreBackup] = useState<Record<string, unknown> | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<{ guests: number; tables: number; collaborators: number } | null>(null);
  const [canRestore, setCanRestore] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { reminderDaysBefore?: number; automaticRemindersEnabled?: boolean };
      setReminderDaysBefore(result.reminderDaysBefore || 7);
      setAutomaticRemindersEnabled(result.automaticRemindersEnabled === true);
    });
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthBusy(true);
    try {
      const response = await fetch("/api/admin/health", { cache: "no-store" });
      const result = await response.json() as typeof health & { error?: string };
      if (!response.ok || !result?.services) throw new Error(result?.error || "No pudimos comprobar el sistema.");
      setHealth(result);
    } catch {
      setHealth(null);
    } finally {
      setHealthBusy(false);
    }
  }, []);

  useEffect(() => { void loadHealth(); }, [loadHealth]);

  useEffect(() => {
    fetch("/api/admin/privacy", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { retentionDeadline?: string | null };
      setRetentionDeadline(result.retentionDeadline || "");
    });
  }, []);

  const save = async () => {
    const value = selection === "custom" ? customCode.trim() : selection;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultPhoneCountryCode: value, reminderDaysBefore, automaticRemindersEnabled })
      });
      const result = await response.json() as { defaultPhoneCountryCode?: string; reminderDaysBefore?: number; automaticRemindersEnabled?: boolean; error?: string };
      if (!response.ok || !result.defaultPhoneCountryCode) throw new Error(result.error || "No pudimos guardar la configuración.");
      onChange(result.defaultPhoneCountryCode);
      setReminderDaysBefore(result.reminderDaysBefore || reminderDaysBefore);
      setAutomaticRemindersEnabled(result.automaticRemindersEnabled === true);
      setMessage("Configuración guardada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    setBackingUp(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/backup", { cache: "no-store" });
      const result = await response.json() as { backup?: Record<string, unknown>; error?: string };
      if (!response.ok || !result.backup) throw new Error(result.error || "No pudimos generar el respaldo.");
      const url = URL.createObjectURL(new Blob([JSON.stringify(result.backup, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `save-your-date-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Respaldo generado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos generar el respaldo.");
    } finally {
      setBackingUp(false);
    }
  };

  const sendTestReminder = async () => {
    setTestingReminder(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/test-reminder", { method: "POST" });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos enviar la prueba.");
      setMessage(result.message || "Correo de prueba enviado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos enviar la prueba.");
    } finally {
      setTestingReminder(false);
    }
  };

  const deleteEvent = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== orderNumber) return;
    if (!window.confirm("Esta acción elimina definitivamente el evento y no se puede deshacer. ¿Querés continuar?")) return;
    setDeletingEvent(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/privacy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos eliminar el evento.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos eliminar el evento.");
      setDeletingEvent(false);
    }
  };

  const inspectBackup = async (file?: File) => {
    setRestoreBackup(null);
    setRestoreSummary(null);
    setCanRestore(false);
    setRestoreConfirmation("");
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text()) as Record<string, unknown>;
      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup })
      });
      const result = await response.json() as { valid?: boolean; canRestore?: boolean; summary?: { guests: number; tables: number; collaborators: number }; error?: string };
      if (!response.ok || !result.valid || !result.summary) throw new Error(result.error || "El respaldo no es válido.");
      setRestoreBackup(backup);
      setRestoreSummary(result.summary);
      setCanRestore(result.canRestore === true);
      setMessage(result.canRestore ? "Respaldo válido. Revisá el resumen antes de restaurar." : "El respaldo es válido, pero este evento contiene datos y no puede restaurarse sin riesgo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos leer el respaldo.");
    }
  };

  const restoreData = async () => {
    if (!restoreBackup || !canRestore || restoreConfirmation.trim().toUpperCase() !== orderNumber) return;
    setRestoring(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup: restoreBackup, apply: true, confirmation: restoreConfirmation })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos restaurar el respaldo.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos restaurar el respaldo.");
      setRestoring(false);
    }
  };

  return <>
    <div className="page-heading"><div><span className="eyebrow">{t("Preferencias del evento", "Event preferences", "Preferências do evento")}</span><h1>{t("Configuración", "Settings", "Configurações")}</h1><p>{t("Definí valores predeterminados para automatizar la gestión.", "Set defaults to streamline event management.", "Defina valores padrão para automatizar a gestão.")}</p></div></div>
    <ContextHelp title={t("Configuración segura", "Safe settings", "Configuração segura")}>{t("Los respaldos no incluyen contraseñas ni códigos. Restaurar o eliminar datos siempre exige confirmar el número de pedido.", "Backups never include passwords or codes. Restoring or deleting data always requires your order number.", "Os backups não incluem senhas nem códigos. Restaurar ou excluir dados sempre exige o número do pedido.")}</ContextHelp>
    <section className="panel settings-panel">
      <div className="panel-title"><div><h2>{t("País predeterminado de WhatsApp", "Default WhatsApp country", "País padrão do WhatsApp")}</h2><p>{t("Se aplicará automáticamente al agregar invitados y se podrá cambiar en cada caso.", "Applied automatically when adding guests, and editable for each guest.", "Aplicado automaticamente ao adicionar convidados e editável em cada caso.")}</p></div></div>
      <div className="settings-form">
        <label>{t("País", "Country", "País")}<select value={selection} onChange={(event) => setSelection(event.target.value)}>{countryCodes.map(([country, value]) => <option key={value} value={value}>{country} {value}</option>)}<option value="custom">{t("Otro país", "Other country", "Outro país")}</option></select></label>
        {selection === "custom" && <label>{t("Código internacional", "International code", "Código internacional")}<input value={customCode} onChange={(event) => setCustomCode(event.target.value)} placeholder="+___" /></label>}
        <label>{t("Recordatorios automáticos", "Automatic reminders", "Lembretes automáticos")}<select value={automaticRemindersEnabled ? "enabled" : "disabled"} onChange={(event) => setAutomaticRemindersEnabled(event.target.value === "enabled")}><option value="disabled">{t("Desactivados", "Disabled", "Desativados")}</option><option value="enabled">{t("Activados", "Enabled", "Ativados")}</option></select></label>
        <label>{t("Enviar con anticipación", "Send in advance", "Enviar com antecedência")}<input type="number" min="1" max="60" disabled={!automaticRemindersEnabled} value={reminderDaysBefore} onChange={(event) => setReminderDaysBefore(Math.max(1, Math.min(60, Number(event.target.value) || 1)))} /><small>{t("Días antes del evento", "Days before the event", "Dias antes do evento")}</small></label>
        <button className="primary-button small" disabled={saving} onClick={save}>{saving ? t("Guardando…", "Saving…", "Salvando…") : t("Guardar configuración", "Save settings", "Salvar configurações")}</button>
      </div>
      {message && <p className="settings-message" role="status">{message}</p>}
    </section>
    <section className="panel settings-panel">
      <div className="panel-title"><div><h2>{t("Probar recordatorio por email", "Test email reminder", "Testar lembrete por email")}</h2><p>{t("Envía una muestra únicamente al email del propietario. No contacta invitados ni modifica confirmaciones.", "Sends a sample only to the owner's email. It does not contact guests or change RSVPs.", "Envia uma amostra apenas ao email do proprietário. Não contata convidados nem altera confirmações.")}</p></div></div>
      <div className="settings-form"><button className="outline-button" disabled={testingReminder} onClick={sendTestReminder}>{testingReminder ? t("Enviando…", "Sending…", "Enviando…") : t("Enviar email de prueba", "Send test email", "Enviar email de teste")}</button></div>
    </section>
    <section className="panel settings-panel">
      <div className="panel-title"><div><h2>{t("Respaldo de datos", "Data backup", "Backup de dados")}</h2><p>{t("Descargá una copia completa del evento sin contraseñas, códigos ni secretos de autenticación.", "Download a complete event copy without passwords, codes or authentication secrets.", "Baixe uma cópia completa do evento sem senhas, códigos ou segredos de autenticação.")}</p></div></div>
      <div className="settings-form"><button className="outline-button" disabled={backingUp} onClick={downloadBackup}>{backingUp ? t("Generando…", "Generating…", "Gerando…") : `⇩ ${t("Descargar respaldo JSON", "Download JSON backup", "Baixar backup JSON")}`}</button></div>
    </section>
    <section className="panel settings-panel">
      <div className="panel-title"><div><h2>{t("Restaurar respaldo", "Restore backup", "Restaurar backup")}</h2><p>{t("Primero validamos el archivo. Para evitar mezclas o sobrescrituras, sólo se puede restaurar cuando invitados, mesas y colaboradores están vacíos.", "We validate the file first. To prevent mixing or overwriting, restoration is only available when guests, tables and collaborators are empty.", "Primeiro validamos o arquivo. Para evitar misturas ou sobrescritas, a restauração só está disponível quando convidados, mesas e colaboradores estão vazios.")}</p></div></div>
      <div className="settings-form restore-form">
        <label className="restore-file">{t("Archivo JSON", "JSON file", "Arquivo JSON")}<input type="file" accept="application/json,.json" onChange={(event) => void inspectBackup(event.target.files?.[0])} /></label>
        {restoreSummary && <p className="restore-summary"><strong>{restoreSummary.guests}</strong> {t("invitados", "guests", "convidados")} · <strong>{restoreSummary.tables}</strong> {t("mesas", "tables", "mesas")} · <strong>{restoreSummary.collaborators}</strong> {t("colaboradores", "collaborators", "colaboradores")}</p>}
        {restoreSummary && !canRestore && <p className="restore-blocked" role="status">{t("Este evento ya contiene datos. La restauración está bloqueada para evitar sobrescrituras.", "This event already contains data. Restoration is blocked to prevent overwriting.", "Este evento já contém dados. A restauração está bloqueada para evitar sobrescritas.")}</p>}
        {restoreSummary && canRestore && <label>{t("Confirmación", "Confirmation", "Confirmação")}<input value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} placeholder={`${t("Escribí", "Type", "Digite")} ${orderNumber}`} /></label>}
        {restoreSummary && canRestore && <button className="outline-button" disabled={restoring || restoreConfirmation.trim().toUpperCase() !== orderNumber} onClick={restoreData}>{restoring ? t("Restaurando…", "Restoring…", "Restaurando…") : t("Restaurar datos", "Restore data", "Restaurar dados")}</button>}
      </div>
    </section>
    <section className="panel settings-panel privacy-panel">
      <div className="panel-title"><div><h2>{t("Privacidad y eliminación", "Privacy and deletion", "Privacidade e exclusão")}</h2><p>{t("Los datos se conservan durante 30 días después del evento. Luego se bloquean todos los accesos y se eliminan automáticamente.", "Data is retained for 30 days after the event. Then all access is disabled and the data is deleted automatically.", "Os dados são mantidos por 30 dias após o evento. Depois, todos os acessos são desativados e os dados são excluídos automaticamente.")}</p></div></div>
      {retentionDeadline && <p className="privacy-deadline">{t("El acceso finalizará el", "Access will end on", "O acesso terminará em")} <strong>{new Date(retentionDeadline).toLocaleDateString(locale, { dateStyle: "long", timeZone: "UTC" })}</strong>.</p>}
      <div className="settings-form">
        <label>{t("Confirmación", "Confirmation", "Confirmação")}<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={`${t("Escribí", "Type", "Digite")} ${orderNumber}`} /></label>
        <button className="danger-button" disabled={deletingEvent || deleteConfirmation.trim().toUpperCase() !== orderNumber} onClick={deleteEvent}>{deletingEvent ? t("Eliminando…", "Deleting…", "Excluindo…") : t("Eliminar evento y todos sus datos", "Delete event and all its data", "Excluir evento e todos os dados")}</button>
      </div>
    </section>
    <section className="panel settings-panel">
      <div className="panel-title"><div><h2>{t("Estado del sistema", "System status", "Status do sistema")}</h2><p>{t("Diagnóstico privado de los servicios que sostienen el panel y los recordatorios.", "Private diagnostics for services powering the dashboard and reminders.", "Diagnóstico privado dos serviços que sustentam o painel e os lembretes.")}</p></div><button className="outline-button" disabled={healthBusy} onClick={() => void loadHealth()}>{healthBusy ? t("Comprobando…", "Checking…", "Verificando…") : t("Actualizar estado", "Refresh status", "Atualizar status")}</button></div>
      <div className="health-grid">
        {([
          ["database", t("Base de datos", "Database", "Banco de dados"), t("Invitados, mesas y confirmaciones", "Guests, tables and RSVPs", "Convidados, mesas e confirmações")],
          ["email", t("Correo", "Email", "Email"), t("Accesos y recordatorios", "Access and reminders", "Acessos e lembretes")],
          ["scheduler", t("Automatización", "Automation", "Automação"), t("Ejecución programada del cron", "Scheduled background execution", "Execução programada em segundo plano")]
        ] as const).map(([key, label, description]) => {
          const service = health?.services[key];
          return <article key={key}><span className={`health-indicator ${service?.status === "ok" ? "is-ok" : service ? "is-error" : "is-pending"}`} aria-hidden="true" /><div><strong>{label}</strong><small>{description}</small></div><span className={`health-status ${service?.status === "ok" ? "is-ok" : "is-error"}`}>{service ? service.detail : healthBusy ? t("Comprobando…", "Checking…", "Verificando…") : t("Sin respuesta", "No response", "Sem resposta")}</span></article>;
        })}
      </div>
      {health?.checkedAt && <p className="health-checked">{t("Última comprobación", "Last check", "Última verificação")}: {new Date(health.checkedAt).toLocaleString(locale)}</p>}
    </section>
  </>;
}

type AdminAccess = { id: string; email: string; role: "editor" | "viewer"; created_at: string };
type AdminActivity = {
  id: string; actor_email: string; actor_role: "owner" | "editor" | "viewer";
  action: string; entity_type: string; entity_id: string | null;
  details: Record<string, unknown>; created_at: string;
};

function Accesses({ order }: { order: AdminOrder }) {
  const { text: t, locale } = useAdminI18n();
  const [accesses, setAccesses] = useState<AdminAccess[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/access").then(async (response) => {
      if (response.ok) setAccesses(((await response.json()) as { accesses: AdminAccess[] }).accesses);
    });
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (order.accessRole !== "owner") return;
    fetch("/api/admin/activity", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setActivities(((await response.json()) as { activities: AdminActivity[] }).activities);
    });
  }, [order.accessRole]);

  const activityLabel = (action: string) => ({
    "guest.created": "Agregó un invitado",
    "guests.imported": "Importó invitados",
    "guest.updated": "Actualizó un invitado",
    "guest.deleted": "Eliminó un invitado",
    "guest.reminded": "Registró un recordatorio",
    "reminder.test_sent": "Envió un recordatorio de prueba",
    "table.created": "Creó una mesa",
    "table.updated": "Actualizó una mesa",
    "table.deleted": "Eliminó una mesa",
    "table.guest_assigned": "Asignó un grupo a una mesa",
    "table.guest_unassigned": "Quitó un grupo de una mesa",
    "access.created": "Agregó un colaborador",
    "access.role_updated": "Cambió un rol",
    "access.deleted": "Revocó un acceso",
    "settings.updated": "Actualizó la configuración"
  }[action] || action);

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
    const access = accesses.find((item) => item.id === id);
    if (!window.confirm(`¿Revocar el acceso de ${access?.email || "este colaborador"}?`)) return;
    setUpdatingId(id); setError("");
    try {
      const response = await fetch(`/api/admin/access?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos revocar el acceso.");
      setAccesses((current) => current.filter((access) => access.id !== id));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "No pudimos revocar el acceso.");
    } finally { setUpdatingId(""); }
  };

  const updateRole = async (access: AdminAccess, role: AdminAccess["role"]) => {
    setUpdatingId(access.id); setError("");
    try {
      const response = await fetch("/api/admin/access", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: access.id, role })
      });
      const result = await response.json() as { access?: AdminAccess; error?: string };
      if (!response.ok || !result.access) throw new Error(result.error || "No pudimos cambiar el rol.");
      setAccesses((current) => current.map((item) => item.id === access.id ? result.access! : item));
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "No pudimos cambiar el rol.");
    } finally { setUpdatingId(""); }
  };

  return <>
    <div className="page-heading"><div><span className="eyebrow">{t("Seguridad del evento", "Event security", "Segurança do evento")}</span><h1>{t("Accesos", "Access", "Acessos")}</h1><p>{t("Gestioná quién puede ingresar y qué puede modificar.", "Manage who can sign in and what they can change.", "Gerencie quem pode entrar e o que pode alterar.")}</p></div>{order.accessRole === "owner" && <button className="primary-button small" onClick={() => setShowModal(true)}>＋ {t("Agregar colaborador", "Add collaborator", "Adicionar colaborador")}</button>}</div>
    <ContextHelp title={t("Roles y permisos", "Roles and permissions", "Funções e permissões")}>{t("Los editores pueden gestionar el evento. Los usuarios de solo lectura pueden consultar la información sin modificarla.", "Editors can manage the event. View-only users can consult information without changing it.", "Editores podem gerenciar o evento. Usuários de somente leitura podem consultar sem fazer alterações.")}</ContextHelp>
    <section className="metrics-grid mini"><Metric label={t("Propietarios", "Owners", "Proprietários")} value="1" note={t("acceso total", "full access", "acesso total")} tone="blue" /><Metric label={t("Editores", "Editors", "Editores")} value={String(accesses.filter((access) => access.role === "editor").length)} note={t("pueden modificar", "can edit", "podem editar")} tone="green" /><Metric label={t("Solo lectura", "View only", "Somente leitura")} value={String(accesses.filter((access) => access.role === "viewer").length)} note={t("sin cambios", "no changes", "sem alterações")} tone="amber" /></section>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>{t("Administrador", "Administrator", "Administrador")}</th><th>{t("Rol", "Role", "Função")}</th><th>{t("Estado", "Status", "Status")}</th><th /></tr></thead><tbody>
      <tr><td><strong>{order.loginEmail}</strong></td><td>{t("Propietario", "Owner", "Proprietário")}</td><td><span className="status status-confirmado">{t("Activo", "Active", "Ativo")}</span></td><td /></tr>
      {accesses.map((access) => <tr key={access.id}><td><strong>{access.email}</strong></td><td>{order.accessRole === "owner" ? <select className="status-select" value={access.role} disabled={updatingId === access.id} onChange={(event) => updateRole(access, event.target.value as AdminAccess["role"])} aria-label={`${t("Rol de", "Role for", "Função de")} ${access.email}`}><option value="editor">Editor</option><option value="viewer">{t("Solo lectura", "View only", "Somente leitura")}</option></select> : access.role === "editor" ? "Editor" : t("Solo lectura", "View only", "Somente leitura")}</td><td><span className="status status-confirmado">{t("Activo", "Active", "Ativo")}</span></td><td>{order.accessRole === "owner" && <button className="more-button" disabled={updatingId === access.id} onClick={() => remove(access.id)}>{t("Eliminar", "Remove", "Excluir")}</button>}</td></tr>)}
    </tbody></table></div>{error && <p className="table-error" role="alert">{error}</p>}</section>
    {order.accessRole === "owner" && <section className="panel table-panel audit-panel"><div className="panel-title"><div><h2>{t("Historial de actividad", "Activity history", "Histórico de atividades")}</h2><p>{t("Últimos cambios realizados desde el panel.", "Latest changes made from the dashboard.", "Últimas alterações feitas no painel.")}</p></div></div><div className="table-scroll"><table><thead><tr><th>{t("Usuario", "User", "Usuário")}</th><th>{t("Acción", "Action", "Ação")}</th><th>{t("Elemento", "Item", "Elemento")}</th><th>{t("Fecha", "Date", "Data")}</th></tr></thead><tbody>
      {activities.map((activity) => <tr key={activity.id}><td><strong>{activity.actor_email}</strong><small className="cell-sub">{activity.actor_role === "owner" ? t("Propietario", "Owner", "Proprietário") : activity.actor_role === "editor" ? "Editor" : t("Solo lectura", "View only", "Somente leitura")}</small></td><td>{activityLabel(activity.action)}</td><td>{activity.entity_type}</td><td>{reportDate(activity.created_at, locale)}</td></tr>)}
      {!activities.length && <tr><td colSpan={4}><span className="muted">{t("Los próximos cambios administrativos aparecerán acá.", "Future administrative changes will appear here.", "As próximas alterações administrativas aparecerão aqui.")}</span></td></tr>}
    </tbody></table></div></section>}
    {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}><form className="modal" onSubmit={invite} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowModal(false)}>×</button><span className="eyebrow">{t("Nuevo acceso", "New access", "Novo acesso")}</span><h2>{t("Agregar colaborador", "Add collaborator", "Adicionar colaborador")}</h2><div className="form-grid"><label>Email<input name="email" type="email" required /></label><label>{t("Rol", "Role", "Função")}<select name="role"><option value="editor">Editor</option><option value="viewer">{t("Solo lectura", "View only", "Somente leitura")}</option></select></label></div><p className="dynamic-help">{t("Recibirá un email y podrá ingresar con el número de pedido y su propia dirección.", "They will receive an email and can sign in with the order number and their own address.", "A pessoa receberá um email e poderá entrar com o número do pedido e seu próprio endereço.")}</p>{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="outline-button" type="button" onClick={() => setShowModal(false)}>{t("Cancelar", "Cancel", "Cancelar")}</button><button className="primary-button small" disabled={saving}>{saving ? t("Enviando…", "Sending…", "Enviando…") : t("Enviar invitación", "Send invitation", "Enviar convite")}</button></div></form></div>}
  </>;
}

function Admin({ onLogout, order, onLanguageChange }: { onLogout: () => void; order: AdminOrder; onLanguageChange: (language: AdminLanguage) => void }) {
  const { text: t, locale, language } = useAdminI18n();
  const [view, setView] = useState("Resumen");
  const [guests, setGuests] = useState(guestsSeed);
  const [mobileNav, setMobileNav] = useState(false);
  const [defaultPhoneCountryCode, setDefaultPhoneCountryCode] = useState(order.defaultPhoneCountryCode || "+598");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const navLabel = useCallback((item: string) => ({
    Resumen: t("Resumen", "Overview", "Resumo"), Invitados: t("Invitados", "Guests", "Convidados"),
    Confirmaciones: t("Confirmaciones", "Confirmations", "Confirmações"), Mesas: t("Mesas", "Tables", "Mesas"),
    Restricciones: t("Restricciones", "Dietary needs", "Restrições"), Canciones: t("Canciones", "Songs", "Músicas"),
    Recordatorios: t("Recordatorios", "Reminders", "Lembretes"), Accesos: t("Accesos", "Access", "Acessos"),
    Configuración: t("Configuración", "Settings", "Configurações")
  } as Record<string, string>)[item] || item, [t]);
  const title = view === "Resumen" ? t("Panel principal", "Main dashboard", "Painel principal") : navLabel(view);

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
        <div className="event-switcher"><span>{initials(order.eventTitle)}</span><div><strong>{order.eventTitle}</strong><small>{t("Pedido", "Order", "Pedido")} {order.orderNumber}</small></div></div>
        <nav>{nav.filter(([item]) => item !== "Configuración" || order.accessRole === "owner").map(([item, icon]) => <button key={item} className={view === item ? "active" : ""} onClick={() => navigate(item)}><span>{icon}</span>{navLabel(item)}{item === "Recordatorios" && guests.filter((guest) => guest.status === "Pendiente").length > 0 && <b>{guests.filter((guest) => guest.status === "Pendiente").length}</b>}</button>)}</nav>
        <div className="sidebar-help"><span>?</span><div><strong>{t("¿Necesitás ayuda?", "Need help?", "Precisa de ajuda?")}</strong><small>{t("Estamos para acompañarte.", "We are here to help.", "Estamos aqui para ajudar.")}</small></div><button onClick={() => { window.location.href = `mailto:hola@saveyourdate.site?subject=${encodeURIComponent(`${t("Ayuda con el pedido", "Help with order", "Ajuda com o pedido")} ${order.orderNumber}`)}`; }}>{t("Contactar soporte", "Contact support", "Contatar suporte")}</button></div>
        <button className="logout" onClick={onLogout}><span>↪</span>{t("Cerrar sesión", "Sign out", "Sair")}</button>
      </aside>
      {mobileNav && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} />}
      <section className="admin-main">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)}>☰</button><div><span>{title}</span><small>{lastSynced ? `${t("Sincronizado", "Synced", "Sincronizado")} ${lastSynced.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : t("Sincronizando datos…", "Syncing data…", "Sincronizando dados…")}</small></div><div className="topbar-actions"><LanguageSwitcher compact value={language} onChange={onLanguageChange} /><button className={`notification sync-button ${syncing ? "syncing" : ""}`} onClick={() => refreshGuests(true)} aria-label={t("Actualizar datos", "Refresh data", "Atualizar dados")} title={t("Actualizar datos", "Refresh data", "Atualizar dados")}>↻</button><div className="admin-user"><span>{initials(order.loginEmail || order.customerName)}</span><div><strong>{order.loginEmail || order.customerName}</strong><small>{order.accessRole === "owner" ? t("Propietario", "Owner", "Proprietário") : order.accessRole === "editor" ? "Editor" : t("Solo lectura", "Read only", "Somente leitura")}</small></div></div></div></header>
        <div className="admin-content">
          {view === "Resumen" && <Dashboard guests={guests} onNavigate={navigate} order={order} canEdit={order.accessRole !== "viewer"} />}
          {view === "Invitados" && <Guests guests={guests} setGuests={setGuests} defaultPhoneCountryCode={defaultPhoneCountryCode} canEdit={order.accessRole !== "viewer"} />}
          {view === "Confirmaciones" && <Confirmations guests={guests} />}
          {view === "Mesas" && <Seating guests={guests} canEdit={order.accessRole !== "viewer"} />}
          {["Restricciones", "Canciones", "Recordatorios"].includes(view) && <SimpleModule view={view} guests={guests} setGuests={setGuests} canEdit={order.accessRole !== "viewer"} />}
          {view === "Accesos" && <Accesses order={order} />}
          {view === "Configuración" && <Settings code={defaultPhoneCountryCode} onChange={setDefaultPhoneCountryCode} orderNumber={order.orderNumber} />}
        </div>
        <footer><span>Save Your Date</span><small>{t("Invitaciones digitales para momentos inolvidables", "Digital invitations for unforgettable moments", "Convites digitais para momentos inesquecíveis")} · Panel v106</small></footer>
      </section>
    </main>
  );
}

export function AdminPrototype() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [panelLanguage, setPanelLanguage] = useState<AdminLanguage>("es");
  useEffect(() => { document.documentElement.lang = panelLanguage; }, [panelLanguage]);

  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { order: AdminOrder };
        setOrder(result.order);
        const savedLanguage = window.sessionStorage.getItem("syd-admin-language") as AdminLanguage | null;
        setPanelLanguage(savedLanguage && ["es", "en", "pt"].includes(savedLanguage) ? savedLanguage : result.order.language);
        setLoggedIn(true);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
  };
  const changePanelLanguage = (language: AdminLanguage) => {
    setPanelLanguage(language);
    window.sessionStorage.setItem("syd-admin-language", language);
    document.documentElement.lang = language;
  };

  if (checkingSession) return <main className="admin-loading">Verificando acceso…</main>;
  return loggedIn && order
    ? <AdminI18nProvider language={panelLanguage}><Admin onLogout={logout} order={order} onLanguageChange={changePanelLanguage} /></AdminI18nProvider>
    : <Login onLogin={() => window.location.reload()} />;
}

export default AdminPrototype;
