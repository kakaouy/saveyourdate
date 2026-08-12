import React, { useCallback, useEffect, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import mammoth from "mammoth/mammoth.browser";
import "../admin-prototype.css";
import {
  AdminI18nProvider,
  adminStatus,
  adminText,
  useAdminI18n,
  type AdminLanguage,
} from "./admin-i18n";

type Guest = {
  id: string;
  inviteToken: string;
  name: string;
  group: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  identificationType: string;
  identificationNumber: string;
  seats: number;
  confirmed: number;
  status: "Confirmado" | "Pendiente" | "No asiste";
  food: string;
  song: string;
  companions: Array<{
    name: string;
    food: string;
    identificationType: string;
    identificationNumber: string;
  }>;
  reminded: string;
  invitationSentAt?: string;
  invitationOpenedAt?: string;
  respondedAt?: string;
  archivedAt?: string;
  transportOption: string;
  transportStop: string;
  menuChoice: string;
  accessibilityNeeds: string;
  guestNotes: string;
  socialTogetherWith: string;
  socialSeparateFrom: string;
  preferredTableName: string;
  guestType: "adult" | "teen" | "child";
  updatedAt: string;
  whatsappStatus?: string;
  invitedBy: string;
  companionOfId: string;
  thankedAt?: string;
};

type GuestImportDraft = {
  name: string;
  group: string;
  phone: string;
  phoneCountryCode: string;
  seats: string;
  email: string;
  identificationType: string;
  identificationNumber: string;
  food: string;
  invitedBy: string;
  companionOfId: string;
};

type GuestImportPreview = {
  fileName: string;
  rows: Array<{
    guest: GuestImportDraft;
    duplicate: string;
    errors: string[];
  }>;
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
  invitationUrl: string;
  giftDetails: string;
};

const guestsSeed: Guest[] = [];

const formatEventDate = (value: string) => {
  if (!value) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};

const initials = (value: string) =>
  value
    .split(/\s+|&/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const exportCsv = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) => {
  const safeCell = (value: string | number) => {
    const text = String(value ?? "");
    const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${protectedText.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows]
    .map((row) => row.map(safeCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const reportDate = (value: string, locale = "es-UY") =>
  value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const linkedGroupMembers = (guest: Guest, guests: Guest[]) => {
  const rootId = guest.companionOfId || guest.id;
  const root = guests.find((item) => item.id === rootId) || guest;
  return [root, ...guests.filter((item) => item.companionOfId === root.id)];
};

const confirmedPeopleForGuest = (guest: Guest, guests: Guest[]) => {
  const usesIndividualRows = guests.some((item) => Boolean(item.companionOfId));
  return usesIndividualRows ? (guest.status === "Confirmado" ? 1 : 0) : Math.max(0, guest.confirmed);
};

const confirmedPeopleTotal = (guests: Guest[]) =>
  guests.reduce((total, guest) => total + confirmedPeopleForGuest(guest, guests), 0);

const meaningfulGuestValue = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized && !["ninguna", "ninguno", "none", "nenhuma", "nenhum", "no"].includes(normalized));
};

const guestHasRestriction = (guest: Guest) =>
  meaningfulGuestValue(guest.food) ||
  Boolean(guest.socialTogetherWith || guest.socialSeparateFrom || guest.preferredTableName);

const normalizedReference = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const seatProgress = (guest: Guest, guests: Guest[]) => {
  const members = linkedGroupMembers(guest, guests);
  if (members.length === 1) return { used: Math.min(guest.confirmed, guest.seats), total: guest.seats };
  const root = members[0];
  const index = members.findIndex((member) => member.id === guest.id);
  const used = guest.status === "Confirmado"
    ? members.slice(0, index + 1).filter((member) => member.status === "Confirmado").length
    : 0;
  return { used, total: Math.max(root.seats, members.length) };
};

function ContextHelp({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="context-help">
      <span aria-hidden="true">?</span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter =
    (text.split(/\r?\n/, 1)[0].match(/;/g)?.length || 0) >
    (text.split(/\r?\n/, 1)[0].match(/,/g)?.length || 0)
      ? ";"
      : ",";
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const tableRowsFromHtml = (html: string) => {
  const document = new DOMParser().parseFromString(html, "text/html");
  return [...document.querySelectorAll("table tr")]
    .map((row) =>
      [...row.querySelectorAll("th,td")].map(
        (cell) => cell.textContent?.trim() || "",
      ),
    )
    .filter((row) => row.some(Boolean));
};

const readGuestFile = async (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return parseCsv(await file.text());
  if (extension === "xlsx") {
    return (await readSheet(file)).map((row: unknown[]) =>
      row.map((cell: unknown) => String(cell ?? "")),
    );
  }
  if (extension === "docx") {
    const result = await mammoth.convertToHtml({
      arrayBuffer: await file.arrayBuffer(),
    });
    const rows = tableRowsFromHtml(result.value);
    if (!rows.length)
      throw new Error(
        "El Word debe contener una tabla con encabezados en la primera fila.",
      );
    return rows;
  }
  throw new Error("Formato no compatible. Usá CSV, XLSX o DOCX.");
};

function GuestAvatar({ guest }: { guest: Guest }) {
  const label = guest.invitedBy || guest.name;
  return (
    <span
      className="avatar avatar-blue"
      title={`Invitación realizada por ${label}`}
      aria-label={`Invitación realizada por ${label}`}
    >
      {initials(label)}
    </span>
  );
}

function GuestNameButton({ guest, children }: { guest: Guest; children?: React.ReactNode }) {
  const { text: t } = useAdminI18n();
  return (
    <button
      type="button"
      className="guest-name-button"
      onClick={() => window.dispatchEvent(new CustomEvent("syd:edit-guest", { detail: guest.id }))}
      title={t("Editar invitado", "Edit guest", "Editar convidado")}
    >
      {children || guest.name}
    </button>
  );
}

const nav = [
  ["Resumen", "⌂"],
  ["Invitados", "♙"],
  ["Restricciones", "◇"],
  ["Canciones", "♫"],
  ["Recordatorios", "↗"],
  ["Agradecimientos", "♡"],
  ["Mesas", "▦"],
  ["Accesos", "♢"],
  ["Configuración", "⚙"],
];

const countryCodes = [
  ["Uruguay", "+598"],
  ["Argentina", "+54"],
  ["Brasil", "+55"],
  ["Paraguay", "+595"],
  ["Chile", "+56"],
  ["Bolivia", "+591"],
  ["Perú", "+51"],
  ["Colombia", "+57"],
  ["México", "+52"],
  ["Estados Unidos / Canadá", "+1"],
  ["España", "+34"],
  ["Italia", "+39"],
  ["Francia", "+33"],
  ["Reino Unido", "+44"],
];

const suggestedIdentification = (code: string) =>
  code === "+598"
    ? "CI"
    : code === "+54"
      ? "DNI"
      : code === "+55"
        ? "CPF"
        : "Pasaporte";

function Logo({ compact = false }: { compact?: boolean }) {
  const { text: t } = useAdminI18n();
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <img src="/logo.svg" alt="Save Your Date" />
      {!compact && (
        <span>
          {t(
            "Panel de administración",
            "Admin dashboard",
            "Painel administrativo",
          )}
        </span>
      )}
    </div>
  );
}

function LanguageSwitcher({
  value,
  onChange,
  compact = false,
}: {
  value: AdminLanguage;
  onChange: (language: AdminLanguage) => void;
  compact?: boolean;
}) {
  const labels: Record<AdminLanguage, string> = {
    es: "Español",
    en: "English",
    pt: "Português",
  };
  return (
    <label className={`language-switcher ${compact ? "is-compact" : ""}`}>
      <span className="visually-hidden">
        {adminText(value, "Idioma", "Language", "Idioma")}
      </span>
      <span aria-hidden="true">🌐</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AdminLanguage)}
        aria-label={adminText(
          value,
          "Cambiar idioma",
          "Change language",
          "Alterar idioma",
        )}
      >
        {(Object.keys(labels) as AdminLanguage[]).map((language) => (
          <option key={language} value={language}>
            {labels[language]}
          </option>
        ))}
      </select>
    </label>
  );
}

function FontSizeSwitcher({
  comfortable,
  onChange,
}: {
  comfortable: boolean;
  onChange: (comfortable: boolean) => void;
}) {
  const { text: t } = useAdminI18n();
  return (
    <div
      className="font-size-switcher"
      role="group"
      aria-label={t("Tamaño de texto", "Text size", "Tamanho do texto")}
    >
      <button
        type="button"
        className={!comfortable ? "active" : ""}
        onClick={() => onChange(false)}
        aria-pressed={!comfortable}
        title={t("Texto chico", "Small text", "Texto pequeno")}
      >
        A
      </button>
      <button
        type="button"
        className={comfortable ? "active" : ""}
        onClick={() => onChange(true)}
        aria-pressed={comfortable}
        title={t("Texto cómodo", "Comfortable text", "Texto confortável")}
      >
        A+
      </button>
    </div>
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
  const t = (es: string, en: string, pt: string) =>
    adminText(language, es, en, pt);
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
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "No pudimos procesar la solicitud.");
      setRecoveryMessage(result.message || "Revisá tu email.");
    } catch (recoveryError) {
      setRecoveryMessage(
        recoveryError instanceof Error
          ? recoveryError.message
          : "No pudimos procesar la solicitud.",
      );
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
        body: JSON.stringify({ orderNumber, contact: contactValue }),
      });
      const result = (await response.json()) as {
        challengeId?: string;
        maskedEmail?: string;
        language?: "es" | "en" | "pt";
        error?: string;
      };
      if (!response.ok || !result.challengeId)
        throw new Error(result.error || "No pudimos enviar el código.");
      setChallengeId(result.challengeId);
      setMaskedEmail(result.maskedEmail || "");
      if (!languageTouched) setLanguage(result.language || "es");
      setStep("code");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No pudimos enviar el código.",
      );
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
        body: JSON.stringify({ challengeId, code }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No pudimos validar el código.");
      onLogin();
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "No pudimos validar el código.",
      );
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
            <span className="eyebrow">
              {t(
                "Tu evento, bajo control",
                "Your event, under control",
                "Seu evento sob controle",
              )}
            </span>
            <h1>
              {t(
                "Todo listo para disfrutar el gran día.",
                "Everything ready to enjoy the big day.",
                "Tudo pronto para aproveitar o grande dia.",
              )}
            </h1>
            <p>
              {t(
                "Gestioná invitados, confirmaciones y cada detalle desde un único lugar.",
                "Manage guests, RSVPs and every detail from one place.",
                "Gerencie convidados, confirmações e cada detalhe em um só lugar.",
              )}
            </p>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-language">
            <LanguageSwitcher
              value={language}
              onChange={(nextLanguage) => {
                setLanguageTouched(true);
                setLanguage(nextLanguage);
              }}
            />
          </div>
          <div className="mobile-login-logo">
            <Logo compact />
          </div>
          <div className="login-card">
            <div className="login-step">
              {t("Paso", "Step", "Etapa")}{" "}
              {step === "credentials" ? "1 / 2" : "2 / 2"}
            </div>
            {step === "credentials" ? (
              <>
                <h2>
                  {t(
                    "Ingresá a tu evento",
                    "Access your event",
                    "Acesse seu evento",
                  )}
                </h2>
                <p className="muted">
                  {t(
                    "Usá los datos asociados a tu pedido.",
                    "Use the details associated with your order.",
                    "Use os dados associados ao seu pedido.",
                  )}
                </p>
                <label>
                  {t("Número de pedido", "Order number", "Número do pedido")}
                  <input
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder={t(
                      "Ej. SYD-ABCD-1234",
                      "E.g. SYD-ABCD-1234",
                      "Ex. SYD-ABCD-1234",
                    )}
                    aria-label={t(
                      "Número de pedido",
                      "Order number",
                      "Número do pedido",
                    )}
                  />
                </label>
                <div className="segmented" aria-label="Tipo de contacto">
                  <button
                    className={contact === "email" ? "active" : ""}
                    onClick={() => setContact("email")}
                  >
                    Email
                  </button>
                  <button
                    className={contact === "whatsapp" ? "active" : ""}
                    onClick={() => setContact("whatsapp")}
                  >
                    WhatsApp
                  </button>
                </div>
                <label>
                  {contact === "email"
                    ? t(
                        "Email registrado",
                        "Registered email",
                        "Email cadastrado",
                      )
                    : t(
                        "WhatsApp registrado",
                        "Registered WhatsApp",
                        "WhatsApp cadastrado",
                      )}
                  <input
                    value={contactValue}
                    onChange={(event) => setContactValue(event.target.value)}
                    placeholder={
                      contact === "email"
                        ? t(
                            "nombre@ejemplo.com",
                            "name@example.com",
                            "nome@exemplo.com",
                          )
                        : "099 123 456"
                    }
                    aria-label={t(
                      "Contacto registrado",
                      "Registered contact",
                      "Contato cadastrado",
                    )}
                  />
                </label>
                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="primary-button"
                  disabled={busy || !orderNumber || !contactValue}
                  onClick={requestCode}
                >
                  {busy
                    ? t("Enviando…", "Sending…", "Enviando…")
                    : t("Continuar", "Continue", "Continuar")}{" "}
                  <span>→</span>
                </button>
                <p className="security-note">
                  <span>✓</span>{" "}
                  {t(
                    "Tus datos están protegidos y nunca compartimos la información del evento.",
                    "Your data is protected and we never share your event information.",
                    "Seus dados estão protegidos e nunca compartilhamos as informações do evento.",
                  )}
                </p>
              </>
            ) : (
              <>
                <button
                  className="back-link"
                  onClick={() => setStep("credentials")}
                >
                  ← {t("Volver", "Back", "Voltar")}
                </button>
                <h2>
                  {language === "en"
                    ? "Check your email"
                    : language === "pt"
                      ? "Verifique seu e-mail"
                      : "Revisá tu email"}
                </h2>
                <p className="muted">
                  {language === "en"
                    ? "We sent a security code to"
                    : language === "pt"
                      ? "Enviamos um código de segurança para"
                      : "Enviamos un código de seguridad a"}{" "}
                  <strong>{maskedEmail}</strong>.
                </p>
                <label>
                  {language === "en"
                    ? "6-digit code"
                    : language === "pt"
                      ? "Código de 6 dígitos"
                      : "Código de 6 dígitos"}
                  <input
                    className="code-input"
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    maxLength={6}
                    aria-label="Código de seguridad"
                  />
                </label>
                <div className="code-meta">
                  <span>
                    {language === "en"
                      ? "Expires in 10 minutes"
                      : language === "pt"
                        ? "Expira em 10 minutos"
                        : "Vence en 10 minutos"}
                  </span>
                  <button disabled={busy} onClick={requestCode}>
                    {language === "en"
                      ? "Resend code"
                      : language === "pt"
                        ? "Reenviar código"
                        : "Reenviar código"}
                  </button>
                </div>
                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="primary-button"
                  disabled={busy || code.length !== 6}
                  onClick={verifyCode}
                >
                  {busy
                    ? t("Validando…", "Verifying…", "Validando…")
                    : t(
                        "Ingresar a mi evento",
                        "Open my event",
                        "Entrar no meu evento",
                      )}{" "}
                  <span>→</span>
                </button>
                <p className="security-note">
                  <span>✓</span>{" "}
                  {t(
                    "La sesión permanecerá activa durante 24 horas.",
                    "Your session will remain active for 24 hours.",
                    "Sua sessão permanecerá ativa por 24 horas.",
                  )}
                </p>
              </>
            )}
            <button
              className="help-link"
              type="button"
              onClick={() => setShowHelp(true)}
            >
              {t(
                "¿Necesitás ayuda con tu acceso?",
                "Need help signing in?",
                "Precisa de ajuda para acessar?",
              )}
            </button>
          </div>
        </section>
        {showHelp && (
          <div
            className="modal-backdrop"
            onMouseDown={() => setShowHelp(false)}
          >
            <div
              className="modal access-help-modal"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label={t("Cerrar ayuda", "Close help", "Fechar ajuda")}
              >
                ×
              </button>
              <span className="eyebrow">
                {t("Ayuda de acceso", "Access help", "Ajuda de acesso")}
              </span>
              <h2>
                {t(
                  "¿No podés ingresar?",
                  "Can't sign in?",
                  "Não consegue acessar?",
                )}
              </h2>
              <p>
                {t(
                  "Encontrás el número de pedido en el email de confirmación de Save Your Date. Ingresá también el mismo email o WhatsApp que usaste al realizar el pedido.",
                  "Your order number is in the Save Your Date confirmation email. Use the same email or WhatsApp number used for the order.",
                  "O número do pedido está no email de confirmação da Save Your Date. Use também o mesmo email ou WhatsApp utilizado no pedido.",
                )}
              </p>
              <form className="recovery-form" onSubmit={recoverAccess}>
                <label>
                  {t("Email asociado", "Associated email", "Email associado")}
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    placeholder={t(
                      "nombre@ejemplo.com",
                      "name@example.com",
                      "nome@exemplo.com",
                    )}
                  />
                </label>
                <button className="primary-button small" disabled={recovering}>
                  {recovering
                    ? t("Buscando…", "Searching…", "Buscando…")
                    : t(
                        "Recuperar número de pedido",
                        "Recover order number",
                        "Recuperar número do pedido",
                      )}
                </button>
                {recoveryMessage && (
                  <p className="settings-message" role="status">
                    {recoveryMessage}
                  </p>
                )}
              </form>
              <div className="support-email">
                <span>
                  {t("Soporte por email", "Email support", "Suporte por email")}
                </span>
                <strong>hola@saveyourdate.site</strong>
                <button type="button" onClick={copySupportEmail}>
                  {emailCopied
                    ? t("Email copiado ✓", "Email copied ✓", "Email copiado ✓")
                    : t("Copiar email", "Copy email", "Copiar email")}
                </button>
              </div>
              <p className="support-note">
                {t(
                  "Si nos escribís, incluí tu nombre y cualquier dato que ayude a localizar el pedido. Nunca te vamos a pedir una contraseña.",
                  "If you contact us, include your name and any details that help locate the order. We will never ask for a password.",
                  "Ao entrar em contato, inclua seu nome e qualquer dado que ajude a localizar o pedido. Nunca pediremos uma senha.",
                )}
              </p>
              <div className="modal-actions">
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => setShowHelp(false)}
                >
                  {t(
                    "Volver al ingreso",
                    "Back to sign in",
                    "Voltar ao acesso",
                  )}
                </button>
                <a
                  className="primary-button small"
                  href="mailto:hola@saveyourdate.site?subject=Ayuda%20con%20el%20acceso%20al%20panel"
                >
                  {t(
                    "Escribir a soporte",
                    "Contact support",
                    "Falar com o suporte",
                  )}
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminI18nProvider>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <div>
        <span>{label}</span>
        <i />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Status({ value }: { value: Guest["status"] }) {
  const { language } = useAdminI18n();
  return (
    <span className={`status status-${value.toLowerCase().replace(" ", "-")}`}>
      {adminStatus(language, value)}
    </span>
  );
}

function Dashboard({
  guests,
  onNavigate,
  order,
  canEdit,
}: {
  guests: Guest[];
  onNavigate: (view: string) => void;
  order: AdminOrder;
  canEdit: boolean;
}) {
  const { text: t } = useAdminI18n();
  const confirmed = confirmedPeopleTotal(guests);
  const seats = guests.reduce((total, guest) => total + guest.seats, 0);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter(
    (guest) => guest.status === "No asiste",
  ).length;
  const restrictions = guests.reduce(
    (total, guest) =>
      total +
      (guest.food !== "—" && guest.food !== "Ninguna" ? 1 : 0) +
      guest.companions.filter((companion) => companion.food).length,
    0,
  );
  const songs = guests.filter((guest) => guest.song !== "—").length;
  const responseRate = guests.length
    ? Math.round(((guests.length - pending) / guests.length) * 100)
    : 0;
  const recentGuests = [...guests]
    .filter((guest) => guest.updatedAt)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);
  const activityCopy = (guest: Guest) => {
    if (guest.status === "Confirmado")
      return {
        title: `${guest.name} confirmó asistencia`,
        detail: `${confirmedPeopleForGuest(guest, guests)} ${confirmedPeopleForGuest(guest, guests) === 1 ? "persona" : "personas"} confirmadas`,
        tone: "avatar-mint",
      };
    if (guest.status === "No asiste")
      return {
        title: `${guest.name} no asistirá`,
        detail: "La respuesta quedó registrada",
        tone: "avatar-coral",
      };
    const remindedRecently =
      guest.reminded !== "—" &&
      Math.abs(
        new Date(guest.reminded).getTime() -
          new Date(guest.updatedAt).getTime(),
      ) < 5000;
    if (remindedRecently)
      return {
        title: `Recordatorio enviado a ${guest.name}`,
        detail: guest.phone || "WhatsApp sin registrar",
        tone: "avatar-blue",
      };
    return {
      title: `${guest.name} fue actualizado`,
      detail: guest.group || "Sin grupo asignado",
      tone: "avatar-blue",
    };
  };
  const relativeTime = (value: string) => {
    const minutes = Math.max(
      0,
      Math.round((Date.now() - new Date(value).getTime()) / 60000),
    );
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.round(hours / 24);
    return `Hace ${days} d`;
  };
  const guide = [
    t("Inicio rápido", "Quick start", "Início rápido"),
    t(
      "Una invitación representa un grupo; los cupos son las personas permitidas dentro de ese grupo.",
      "An invitation is one guest group; seats are the people allowed in that group.",
      "Um convite representa um grupo; as vagas são as pessoas permitidas nesse grupo.",
    ),
    [
      t("Invitados", "Guests", "Convidados"),
      t("Mesas", "Tables", "Mesas"),
      t("Recordatorios", "Reminders", "Lembretes"),
      t("Respaldo", "Backup", "Backup"),
    ],
  ];

  return (
    <>
      <section className="panel getting-started-panel">
        <div>
          <span className="eyebrow">{guide[0] as string}</span>
          <p>{guide[1] as string}</p>
        </div>
        <nav>
          {(guide[2] as string[]).map((label, index) => (
            <button
              key={label}
              onClick={() =>
                onNavigate(
                  index === 3
                    ? "Configuración"
                    : ["Invitados", "Mesas", "Recordatorios"][
                        index
                      ],
                )
              }
            >
              <b>{index + 1}</b>
              {label}
              <span>→</span>
            </button>
          ))}
        </nav>
      </section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {order.eventType} · {formatEventDate(order.eventDate)}
          </span>
          <h1>
            {t("Buenas tardes", "Good afternoon", "Boa tarde")},{" "}
            {order.customerName.split(" ")[0]}
          </h1>
          <p>
            {t(
              "Este es el estado de tu evento hoy.",
              "This is your event status today.",
              "Este é o estado do seu evento hoje.",
            )}
          </p>
        </div>
        {canEdit && (
          <button
            className="outline-button"
            onClick={() => onNavigate("Invitados")}
          >
            ＋ {t("Agregar invitado", "Add guest", "Adicionar convidado")}
          </button>
        )}
      </div>

      <section className="metrics-grid">
        <Metric
          label={t("Cupos asignados", "Assigned seats", "Vagas atribuídas")}
          value={String(seats)}
          note={`${guests.length} ${t("grupos cargados", "groups added", "grupos adicionados")}`}
          tone="blue"
        />
        <Metric
          label={t("Confirmados", "Confirmed", "Confirmados")}
          value={String(confirmed)}
          note={`${confirmed} ${t("respuestas positivas", "positive responses", "respostas positivas")}`}
          tone="green"
        />
        <Metric
          label={t("Pendientes", "Pending", "Pendentes")}
          value={String(pending)}
          note={t(
            "Requieren seguimiento",
            "Need follow-up",
            "Precisam de acompanhamento",
          )}
          tone="amber"
        />
        <Metric
          label={t("No asisten", "Not attending", "Não comparecem")}
          value={String(declined)}
          note={`${responseRate}% ${t("de respuesta total", "total response rate", "de resposta total")}`}
          tone="coral"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel response-panel">
          <div className="panel-title">
            <div>
              <h2>
                {t(
                  "Estado de confirmaciones",
                  "RSVP status",
                  "Status das confirmações",
                )}
              </h2>
              <p>
                {t(
                  "Respuesta sobre el total de invitaciones",
                  "Responses across all invitations",
                  "Respostas sobre o total de convites",
                )}
              </p>
            </div>
            <span className="panel-context">
              {t("Estado actual", "Current status", "Status atual")}
            </span>
          </div>
          <div className="response-content">
            <div
              className="donut"
              style={
                { "--rate": `${responseRate * 3.6}deg` } as React.CSSProperties
              }
            >
              <div>
                <strong>{responseRate}%</strong>
                <span>{t("respondió", "replied", "respondeu")}</span>
              </div>
            </div>
            <div className="legend">
              <div>
                <i className="dot dot-green" />
                <span>{t("Confirmados", "Confirmed", "Confirmados")}</span>
                <strong>{confirmed}</strong>
              </div>
              <div>
                <i className="dot dot-amber" />
                <span>{t("Pendientes", "Pending", "Pendentes")}</span>
                <strong>{pending}</strong>
              </div>
              <div>
                <i className="dot dot-coral" />
                <span>{t("No asisten", "Declined", "Não comparecem")}</span>
                <strong>{declined}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="panel next-actions">
          <div className="panel-title">
            <div>
              <h2>
                {t("Próximas acciones", "Next actions", "Próximas ações")}
              </h2>
              <p>
                {t(
                  "Recomendaciones para avanzar",
                  "Recommended next steps",
                  "Recomendações para avançar",
                )}
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate("Recordatorios")}>
            <span className="action-icon action-yellow">↗</span>
            <div>
              <strong>
                {t(
                  "Enviar recordatorios",
                  "Send reminders",
                  "Enviar lembretes",
                )}
              </strong>
              <small>
                {pending}{" "}
                {t(
                  "invitados todavía no respondieron",
                  "guests have not replied yet",
                  "convidados ainda não responderam",
                )}
              </small>
            </div>
            <b>→</b>
          </button>
          <button onClick={() => onNavigate("Restricciones")}>
            <span className="action-icon action-coral">◇</span>
            <div>
              <strong>
                {t(
                  "Revisar restricciones",
                  "Review dietary needs",
                  "Revisar restrições",
                )}
              </strong>
              <small>
                {restrictions}{" "}
                {t(
                  "requerimientos alimentarios",
                  "dietary requirements",
                  "restrições alimentares",
                )}
              </small>
            </div>
            <b>→</b>
          </button>
          <button onClick={() => onNavigate("Canciones")}>
            <span className="action-icon action-blue">♫</span>
            <div>
              <strong>
                {t("Armar playlist", "Build playlist", "Montar playlist")}
              </strong>
              <small>
                {songs}{" "}
                {t(
                  "canciones sugeridas",
                  "suggested songs",
                  "músicas sugeridas",
                )}
              </small>
            </div>
            <b>→</b>
          </button>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-title">
          <div>
            <h2>
              {t("Actividad reciente", "Recent activity", "Atividade recente")}
            </h2>
            <p>
              {t(
                "Últimas respuestas y cambios",
                "Latest responses and changes",
                "Últimas respostas e alterações",
              )}
            </p>
          </div>
          <button onClick={() => onNavigate("Invitados")}>
            {t("Ver todas", "View all", "Ver todas")} →
          </button>
        </div>
        <div className="activity-list">
          {recentGuests.length === 0 ? (
            <div>
              <p>
                <strong>
                  {t(
                    "Todavía no hay actividad",
                    "No activity yet",
                    "Ainda não há atividade",
                  )}
                </strong>
                <small>
                  {t(
                    "Los cambios aparecerán cuando agregues invitados y recibas respuestas.",
                    "Changes will appear as you add guests and receive responses.",
                    "As alterações aparecerão quando você adicionar convidados e receber respostas.",
                  )}
                </small>
              </p>
            </div>
          ) : (
            recentGuests.map((guest) => {
              const activity = activityCopy(guest);
              return (
                <div key={guest.id}>
                  <span className={`avatar ${activity.tone}`}>
                    {guest.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <p>
                    <GuestNameButton guest={guest}>{activity.title}</GuestNameButton>
                    <small>{activity.detail}</small>
                  </p>
                  <time
                    dateTime={guest.updatedAt}
                    title={reportDate(guest.updatedAt)}
                  >
                    {relativeTime(guest.updatedAt)}
                  </time>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

function Guests({
  guests,
  setGuests,
  defaultPhoneCountryCode,
  defaultInviter,
  invitationUrl,
  canEdit,
}: {
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  defaultPhoneCountryCode: string;
  defaultInviter: string;
  invitationUrl: string;
  canEdit: boolean;
}) {
  const { text: t, language } = useAdminI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState<"name" | "group" | "food" | "status">("name");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkField, setBulkField] = useState<"status" | "group" | "invitedBy">("invitedBy");
  const [bulkValue, setBulkValue] = useState(defaultInviter);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [importPreview, setImportPreview] = useState<GuestImportPreview | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [newGuestCode, setNewGuestCode] = useState(defaultPhoneCountryCode);
  const [newIdentificationType, setNewIdentificationType] = useState(
    suggestedIdentification(defaultPhoneCountryCode),
  );
  const [customGuestCode, setCustomGuestCode] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  const activeGuests = guests.filter((guest) => !guest.archivedAt);
  const archivedInvitations = guests.length - activeGuests.length;
  const confirmedPeople = confirmedPeopleTotal(activeGuests);
  const pendingInvitations = activeGuests.filter((guest) => guest.status === "Pendiente").length;
  const declinedInvitations = activeGuests.filter((guest) => guest.status === "No asiste").length;
  const hasGuestRestriction = guestHasRestriction;
  const dietaryInvitations = activeGuests.filter(hasGuestRestriction).length;
  const unsentInvitations = activeGuests.filter(
    (guest) => guest.status === "Pendiente" && !guest.invitationSentAt,
  ).length;
  const sentPendingInvitations = activeGuests.filter(
    (guest) => guest.status === "Pendiente" && Boolean(guest.invitationSentAt),
  ).length;
  const filtered = guests
    .filter((guest) => {
      const matches = `${guest.name} ${guest.group}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesView =
        filter === "Todos" ||
        filter === "Archivados" ||
        filter === "Logística" ||
        filter === "Sin enviar" ||
        filter === "Enviadas pendientes" ||
        guest.status === filter ||
        (filter === "Restricciones" && hasGuestRestriction(guest)) ||
        (filter === "Respondieron" && guest.status !== "Pendiente");
      const matchesLogistics =
        filter !== "Logística" ||
        Boolean(guest.transportOption || guest.transportStop || guest.menuChoice || guest.accessibilityNeeds || guest.guestNotes);
      const matchesDelivery =
        filter === "Sin enviar"
          ? guest.status === "Pendiente" && !guest.invitationSentAt
          : filter === "Enviadas pendientes"
            ? guest.status === "Pendiente" && Boolean(guest.invitationSentAt)
            : true;
      const matchesArchive = filter === "Archivados" ? Boolean(guest.archivedAt) : !guest.archivedAt;
      return matches && matchesView && matchesDelivery && matchesArchive && matchesLogistics;
    })
    .sort((a, b) =>
      (sortBy === "name"
        ? a.name
        : sortBy === "group"
          ? a.group
          : sortBy === "food"
            ? a.food
            : a.status
      ).localeCompare(
        sortBy === "name"
          ? b.name
          : sortBy === "group"
            ? b.group
            : sortBy === "food"
              ? b.food
              : b.status,
        language,
        { sensitivity: "base" },
      ),
    );

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
        body: JSON.stringify({
          ...Object.fromEntries(data),
          invitedBy: data.get("invitedBy") || defaultInviter,
          phoneCountryCode:
            newGuestCode === "custom" ? customGuestCode : newGuestCode,
        }),
      });
      const result = (await response.json()) as {
        guest?: Guest;
        error?: string;
      };
      if (!response.ok || !result.guest)
        throw new Error(result.error || "No pudimos guardar el invitado.");
      setGuests((current) => [...current, result.guest!]);
      setShowModal(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar el invitado.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setSelectedArchived = async (archived: boolean) => {
    if (
      !selected.length ||
      archived && !window.confirm(
        t(
          `¿Archivar ${selected.length} invitados seleccionados? Podrás restaurarlos después.`,
          `Archive ${selected.length} selected guests? You can restore them later.`,
          `Arquivar ${selected.length} convidados selecionados? Você poderá restaurá-los depois.`,
        ),
      )
    )
      return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: archived ? "bulk-archive" : "bulk-restore", ids: selected }),
      });
      const result = (await response.json()) as { guests?: Guest[]; error?: string };
      if (!response.ok || !result.guests)
        throw new Error(result.error || (archived ? "No pudimos archivar la selección." : "No pudimos restaurar la selección."));
      const archivedGuests = new Map(result.guests.map((guest) => [guest.id, guest]));
      setGuests((current) => current.map((guest) => archivedGuests.get(guest.id) || guest));
      setSelected([]);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : archived ? "No pudimos archivar la selección." : "No pudimos restaurar la selección.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateSelected = async () => {
    if (!selected.length || !bulkValue.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-update",
          ids: selected,
          [bulkField]: bulkValue,
        }),
      });
      const result = (await response.json()) as { guests?: Guest[]; error?: string };
      if (!response.ok || !result.guests)
        throw new Error(result.error || "No pudimos editar la selección.");
      const updated = new Map(result.guests.map((guest) => [guest.id, guest]));
      setGuests((current) => current.map((guest) => updated.get(guest.id) || guest));
      setSelected([]);
      setNotice(t("Selección actualizada.", "Selection updated.", "Seleção atualizada."));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No pudimos editar la selección.");
    } finally {
      setSaving(false);
    }
  };

  const setGuestArchived = async (guest: Guest, archived: boolean) => {
    if (archived &&
      !window.confirm(
        t(
          `¿Archivar a ${guest.name}? Dejará de aparecer en mesas, métricas y recordatorios.`,
          `Archive ${guest.name}? They will no longer appear in tables, metrics or reminders.`,
          `Arquivar ${guest.name}? Não aparecerá mais em mesas, métricas ou lembretes.`,
        ),
      )
    ) return;
    setError("");
    const response = await fetch("/api/admin/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: archived ? "archive" : "restore", id: guest.id }),
    });
    const result = (await response.json()) as { guest?: Guest; error?: string };
    if (!response.ok || !result.guest)
      return setError(result.error || "No pudimos actualizar el archivo.");
    setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
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
          confirmed:
            status === "Confirmado"
              ? Math.max(guest.confirmed, guest.seats)
              : 0,
          food: guest.food,
          song: guest.song,
        }),
      });
      const result = (await response.json()) as {
        guest?: Guest;
        error?: string;
      };
      if (!response.ok || !result.guest)
        throw new Error(
          result.error || "No pudimos actualizar la confirmación.",
        );
      setGuests((current) =>
        current.map((item) => (item.id === guest.id ? result.guest! : item)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No pudimos actualizar la confirmación.",
      );
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
          name: data.get("name"),
          group: data.get("group"),
          invitedBy: data.get("invitedBy"),
          companionOfId: data.get("companionOfId"),
          phone: data.get("phone"),
          phoneCountryCode: data.get("phoneCountryCode"),
          identificationType: data.get("identificationType"),
          identificationNumber: data.get("identificationNumber"),
          transportOption: data.get("transportOption"),
          transportStop: data.get("transportStop"),
          menuChoice: data.get("menuChoice"),
          accessibilityNeeds: data.get("accessibilityNeeds"),
          guestNotes: data.get("guestNotes"),
          guestType: data.get("guestType"),
          socialTogetherWith: data.get("socialTogetherWith"),
          socialSeparateFrom: data.get("socialSeparateFrom"),
          preferredTableName: data.get("preferredTableName"),
        }),
      });
      const result = (await response.json()) as {
        guest?: Guest;
        error?: string;
      };
      if (!response.ok || !result.guest)
        throw new Error(result.error || "No pudimos guardar los datos.");
      setGuests((current) =>
        current.map((item) =>
          item.id === editingGuest.id ? result.guest! : item,
        ),
      );
      setEditingGuest(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No pudimos guardar los datos.",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyInviteLink = async (guest: Guest) => {
    if (!guest.inviteToken) {
      setError(
        "Falta aplicar la migración de enlaces personalizados en Supabase.",
      );
      return;
    }
    const target = invitationUrl || `${window.location.origin}/confirmar`;
    const separator = target.includes("?") ? "&" : "?";
    await navigator.clipboard.writeText(
      `${target}${separator}token=${guest.inviteToken}`,
    );
    setCopiedId(guest.id);
    window.setTimeout(() => setCopiedId(""), 1800);
  };

  const openWhatsAppInvite = (guest: Guest) => {
    if (!guest.inviteToken)
      return setError("Falta el enlace personalizado del invitado.");
    const target = invitationUrl || `${window.location.origin}/confirmar`;
    const separator = target.includes("?") ? "&" : "?";
    const link = `${target}${separator}token=${guest.inviteToken}`;
    const phone = guest.phone.replace(/\D/g, "");
    const message = t(
      `Hola ${guest.name}, queremos invitarte a ${defaultInviter}. Encontrás todos los detalles y la confirmación acá: ${link}`,
      `Hi ${guest.name}, we'd love to invite you to ${defaultInviter}. Details and RSVP: ${link}`,
      `Olá ${guest.name}, queremos convidar você para ${defaultInviter}. Detalhes e confirmação: ${link}`,
    );
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    const invitationSentAt = new Date().toISOString();
    setGuests((current) =>
      current.map((item) =>
        item.id === guest.id
          ? { ...item, whatsappStatus: "sent", invitationSentAt }
          : item,
      ),
    );
    void fetch("/api/admin/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark-invitation-sent",
        id: guest.id,
        channel: "whatsapp",
      }),
    })
      .then(async (response) => {
        const result = (await response.json()) as { guest?: Guest; error?: string };
        if (!response.ok || !result.guest)
          throw new Error(result.error || "No pudimos registrar el envío.");
        setGuests((current) =>
          current.map((item) => (item.id === guest.id ? result.guest! : item)),
        );
      })
      .catch((sendError) =>
        setError(
          sendError instanceof Error
            ? sendError.message
            : "No pudimos registrar el envío.",
        ),
      );
  };

  const downloadTemplate = () =>
    exportCsv(
      "plantilla-invitados.csv",
      [
        t("Nombre", "Name", "Nome"),
        t("Grupo", "Group", "Grupo"),
        "WhatsApp",
        t("Código país", "Country code", "Código do país"),
        t("Cupos", "Seats", "Vagas"),
        "Email",
        t("Tipo identificación", "ID type", "Tipo de identificação"),
        t("Identificación", "ID number", "Identificação"),
        t("Restricción", "Dietary need", "Restrição"),
        t("Invitado por", "Invited by", "Convidado por"),
        t("Acompañante de", "Companion of", "Acompanhante de"),
      ],
      [
        [
          "Valentina Pérez",
          "Familia Pérez",
          "99123456",
          defaultPhoneCountryCode,
          2,
          "valentina@ejemplo.com",
          suggestedIdentification(defaultPhoneCountryCode),
          "",
          "Vegetariana",
          defaultInviter,
          "",
        ],
      ],
    );

  const exportGuestReport = () =>
    exportCsv(
      `invitados-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t("Invitado", "Guest", "Convidado"),
        t("Grupo", "Group", "Grupo"),
        t("Estado", "Status", "Status"),
        t("Cupos", "Seats", "Vagas"),
        t("Personas confirmadas", "Confirmed people", "Pessoas confirmadas"),
        "WhatsApp",
        "Email",
        t("Restricción", "Dietary need", "Restrição"),
        t("Invitación enviada", "Invitation sent", "Convite enviado"),
        t("Invitación abierta", "Invitation opened", "Convite aberto"),
        t("Respuesta recibida", "Response received", "Resposta recebida"),
        t("Transporte", "Transport", "Transporte"),
        t("Parada", "Stop", "Parada"),
        t("Menú", "Menu", "Menu"),
        t("Accesibilidad", "Accessibility", "Acessibilidade"),
        t("Observaciones", "Notes", "Observações"),
        t("Última actualización", "Last update", "Última atualização"),
      ],
      activeGuests.map((guest) => [
        guest.name,
        guest.group,
        adminStatus(language, guest.status),
        guest.seats,
        confirmedPeopleForGuest(guest, guests),
        guest.phone,
        guest.email,
        guest.food,
        guest.invitationSentAt ? reportDate(guest.invitationSentAt, language) : "",
        guest.invitationOpenedAt ? reportDate(guest.invitationOpenedAt, language) : "",
        guest.respondedAt ? reportDate(guest.respondedAt, language) : "",
        guest.transportOption,
        guest.transportStop,
        guest.menuChoice,
        guest.accessibilityNeeds,
        guest.guestNotes,
        reportDate(guest.updatedAt, language === "es" ? "es-UY" : language === "pt" ? "pt-BR" : "en-US"),
      ]),
    );

  const importGuests = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const rows = await readGuestFile(file);
      if (rows.length < 2) throw new Error("El archivo no contiene invitados.");
      const normalize = (value: string) =>
        value
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .trim();
      const headers = rows[0].map((header: string) => normalize(header));
      const column = (...names: string[]) =>
        headers.findIndex((header) => names.includes(header));
      const nameIndex = column("nombre", "invitado", "nombre y apellido");
      if (nameIndex < 0)
        throw new Error('La plantilla debe incluir una columna "Nombre".');
      const groupIndex = column("grupo", "familia");
      const phoneIndex = column("whatsapp", "telefono", "celular");
      const codeIndex = column(
        "codigo pais",
        "codigo de pais",
        "pais",
        "caracteristica",
      );
      const seatsIndex = column("cupos", "personas", "cantidad");
      const emailIndex = column("email", "correo");
      const identificationTypeIndex = column(
        "tipo identificacion",
        "tipo de identificacion",
        "documento",
      );
      const identificationNumberIndex = column(
        "identificacion",
        "numero identificacion",
        "numero de identificacion",
      );
      const foodIndex = column(
        "restriccion",
        "restricciones",
        "alimentacion",
        "dieta",
      );
      const invitedByIndex = column("invitado por", "invita", "responsable");
      const companionOfIndex = column(
        "acompanante de",
        "acompañante de",
        "invitado principal",
      );
      const names = new Map(
        guests.map((guest) => [normalize(guest.name), guest.id]),
      );
      const imported: GuestImportDraft[] = rows
        .slice(1)
        .map((values: string[]) => ({
          name: values[nameIndex],
          group: groupIndex >= 0 ? values[groupIndex] : "",
          phone: phoneIndex >= 0 ? values[phoneIndex] : "",
          phoneCountryCode:
            codeIndex >= 0 && values[codeIndex]
              ? values[codeIndex]
              : defaultPhoneCountryCode,
          seats: seatsIndex >= 0 ? values[seatsIndex] : "1",
          email: emailIndex >= 0 ? values[emailIndex] : "",
          identificationType:
            identificationTypeIndex >= 0 && values[identificationTypeIndex]
              ? values[identificationTypeIndex]
              : "",
          identificationNumber:
            identificationNumberIndex >= 0
              ? values[identificationNumberIndex]
              : "",
          food: foodIndex >= 0 ? values[foodIndex] : "",
          invitedBy:
            invitedByIndex >= 0 && values[invitedByIndex]
              ? values[invitedByIndex]
              : defaultInviter,
          companionOfId:
            companionOfIndex >= 0 && values[companionOfIndex]
              ? names.get(normalize(values[companionOfIndex])) || ""
              : "",
        }))
        .filter((guest: { name: string }) => guest.name);
      if (!imported.length)
        throw new Error(t("No encontramos filas con nombre.", "We found no rows with a name.", "Não encontramos linhas com nome."));
      const existingNames = new Set(
        guests.map((guest) => normalize(`${guest.name}|${guest.group}`)),
      );
      const existingPhones = new Set(
        guests.map((guest) => guest.phone.replace(/\D/g, "")).filter(Boolean),
      );
      const existingEmails = new Set(
        guests.map((guest) => guest.email.trim().toLowerCase()).filter(Boolean),
      );
      const seenNames = new Set<string>();
      const seenPhones = new Set<string>();
      const seenEmails = new Set<string>();
      const previewRows = imported.map((guest) => {
        const nameKey = normalize(`${guest.name}|${guest.group}`);
        const phoneKey = `${guest.phoneCountryCode}${guest.phone}`.replace(/\D/g, "");
        const emailKey = guest.email.trim().toLowerCase();
        const duplicate = existingPhones.has(phoneKey) && phoneKey
          ? t("WhatsApp ya registrado", "WhatsApp already exists", "WhatsApp já cadastrado")
          : existingEmails.has(emailKey) && emailKey
            ? t("Email ya registrado", "Email already exists", "Email já cadastrado")
            : existingNames.has(nameKey) || seenNames.has(nameKey)
              ? t("Nombre y grupo repetidos", "Duplicate name and group", "Nome e grupo repetidos")
              : seenPhones.has(phoneKey) && phoneKey
                ? t("WhatsApp repetido en el archivo", "Duplicate WhatsApp in file", "WhatsApp repetido no arquivo")
                : seenEmails.has(emailKey) && emailKey
                  ? t("Email repetido en el archivo", "Duplicate email in file", "Email repetido no arquivo")
                  : "";
        const errors: string[] = [];
        if (!/^\+\d{1,4}$/.test(guest.phoneCountryCode))
          errors.push(t("Código de país inválido", "Invalid country code", "Código de país inválido"));
        const seats = Number(guest.seats);
        if (!Number.isInteger(seats) || seats < 1 || seats > 20)
          errors.push(t("Cupos fuera de rango", "Seats out of range", "Vagas fora do limite"));
        seenNames.add(nameKey);
        if (phoneKey) seenPhones.add(phoneKey);
        if (emailKey) seenEmails.add(emailKey);
        return { guest, duplicate, errors };
      });
      setImportPreview({ fileName: file.name, rows: previewRows });
      setNotice("");
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "No pudimos leer el archivo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmGuestImport = async () => {
    if (!importPreview) return;
    const eligible = importPreview.rows
      .filter((row) => !row.duplicate && row.errors.length === 0)
      .map((row) => row.guest);
    if (!eligible.length) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: eligible, defaultPhoneCountryCode }),
      });
      const result = (await response.json()) as {
        guests?: Guest[];
        error?: string;
      };
      if (!response.ok || !result.guests)
        throw new Error(result.error || "No pudimos importar los invitados.");
      setGuests((current) => [...current, ...result.guests!]);
      setNotice(
        t(
          `${result.guests.length} invitados importados correctamente desde ${importPreview.fileName}.`,
          `${result.guests.length} guests imported successfully from ${importPreview.fileName}.`,
          `${result.guests.length} convidados importados com sucesso de ${importPreview.fileName}.`,
        ),
      );
      setImportPreview(null);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "No pudimos importar los invitados.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t("Gestión del evento", "Event management", "Gestão do evento")}
          </span>
          <h1>{t("Invitados", "Guests", "Convidados")}</h1>
          <p>
            {canEdit
              ? t(
                  "Administrá grupos, cupos y enlaces personalizados.",
                  "Manage groups, seats and personalized links.",
                  "Gerencie grupos, vagas e links personalizados.",
                )
              : t(
                  "Consultá grupos, cupos y enlaces personalizados.",
                  "View groups, seats and personalized links.",
                  "Consulte grupos, vagas e links personalizados.",
                )}
          </p>
        </div>
        <div className="heading-actions">
          <button className="outline-button" onClick={exportGuestReport}>
            ⇩ {t("Exportar lista", "Export list", "Exportar lista")}
          </button>
          {canEdit && (
            <button
              className="primary-button small"
              onClick={() => setShowModal(true)}
            >
              ＋ {t("Agregar invitado", "Add guest", "Adicionar convidado")}
            </button>
          )}
        </div>
      </div>
      <ContextHelp
        title={t(
          "Cómo funciona una invitación",
          "How an invitation works",
          "Como funciona um convite",
        )}
      >
        {t(
          "Cada registro representa una invitación. Los cupos indican cuántas personas pueden confirmar con ese mismo enlace personalizado.",
          "Each record represents one invitation. Seats indicate how many people can RSVP through that personalized link.",
          "Cada registro representa um convite. As vagas indicam quantas pessoas podem confirmar pelo mesmo link personalizado.",
        )}
      </ContextHelp>
      <section className="guest-operation-summary" aria-label={t("Resumen de invitados", "Guest summary", "Resumo de convidados")}>
        <button className={filter === "Todos" ? "active" : ""} onClick={() => setFilter("Todos")}>
          <span>{t("Invitaciones", "Invitations", "Convites")}</span>
          <strong>{activeGuests.length}</strong>
          <small>{t("lista completa", "full list", "lista completa")}</small>
        </button>
        <button className={filter === "Confirmado" ? "active" : ""} onClick={() => setFilter("Confirmado")}>
          <span>{t("Confirmaron", "Confirmed", "Confirmaram")}</span>
          <strong>{confirmedPeople}</strong>
          <small>{t("personas", "people", "pessoas")}</small>
        </button>
        <button className={`${filter === "Pendiente" ? "active " : ""}${pendingInvitations ? "needs-attention" : ""}`} onClick={() => setFilter("Pendiente")}>
          <span>{t("Pendientes", "Pending", "Pendentes")}</span>
          <strong>{pendingInvitations}</strong>
          <small>{t("requieren seguimiento", "need follow-up", "requerem acompanhamento")}</small>
        </button>
        <button className={`${filter === "Sin enviar" ? "active " : ""}${unsentInvitations ? "needs-attention" : ""}`} onClick={() => setFilter("Sin enviar")}>
          <span>{t("Sin enviar", "Not sent", "Não enviados")}</span>
          <strong>{unsentInvitations}</strong>
          <small>{t("primer contacto pendiente", "awaiting first contact", "primeiro contato pendente")}</small>
        </button>
        <button className={filter === "Enviadas pendientes" ? "active" : ""} onClick={() => setFilter("Enviadas pendientes")}>
          <span>{t("Enviadas", "Sent", "Enviados")}</span>
          <strong>{sentPendingInvitations}</strong>
          <small>{t("esperando respuesta", "awaiting response", "aguardando resposta")}</small>
        </button>
        <button className={filter === "No asiste" ? "active" : ""} onClick={() => setFilter("No asiste")}>
          <span>{t("No asisten", "Declined", "Não comparecem")}</span>
          <strong>{declinedInvitations}</strong>
          <small>{t("invitaciones", "invitations", "convites")}</small>
        </button>
        <button className={filter === "Restricciones" ? "active" : ""} onClick={() => setFilter("Restricciones")}>
          <span>{t("Restricciones", "Dietary needs", "Restrições")}</span>
          <strong>{dietaryInvitations}</strong>
          <small>{t("para catering", "for catering", "para catering")}</small>
        </button>
        <button className={filter === "Archivados" ? "active" : ""} onClick={() => setFilter("Archivados")}>
          <span>{t("Archivados", "Archived", "Arquivados")}</span>
          <strong>{archivedInvitations}</strong>
          <small>{t("fuera de la operación", "outside operations", "fora da operação")}</small>
        </button>
      </section>
      <section className="panel table-panel">
        <div className="table-tools">
          <label className="search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(
                "Buscar invitado o grupo…",
                "Search guest or group…",
                "Buscar convidado ou grupo…",
              )}
            />
          </label>
          <div className="filter-pills">
            {["Todos", "Sin enviar", "Enviadas pendientes", "Confirmado", "Pendiente", "No asiste", "Respondieron", "Restricciones", "Logística", "Archivados"].map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "Todos"
                  ? t("Todos", "All", "Todos")
                  : item === "Sin enviar"
                    ? t("Sin enviar", "Not sent", "Não enviados")
                    : item === "Enviadas pendientes"
                      ? t("Enviadas, sin respuesta", "Sent, no response", "Enviados, sem resposta")
                  : item === "Respondieron"
                    ? t("Respondieron", "Responded", "Responderam")
                    : item === "Restricciones"
                      ? t("Con restricciones", "With dietary needs", "Com restrições")
                      : item === "Archivados"
                        ? t("Archivados", "Archived", "Arquivados")
                      : item === "Logística"
                        ? t("Con logística", "With logistics", "Com logística")
                      : adminStatus(language, item)}
              </button>
            ))}
          </div>
          <label className={`sort-control ${sortBy !== "name" ? "is-active" : ""}`}>
            {t("Ordenar", "Sort", "Ordenar")}
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as typeof sortBy)
              }
            >
              <option value="name">A–Z</option>
              <option value="group">
                {t("Por grupo", "By group", "Por grupo")}
              </option>
              <option value="food">
                {t("Por restricción", "By dietary need", "Por restrição")}
              </option>
              <option value="status">
                {t("Por estado", "By status", "Por status")}
              </option>
            </select>
          </label>
          {canEdit && (
            <div className="import-actions">
              <button
                className="help-circle"
                type="button"
                onClick={() => setShowImportHelp(true)}
              >
                ?
              </button>
              <button
                className="outline-button compact"
                disabled={saving}
                onClick={() => importInput.current?.click()}
              >
                {saving
                  ? t("Importando…", "Importing…", "Importando…")
                  : `⇩ ${t("Importar archivo", "Import file", "Importar arquivo")}`}
              </button>
              <input
                ref={importInput}
                className="visually-hidden"
                type="file"
                accept=".csv,.xlsx,.docx"
                onChange={importGuests}
              />
            </div>
          )}
        </div>
        {canEdit && selected.length > 0 && (
          <div className="bulk-actions">
            <strong>
              {selected.length} {t("seleccionados", "selected", "selecionados")}
            </strong>
            {filter !== "Archivados" && <select
              value={bulkField}
              onChange={(event) => {
                const field = event.target.value as typeof bulkField;
                setBulkField(field);
                setBulkValue(field === "status" ? "Pendiente" : field === "invitedBy" ? defaultInviter : "");
              }}
              aria-label={t("Campo a editar", "Field to edit", "Campo para editar")}
            >
              <option value="invitedBy">{t("Invitador", "Invited by", "Anfitrião")}</option>
              <option value="status">{t("Estado", "Status", "Status")}</option>
              <option value="group">{t("Grupo", "Group", "Grupo")}</option>
            </select>}
            {filter !== "Archivados" && (bulkField === "status" ? (
              <select value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}>
                <option value="Pendiente">{adminStatus(language, "Pendiente")}</option>
                <option value="Confirmado">{adminStatus(language, "Confirmado")}</option>
                <option value="No asiste">{adminStatus(language, "No asiste")}</option>
              </select>
            ) : (
              <input
                value={bulkValue}
                onChange={(event) => setBulkValue(event.target.value)}
                placeholder={bulkField === "group" ? t("Nombre del grupo", "Group name", "Nome do grupo") : t("Nombre del invitador", "Host name", "Nome do anfitrião")}
              />
            ))}
            {filter !== "Archivados" && <button className="primary-button small" type="button" disabled={saving || !bulkValue.trim()} onClick={updateSelected}>
              {t("Aplicar", "Apply", "Aplicar")}
            </button>}
            <button
              className={filter === "Archivados" ? "primary-button small" : "delete-button"}
              type="button"
              disabled={saving}
              onClick={() => setSelectedArchived(filter !== "Archivados")}
            >
              {filter === "Archivados"
                ? t("Restaurar selección", "Restore selection", "Restaurar seleção")
                : t("Archivar selección", "Archive selection", "Arquivar seleção")}
            </button>
            <button
              className="copy-button"
              type="button"
              onClick={() => setSelected([])}
            >
              {t("Cancelar", "Cancel", "Cancelar")}
            </button>
          </div>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {canEdit && (
                  <th className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        filtered.every((guest) => selected.includes(guest.id))
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? filtered.map((guest) => guest.id)
                            : [],
                        )
                      }
                    />
                  </th>
                )}
                <th>{t("Invitado", "Guest", "Convidado")}</th>
                <th>{t("Grupo", "Group", "Grupo")}</th>
                <th>{t("Confirmados / cupos", "Confirmed / seats", "Confirmados / vagas")}</th>
                <th>{t("Estado", "Status", "Status")}</th>
                <th>{t("Restricción", "Dietary need", "Restrição")}</th>
                <th>{t("Seguimiento", "Tracking", "Acompanhamento")}</th>
                <th>{t("Acciones", "Actions", "Ações")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((guest) => (
                <tr key={guest.id}>
                  {canEdit && (
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selected.includes(guest.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...new Set([...current, guest.id])]
                              : current.filter((id) => id !== guest.id),
                          )
                        }
                      />
                    </td>
                  )}
                  <td>
                    <div className="person">
                      <GuestAvatar guest={guest} />
                      <p>
                        <GuestNameButton guest={guest} />
                        <small>
                          {guest.companionOfId
                            ? `↳ ${t("Acompañante", "Companion", "Acompanhante")}`
                            : guest.phone}
                        </small>
                      </p>
                    </div>
                  </td>
                  <td>{guest.group}</td>
                  <td>{(() => { const progress = seatProgress(guest, guests); return <span className="seat-progress"><strong>{progress.used}/{progress.total}</strong><small>{t("confirmados / cupos", "confirmed / seats", "confirmados / vagas")}</small></span>; })()}</td>
                  <td>
                    {canEdit && !guest.archivedAt ? (
                      <select
                        className={`status-select status-${guest.status.toLowerCase().replace(" ", "-")}`}
                        value={guest.status}
                        disabled={updatingId === guest.id}
                        onChange={(event) =>
                          updateStatus(
                            guest,
                            event.target.value as Guest["status"],
                          )
                        }
                        aria-label={`${t("Estado de", "Status for", "Status de")} ${guest.name}`}
                      >
                        <option value="Confirmado">
                          {adminStatus(language, "Confirmado")}
                        </option>
                        <option value="Pendiente">
                          {adminStatus(language, "Pendiente")}
                        </option>
                        <option value="No asiste">
                          {adminStatus(language, "No asiste")}
                        </option>
                      </select>
                    ) : (
                      <Status value={guest.status} />
                    )}
                  </td>
                  <td>
                    <div className="restriction-chips">
                      {meaningfulGuestValue(guest.food) && <span className="is-food">⚠ {guest.food}</span>}
                      {guest.socialTogetherWith && <span className="is-together">↔ {guest.socialTogetherWith}</span>}
                      {guest.socialSeparateFrom && <span className="is-separate">⇥ {guest.socialSeparateFrom}</span>}
                      {guest.preferredTableName && <span className="is-preferred">⌖ {guest.preferredTableName}</span>}
                      {!hasGuestRestriction(guest) && <span className="is-empty">—</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`delivery-status ${guest.respondedAt ? "responded" : guest.invitationOpenedAt ? "opened" : guest.invitationSentAt ? "sent" : "unsent"}`}>
                      {guest.respondedAt
                        ? `${t("Respondió", "Responded", "Respondeu")} · ${reportDate(guest.respondedAt, language)}`
                        : guest.invitationOpenedAt
                          ? `${t("Abrió", "Opened", "Abriu")} · ${reportDate(guest.invitationOpenedAt, language)}`
                          : guest.invitationSentAt
                            ? `${t("Enviada", "Sent", "Enviado")} · ${reportDate(guest.invitationSentAt, language)}`
                            : t("Sin enviar", "Not sent", "Não enviado")}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions icon-actions">
                      {!guest.archivedAt && <button
                        className="icon-button"
                        onClick={() => copyInviteLink(guest)}
                        title={t("Copiar enlace", "Copy link", "Copiar link")}
                        aria-label={t("Copiar enlace", "Copy link", "Copiar link")}
                      >
                        {copiedId === guest.id ? "✓" : "⧉"}
                      </button>}
                      {!guest.archivedAt && <button
                        className="whatsapp-button"
                        disabled={!guest.phone}
                        onClick={() => openWhatsAppInvite(guest)}
                      >
                        WA
                      </button>}
                      {canEdit && !guest.archivedAt && <>
                        <button
                          className="icon-button"
                          onClick={() => setEditingGuest(guest)}
                          title={t("Editar", "Edit", "Editar")}
                          aria-label={`${t("Editar", "Edit", "Editar")} ${guest.name}`}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-button danger"
                          onClick={() => setGuestArchived(guest, true)}
                          aria-label={`${t("Archivar a", "Archive", "Arquivar")} ${guest.name}`}
                          title={t("Archivar", "Archive", "Arquivar")}
                        >
                          <svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>
                        </button>
                      </>}
                      {canEdit && guest.archivedAt && (
                        <button className="outline-button compact" onClick={() => setGuestArchived(guest, false)}>
                          {t("Restaurar", "Restore", "Restaurar")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {notice && (
          <p className="import-success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="table-error" role="alert">
            {error}
          </p>
        )}
        <div className="table-footer">
          <span>
            {t(
              `Mostrando ${filtered.length} de ${filter === "Archivados" ? archivedInvitations : activeGuests.length} invitados`,
              `Showing ${filtered.length} of ${filter === "Archivados" ? archivedInvitations : activeGuests.length} guests`,
              `Mostrando ${filtered.length} de ${filter === "Archivados" ? archivedInvitations : activeGuests.length} convidados`,
            )}
          </span>
        </div>
      </section>
      {showImportHelp && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowImportHelp(false)}
        >
          <div
            className="modal import-help-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowImportHelp(false)}
            >
              ×
            </button>
            <span className="eyebrow">
              {t(
                "Importación de invitados",
                "Guest import",
                "Importação de convidados",
              )}
            </span>
            <h2>
              {t(
                "Cómo preparar el archivo",
                "How to prepare the file",
                "Como preparar o arquivo",
              )}
            </h2>
            <p>
              {t(
                "Se admiten CSV, Excel XLSX y tablas de Word DOCX. La primera fila debe contener los encabezados.",
                "CSV, Excel XLSX and Word DOCX tables are supported. The first row must contain headers.",
                "CSV, Excel XLSX e tabelas do Word DOCX são aceitos. A primeira linha deve conter cabeçalhos.",
              )}
            </p>
            <div className="column-help">
              <strong>{t("Obligatoria", "Required", "Obrigatória")}</strong>
              <code>Nombre</code>
              <strong>{t("Opcionales", "Optional", "Opcionais")}</strong>
              <code>
                Grupo · WhatsApp · Código país · Cupos · Email · Tipo
                identificación · Identificación · Restricción · Invitado por ·
                Acompañante de
              </code>
            </div>
            <p className="dynamic-help">
              {t(
                "En “Acompañante de” escribí exactamente el nombre del invitado principal ya cargado.",
                "In “Companion of”, enter the exact name of an existing primary guest.",
                "Em “Acompanhante de”, informe exatamente o nome do convidado principal já cadastrado.",
              )}
            </p>
            <div className="modal-actions">
              <button className="outline-button" onClick={downloadTemplate}>
                {t("Descargar plantilla", "Download template", "Baixar modelo")}
              </button>
              <button
                className="primary-button small"
                onClick={() => {
                  setShowImportHelp(false);
                  importInput.current?.click();
                }}
              >
                {t("Elegir archivo", "Choose file", "Escolher arquivo")}
              </button>
            </div>
          </div>
        </div>
      )}
      {importPreview && (() => {
        const eligibleCount = importPreview.rows.filter(
          (row) => !row.duplicate && row.errors.length === 0,
        ).length;
        const duplicateCount = importPreview.rows.filter((row) => row.duplicate).length;
        const errorCount = importPreview.rows.filter((row) => row.errors.length).length;
        return (
          <div className="modal-backdrop" onMouseDown={() => setImportPreview(null)}>
            <div className="modal import-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
              <button className="modal-close" type="button" onClick={() => setImportPreview(null)}>×</button>
              <span className="eyebrow">{t("Revisión previa", "Import review", "Revisão da importação")}</span>
              <h2>{t("Revisá antes de importar", "Review before importing", "Revise antes de importar")}</h2>
              <p className="import-preview-file">{importPreview.fileName}</p>
              <div className="import-preview-summary">
                <span><strong>{eligibleCount}</strong>{t("listos", "ready", "prontos")}</span>
                <span className={duplicateCount ? "warning" : ""}><strong>{duplicateCount}</strong>{t("duplicados", "duplicates", "duplicados")}</span>
                <span className={errorCount ? "danger" : ""}><strong>{errorCount}</strong>{t("con errores", "with errors", "com erros")}</span>
              </div>
              <p className="dynamic-help">
                {t(
                  "Los duplicados y las filas con errores se omitirán. Nada se guardará hasta que confirmes.",
                  "Duplicates and invalid rows will be skipped. Nothing is saved until you confirm.",
                  "Duplicados e linhas inválidas serão ignorados. Nada será salvo até você confirmar.",
                )}
              </p>
              <div className="import-preview-table">
                <table>
                  <thead><tr><th>{t("Estado", "Status", "Status")}</th><th>{t("Nombre", "Name", "Nome")}</th><th>{t("Grupo", "Group", "Grupo")}</th><th>WhatsApp</th><th>{t("Cupos", "Seats", "Vagas")}</th></tr></thead>
                  <tbody>
                    {importPreview.rows.map((row, index) => {
                      const issue = row.errors.join(" · ") || row.duplicate;
                      return (
                        <tr key={`${row.guest.name}-${index}`} className={row.errors.length ? "invalid" : row.duplicate ? "duplicate" : "valid"}>
                          <td><span>{issue || t("Listo", "Ready", "Pronto")}</span></td>
                          <td><strong>{row.guest.name}</strong><small>{row.guest.email}</small></td>
                          <td>{row.guest.group || "—"}</td>
                          <td>{row.guest.phone ? `${row.guest.phoneCountryCode} ${row.guest.phone}` : "—"}</td>
                          <td>{row.guest.seats}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {error && <p className="table-error" role="alert">{error}</p>}
              <div className="modal-actions">
                <button className="outline-button" type="button" onClick={() => setImportPreview(null)}>{t("Cancelar", "Cancel", "Cancelar")}</button>
                <button className="primary-button small" type="button" disabled={saving || eligibleCount === 0} onClick={confirmGuestImport}>
                  {saving
                    ? t("Importando…", "Importing…", "Importando…")
                    : t(`Importar ${eligibleCount} invitados`, `Import ${eligibleCount} guests`, `Importar ${eligibleCount} convidados`)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <form
            className="modal"
            onSubmit={addGuest}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <span className="eyebrow">
              {t("Nuevo registro", "New record", "Novo registro")}
            </span>
            <h2>{t("Agregar invitado", "Add guest", "Adicionar convidado")}</h2>
            <div className="form-grid">
              <label>
                {t("Nombre y apellido", "Full name", "Nome completo")}
                <input name="name" required />
              </label>
              <label>
                {t("Grupo", "Group", "Grupo")}
                <input
                  name="group"
                  placeholder={t("Ej. Familia", "E.g. Family", "Ex. Família")}
                />
              </label>
              <label>
                {t("País de WhatsApp", "WhatsApp country", "País do WhatsApp")}
                <select
                  value={
                    countryCodes.some(([, code]) => code === newGuestCode)
                      ? newGuestCode
                      : "custom"
                  }
                  onChange={(event) => {
                    const code = event.target.value;
                    setNewGuestCode(code);
                    if (code !== "custom")
                      setNewIdentificationType(suggestedIdentification(code));
                  }}
                >
                  {countryCodes.map(([country, code]) => (
                    <option key={code} value={code}>
                      {country} {code}
                    </option>
                  ))}
                  <option value="custom">
                    {t("Otro país", "Other country", "Outro país")}
                  </option>
                </select>
              </label>
              {newGuestCode === "custom" && (
                <label>
                  {t(
                    "Código internacional",
                    "International code",
                    "Código internacional",
                  )}
                  <input
                    value={customGuestCode}
                    onChange={(event) => setCustomGuestCode(event.target.value)}
                    placeholder="+___"
                    required
                  />
                </label>
              )}
              <label>
                WhatsApp
                <input name="phone" inputMode="tel" placeholder="99 123 456" />
              </label>
              <label>
                {t("Cupos", "Seats", "Vagas")}
                <input
                  name="seats"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="1"
                />
              </label>
              <label>
                {t("Categoría", "Category", "Categoria")}
                <select name="guestType" defaultValue="adult">
                  <option value="adult">{t("Adulto", "Adult", "Adulto")}</option>
                  <option value="teen">{t("Adolescente", "Teenager", "Adolescente")}</option>
                  <option value="child">{t("Niño/a", "Child", "Criança")}</option>
                </select>
              </label>
              <label>
                Email
                <input name="email" type="email" />
              </label>
              <label>
                {t(
                  "Invitación realizada por",
                  "Invited by",
                  "Convite feito por",
                )}
                <input name="invitedBy" defaultValue={defaultInviter} />
              </label>
              <label>
                {t("Acompañante de", "Companion of", "Acompanhante de")}
                <select name="companionOfId" defaultValue="">
                  <option value="">
                    {t(
                      "Invitación principal",
                      "Primary invitation",
                      "Convite principal",
                    )}
                  </option>
                  {guests
                    .filter((guest) => !guest.companionOfId)
                    .map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {t(
                  "Tipo de identificación",
                  "ID type",
                  "Tipo de identificação",
                )}
                <select
                  name="identificationType"
                  value={newIdentificationType}
                  onChange={(event) =>
                    setNewIdentificationType(event.target.value)
                  }
                >
                  <option value="">
                    {t("Sin identificación", "No ID", "Sem identificação")}
                  </option>
                  <option>CI</option>
                  <option>DNI</option>
                  <option>CPF</option>
                  <option>{t("Pasaporte", "Passport", "Passaporte")}</option>
                  <option>{t("Otro", "Other", "Outro")}</option>
                </select>
              </label>
              <label>
                {t(
                  "Número de identificación",
                  "ID number",
                  "Número de identificação",
                )}
                <input
                  name="identificationNumber"
                  placeholder={t("Opcional", "Optional", "Opcional")}
                />
              </label>
            </div>
            {error && <p className="login-error">{error}</p>}
            <div className="modal-actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => setShowModal(false)}
              >
                {t("Cancelar", "Cancel", "Cancelar")}
              </button>
              <button
                className="primary-button small"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? t("Guardando…", "Saving…", "Salvando…")
                  : t("Guardar invitado", "Save guest", "Salvar convidado")}
              </button>
            </div>
          </form>
        </div>
      )}
      {editingGuest && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setEditingGuest(null)}
        >
          <form
            className="modal"
            onSubmit={updateDetails}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setEditingGuest(null)}
            >
              ×
            </button>
            <span className="eyebrow">Información del invitado</span>
            <h2>Editar a {editingGuest.name}</h2>
            <div className="form-grid">
              <label>
                Nombre y apellido
                <input name="name" defaultValue={editingGuest.name} required />
              </label>
              <label>
                Grupo
                <input name="group" defaultValue={editingGuest.group} />
              </label>
              <label>
                {t("Categoría", "Category", "Categoria")}
                <select name="guestType" defaultValue={editingGuest.guestType || "adult"}>
                  <option value="adult">{t("Adulto", "Adult", "Adulto")}</option>
                  <option value="teen">{t("Adolescente", "Teenager", "Adolescente")}</option>
                  <option value="child">{t("Niño/a", "Child", "Criança")}</option>
                </select>
              </label>
              <label>
                Invitación realizada por
                <input
                  name="invitedBy"
                  defaultValue={editingGuest.invitedBy || defaultInviter}
                />
              </label>
              <label>
                Acompañante de
                <select
                  name="companionOfId"
                  defaultValue={editingGuest.companionOfId}
                >
                  <option value="">Invitación principal</option>
                  {guests
                    .filter(
                      (guest) =>
                        guest.id !== editingGuest.id && !guest.companionOfId,
                    )
                    .map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Código de país
                <input
                  name="phoneCountryCode"
                  defaultValue={
                    editingGuest.phoneCountryCode || defaultPhoneCountryCode
                  }
                  placeholder="+598"
                  required
                />
              </label>
              <label>
                WhatsApp
                <input
                  name="phone"
                  inputMode="tel"
                  defaultValue={editingGuest.phone.replace(
                    editingGuest.phoneCountryCode || defaultPhoneCountryCode,
                    "",
                  )}
                />
              </label>
              <label>
                Tipo de identificación
                <select
                  name="identificationType"
                  defaultValue={editingGuest.identificationType}
                >
                  <option value="">Sin identificación</option>
                  <option>CI</option>
                  <option>DNI</option>
                  <option>CPF</option>
                  <option>Pasaporte</option>
                  <option>Otro</option>
                </select>
              </label>
              <label>
                Número de identificación
                <input
                  name="identificationNumber"
                  defaultValue={editingGuest.identificationNumber}
                  placeholder="Opcional"
                />
              </label>
              <label>
                Restricción alimentaria
                <input
                  name="food"
                  defaultValue={
                    editingGuest.food === "—" ? "" : editingGuest.food
                  }
                  placeholder="Ej. Vegetariano, celíaco…"
                />
              </label>
              <label>
                Canción sugerida
                <input
                  name="song"
                  defaultValue={
                    editingGuest.song === "—" ? "" : editingGuest.song
                  }
                  placeholder="Canción — Artista"
                />
              </label>
              <label>Transporte<select name="transportOption" defaultValue={editingGuest.transportOption}><option value="">No necesita</option><option value="Ida">Ida</option><option value="Regreso">Regreso</option><option value="Ida y regreso">Ida y regreso</option></select></label>
              <label>Parada del transporte <small className="field-help">Sólo si usa el traslado del evento.</small><input name="transportStop" defaultValue={editingGuest.transportStop} placeholder="Ej. Terminal Tres Cruces" /></label>
              <label>Preferencia de menú<input name="menuChoice" defaultValue={editingGuest.menuChoice} /></label>
              <label>Accesibilidad<input name="accessibilityNeeds" defaultValue={editingGuest.accessibilityNeeds} /></label>
              <label>Sentar junto a<input name="socialTogetherWith" defaultValue={editingGuest.socialTogetherWith} placeholder="Nombre o grupo" /></label>
              <label>Sentar separado de<input name="socialSeparateFrom" defaultValue={editingGuest.socialSeparateFrom} placeholder="Nombre o grupo" /></label>
              <label>Mesa preferida<input name="preferredTableName" defaultValue={editingGuest.preferredTableName} placeholder="Ej. Mesa familiar" /></label>
              <label className="form-span-2">Observaciones<textarea name="guestNotes" rows={3} defaultValue={editingGuest.guestNotes} /></label>
            </div>
            {error && <p className="login-error">{error}</p>}
            <div className="modal-actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => setEditingGuest(null)}
              >
                Cancelar
              </button>
              <button
                className="primary-button small"
                type="submit"
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function Confirmations({ guests }: { guests: Guest[] }) {
  const { text: t, locale, language } = useAdminI18n();
  const [query, setQuery] = useState("");
  const visibleGuests = guests.filter((guest) =>
    `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase()),
  );
  const confirmed = confirmedPeopleTotal(guests);
  const pending = guests.filter((guest) => guest.status === "Pendiente").length;
  const declined = guests.filter(
    (guest) => guest.status === "No asiste",
  ).length;
  const exportReport = () =>
    exportCsv(
      `confirmaciones-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t("Invitado", "Guest", "Convidado"),
        t("Grupo", "Group", "Grupo"),
        t("Estado", "Status", "Status"),
        t("Cupos asignados", "Assigned seats", "Vagas atribuídas"),
        t("Personas confirmadas", "Confirmed people", "Pessoas confirmadas"),
        "WhatsApp",
        t("Tipo identificación", "ID type", "Tipo de identificação"),
        t("Identificación", "ID number", "Identificação"),
        t("Restricción", "Dietary need", "Restrição"),
        t("Canción", "Song", "Música"),
        t("Última actualización", "Last update", "Última atualização"),
      ],
      guests.flatMap((guest) => [
        [
          guest.name,
          guest.group,
          adminStatus(language, guest.status),
          guest.seats,
          confirmedPeopleForGuest(guest, guests),
          guest.phone,
          guest.identificationType,
          guest.identificationNumber,
          guest.food,
          guest.song,
          reportDate(guest.updatedAt, locale),
        ],
        ...guest.companions.map((companion) => [
          `↳ ${companion.name}`,
          guest.group,
          adminStatus(language, guest.status),
          "",
          "",
          "",
          companion.identificationType,
          companion.identificationNumber,
          companion.food || t("Ninguna", "None", "Nenhuma"),
          "",
          reportDate(guest.updatedAt, locale),
        ]),
      ]),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t("Respuestas RSVP", "RSVP responses", "Respostas RSVP")}
          </span>
          <h1>{t("Confirmaciones", "RSVPs", "Confirmações")}</h1>
          <p>
            {t(
              "Consultá las respuestas recibidas y su información asociada.",
              "Review received responses and their associated information.",
              "Consulte as respostas recebidas e suas informações.",
            )}
          </p>
        </div>
        <button className="outline-button" onClick={exportReport}>
          ⇩ {t("Exportar reporte", "Export report", "Exportar relatório")}
        </button>
      </div>
      <section className="metrics-grid mini">
        <Metric
          label={t("Confirmaron", "Confirmed", "Confirmaram")}
          value={String(confirmed)}
          note={t("Personas", "People", "Pessoas")}
          tone="green"
        />
        <Metric
          label={t("Pendientes", "Pending", "Pendentes")}
          value={String(pending)}
          note={t("Invitaciones", "Invitations", "Convites")}
          tone="amber"
        />
        <Metric
          label={t("No asisten", "Declined", "Não comparecem")}
          value={String(declined)}
          note={t("Invitaciones", "Invitations", "Convites")}
          tone="coral"
        />
      </section>
      <section className="panel table-panel">
        <div className="table-tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado o grupo…", "Search guest or group…", "Buscar convidado ou grupo…")} /></label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("Invitado", "Guest", "Convidado")}</th>
                <th>{t("Respuesta", "Response", "Resposta")}</th>
                <th>
                  {t("Grupo confirmado", "Confirmed group", "Grupo confirmado")}
                </th>
                <th>{t("Restricción", "Dietary need", "Restrição")}</th>
                <th>{t("Canción", "Song", "Música")}</th>
                <th>{t("Fecha", "Date", "Data")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleGuests
                .filter((guest) => guest.status !== "Pendiente")
                .map((guest) => (
                  <React.Fragment key={guest.id}>
                    <tr className="primary-guest-row">
                      <td>
                        <span className="guest-role-badge primary-role">
                          {t(
                            "Invitación principal",
                            "Primary invitation",
                            "Convite principal",
                          )}
                        </span>
                        <GuestNameButton guest={guest} />
                        <small className="cell-sub">{guest.group}</small>
                      </td>
                      <td>
                        <Status value={guest.status} />
                      </td>
                      <td>
                        <strong>
                          {confirmedPeopleForGuest(guest, guests)}{" "}
                          {confirmedPeopleForGuest(guest, guests) === 1
                            ? t("persona", "person", "pessoa")
                            : t("personas", "people", "pessoas")}
                        </strong>
                        <small className="cell-sub">
                          {t(
                            "Total de esta invitación",
                            "Total for this invitation",
                            "Total deste convite",
                          )}
                        </small>
                      </td>
                      <td>{guest.food}</td>
                      <td>{guest.song}</td>
                      <td>{reportDate(guest.updatedAt, locale)}</td>
                    </tr>
                    {guest.companions.map((companion, index) => (
                      <tr
                        className="companion-row"
                        key={`${guest.id}-${index}`}
                      >
                        <td>
                          <span className="guest-role-badge companion-role">
                            {t("Acompañante", "Companion", "Acompanhante")}
                          </span>
                          <GuestNameButton guest={guest}>{companion.name}</GuestNameButton>
                          <small className="cell-sub">
                            {t("Invitado por", "Invited by", "Convidado por")}{" "}
                            {guest.name}
                          </small>
                        </td>
                        <td>
                          <Status value={guest.status} />
                        </td>
                        <td>
                          <span className="included-in-group">
                            {t(
                              "Incluido en el total",
                              "Included in total",
                              "Incluído no total",
                            )}{" "}
                            ↑
                          </span>
                        </td>
                        <td>
                          {companion.food || t("Ninguna", "None", "Nenhuma")}
                        </td>
                        <td>—</td>
                        <td>{reportDate(guest.updatedAt, locale)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
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
  space: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "round" | "rectangular" | "square";
  seatAssignments: Record<string, number>;
  rotation: number;
  locked: boolean;
};

type FloorElement = {
  id: string;
  kind: "entrance" | "dance-floor" | "gourmet" | "hydration" | "custom";
  label: string;
  space: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function Seating({ guests, canEdit }: { guests: Guest[]; canEdit: boolean }) {
  const { text: t } = useAdminI18n();
  const confirmedGuests = guests.filter(
    (guest) => guest.status === "Confirmado",
  );
  const [tables, setTables] = useState<EventTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventTable | null>(null);
  const [tableName, setTableName] = useState("Mesa 3");
  const [capacity, setCapacity] = useState(8);
  const [note, setNote] = useState("");
  const [tableShape, setTableShape] = useState<EventTable["shape"]>("round");
  const [query, setQuery] = useState("");
  const [layoutMode, setLayoutMode] = useState(false);
  const [spaces, setSpaces] = useState(["Espacio 1"]);
  const [spaceSizes, setSpaceSizes] = useState<Record<string, { width: number; height: number }>>({ "Espacio 1": { width: 1200, height: 700 } });
  const [layoutNotice, setLayoutNotice] = useState("");
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [floorZoom, setFloorZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [layoutUndoStack, setLayoutUndoStack] = useState<Array<{ before: EventTable; after: EventTable }>>([]);
  const [layoutRedoStack, setLayoutRedoStack] = useState<Array<{ before: EventTable; after: EventTable }>>([]);
  const [dragGuestId, setDragGuestId] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [tableQuery, setTableQuery] = useState("");
  const [compactTables, setCompactTables] = useState(false);
  const [assignmentSavingId, setAssignmentSavingId] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [guestCategoryFilter, setGuestCategoryFilter] = useState<"all" | "adult" | "teen" | "child">("all");
  const [lastAssignment, setLastAssignment] = useState<{
    guestId: string;
    fromTableId: string;
    toTableId: string;
    fromSeatNumber: number;
  } | null>(null);

  const assignedIds = tables.flatMap((table) => table.guests);
  const unassigned = confirmedGuests.filter(
    (guest) => !assignedIds.includes(guest.id),
  );
  const assignedPeople = tables.reduce(
    (total, table) =>
      total +
      table.guests.reduce(
        (sum, id) => {
          const guest = guests.find((item) => item.id === id);
          return sum + (guest ? confirmedPeopleForGuest(guest, guests) : 0);
        },
        0,
      ),
    0,
  );
  const totalConfirmed = confirmedPeopleTotal(confirmedGuests);
  const totalCapacity = tables.reduce(
    (total, table) => total + table.capacity,
    0,
  );
  const visibleTables = tables.filter((table) => {
    const guestNames = table.guests.map((id) => guests.find((guest) => guest.id === id)?.name || "").join(" ");
    return `${table.name} ${guestNames}`.toLowerCase().includes(tableQuery.toLowerCase());
  });
  const socialConflicts = (() => {
    const conflicts = new Map<string, { id: string; tableId: string; message: string }>();
    const findReferencedGuest = (reference: string, guestId: string) => {
      const normalized = normalizedReference(reference);
      return normalized
        ? confirmedGuests.find((candidate) => candidate.id !== guestId && (
            normalizedReference(candidate.name).includes(normalized) ||
            normalized.includes(normalizedReference(candidate.name))
          ))
        : undefined;
    };
    confirmedGuests.forEach((guest) => {
      const table = tables.find((candidate) => candidate.guests.includes(guest.id));
      if (!table) return;
      const together = findReferencedGuest(guest.socialTogetherWith, guest.id);
      const togetherTable = together && tables.find((candidate) => candidate.guests.includes(together.id));
      if (together && togetherTable?.id !== table.id) {
        const id = `together-${[guest.id, together.id].sort().join("-")}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name} ${t("debe sentarse junto a", "should sit with", "deve sentar junto a")} ${together.name}` });
      }
      const separate = findReferencedGuest(guest.socialSeparateFrom, guest.id);
      const separateTable = separate && tables.find((candidate) => candidate.guests.includes(separate.id));
      if (separate && separateTable?.id === table.id) {
        const id = `separate-${[guest.id, separate.id].sort().join("-")}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name} ${t("debe sentarse separado de", "should sit separately from", "deve sentar separado de")} ${separate.name}` });
      }
      if (guest.preferredTableName && !normalizedReference(table.name).includes(normalizedReference(guest.preferredTableName))) {
        const id = `preferred-${guest.id}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name}: ${t("mesa preferida", "preferred table", "mesa preferida")} “${guest.preferredTableName}”` });
      }
    });
    return [...conflicts.values()];
  })();

  const focusTable = (direction: -1 | 1) => {
    if (!visibleTables.length) return;
    const currentIndex = visibleTables.findIndex((table) => {
      const rect = document.getElementById(`table-card-${table.id}`)?.getBoundingClientRect();
      return Boolean(rect && rect.top >= 70 && rect.top < window.innerHeight * 0.7);
    });
    const nextIndex = Math.min(visibleTables.length - 1, Math.max(0, (currentIndex < 0 ? (direction > 0 ? -1 : 1) : currentIndex) + direction));
    document.getElementById(`table-card-${visibleTables[nextIndex].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const selectGuestForSeat = (guestId: string) => {
    setSelectedGuestId((current) => current === guestId ? "" : guestId);
    const currentTable = tables.find((table) => table.guests.includes(guestId));
    if (currentTable) requestAnimationFrame(() => document.getElementById(`table-card-${currentTable.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  useEffect(() => {
    fetch("/api/admin/tables")
      .then(async (response) => {
        const result = (await response.json()) as {
          tables?: EventTable[];
          layoutElements?: FloorElement[];
          layoutSpaces?: Array<{ name: string; width: number; height: number }>;
          error?: string;
        };
        if (!response.ok || !result.tables)
          throw new Error(result.error || "No pudimos cargar las mesas.");
        setTables(result.tables);
        setFloorElements(result.layoutElements || []);
        setSpaceSizes((current) => ({ ...current, ...Object.fromEntries((result.layoutSpaces || []).map((space) => [space.name, { width: space.width, height: space.height }])) }));
        const loadedSpaces = [...new Set(result.tables.map((table) => table.space || "Espacio 1"))];
        setSpaces(loadedSpaces.length ? loadedSpaces : ["Espacio 1"]);
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las mesas.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const openNew = (shape: EventTable["shape"] = "round") => {
    setEditing(null);
    setTableName(`Mesa ${tables.length + 1}`);
    setCapacity(8);
    setNote("");
    setTableShape(shape);
    setShowModal(true);
  };

  const openEdit = (table: EventTable) => {
    setEditing(table);
    setTableName(table.name);
    setCapacity(table.capacity);
    setNote(table.note);
    setTableShape(table.shape || "round");
    setShowModal(true);
  };

  const saveTable = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tables", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name: tableName,
          capacity,
          note,
          shape: tableShape,
        }),
      });
      const result = (await response.json()) as {
        table?: EventTable;
        error?: string;
      };
      if (!response.ok || !result.table)
        throw new Error(result.error || "No pudimos guardar la mesa.");
      setTables((current) =>
        editing
          ? current.map((table) =>
              table.id === editing.id
                ? { ...result.table!, guests: table.guests, seatAssignments: table.seatAssignments || {} }
                : table,
            )
          : [...current, result.table!],
      );
      setShowModal(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar la mesa.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    const table = tables.find((item) => item.id === tableId);
    if (
      !window.confirm(
        `¿Eliminar ${table?.name || "esta mesa"}? Sus invitados quedarán sin mesa asignada.`,
      )
    )
      return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/tables?id=${encodeURIComponent(tableId)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No pudimos eliminar la mesa.");
      setTables((current) => current.filter((table) => table.id !== tableId));
      setShowModal(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No pudimos eliminar la mesa.",
      );
    } finally {
      setSaving(false);
    }
  };

  const assignGuest = async (
    guestId: string,
    tableId: string,
    remember = true,
    seatNumber = 0,
  ) => {
    setError("");
    const fromTable = tables.find((table) => table.guests.includes(guestId));
    const fromTableId = fromTable?.id || "";
    const fromSeatNumber = fromTable?.seatAssignments?.[guestId] || 0;
    if (fromTableId === tableId && fromSeatNumber === seatNumber) return true;
    setAssignmentSavingId(guestId);
    setAssignmentStatus("saving");
    try {
      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", guestId, tableId, seatNumber }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No pudimos asignar el invitado.");
      setTables((current) =>
        current.map((table) => {
          const nextAssignments = { ...(table.seatAssignments || {}) };
          delete nextAssignments[guestId];
          if (table.id === tableId && seatNumber) nextAssignments[guestId] = seatNumber;
          return {
            ...table,
            seatAssignments: nextAssignments,
            guests:
              table.id === tableId
                ? [...table.guests.filter((id) => id !== guestId), guestId]
                : table.guests.filter((id) => id !== guestId),
          };
        }),
      );
      if (remember) setLastAssignment({ guestId, fromTableId, toTableId: tableId, fromSeatNumber });
      setDragGuestId("");
      setAssignmentStatus("saved");
      window.setTimeout(() => setAssignmentStatus((current) => current === "saved" ? "idle" : current), 1800);
      return true;
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "No pudimos asignar el invitado.",
      );
      setAssignmentStatus("error");
      return false;
    } finally {
      setAssignmentSavingId("");
    }
  };

  const unassignGuest = (guestId: string) => assignGuest(guestId, "");

  const undoLastAssignment = async () => {
    if (!lastAssignment) return;
    const restored = await assignGuest(
      lastAssignment.guestId,
      lastAssignment.fromTableId,
      false,
      lastAssignment.fromSeatNumber,
    );
    if (restored) setLastAssignment(null);
  };


  const saveTableLayout = async (table: EventTable) => {
    const response = await fetch("/api/admin/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "layout", id: table.id, space: table.space, x: table.x, y: table.y, width: table.width, height: table.height, rotation: table.rotation || 0, locked: Boolean(table.locked) }),
    });
    if (!response.ok) throw new Error("No pudimos guardar el plano.");
  };

  const rememberLayoutChange = (before: EventTable, after: EventTable) => {
    setLayoutUndoStack((current) => [...current.slice(-29), { before, after }]);
    setLayoutRedoStack([]);
  };

  const restoreLayoutVersion = async (table: EventTable) => {
    setTables((current) => current.map((item) => item.id === table.id ? table : item));
    await saveTableLayout(table);
  };

  const undoLayoutChange = async () => {
    const change = layoutUndoStack.at(-1);
    if (!change) return;
    setSaving(true);
    try {
      await restoreLayoutVersion(change.before);
      setLayoutUndoStack((current) => current.slice(0, -1));
      setLayoutRedoStack((current) => [...current.slice(-29), change]);
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : "No pudimos deshacer el cambio.");
    } finally { setSaving(false); }
  };

  const redoLayoutChange = async () => {
    const change = layoutRedoStack.at(-1);
    if (!change) return;
    setSaving(true);
    try {
      await restoreLayoutVersion(change.after);
      setLayoutRedoStack((current) => current.slice(0, -1));
      setLayoutUndoStack((current) => [...current.slice(-29), change]);
    } catch (redoError) {
      setError(redoError instanceof Error ? redoError.message : "No pudimos rehacer el cambio.");
    } finally { setSaving(false); }
  };

  const moveTable = async (table: EventTable, space: string, x: number, y: number) => {
    if (table.locked) return;
    const grid = snapToGrid ? 16 : 1;
    const next = { ...table, space, x: Math.max(0, Math.round(x / grid) * grid), y: Math.max(0, Math.round(y / grid) * grid) };
    setTables((current) => current.map((item) => item.id === table.id ? next : item));
    try {
      await saveTableLayout(next);
      rememberLayoutChange(table, next);
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "No pudimos guardar la posición.");
    }
  };

  const updateTableLayout = async (table: EventTable, changes: Partial<EventTable>) => {
    const next = { ...table, ...changes };
    setTables((current) => current.map((item) => item.id === table.id ? next : item));
    try {
      await saveTableLayout(next);
      rememberLayoutChange(table, next);
    } catch (layoutError) {
      setError(layoutError instanceof Error ? layoutError.message : "No pudimos actualizar la mesa.");
    }
  };

  const duplicateTable = async (table: EventTable) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${table.name} ${t("copia", "copy", "cópia")}`, capacity: table.capacity, note: table.note, shape: table.shape }) });
      const result = (await response.json()) as { table?: EventTable; error?: string };
      if (!response.ok || !result.table) throw new Error(result.error || "No pudimos duplicar la mesa.");
      const duplicate = { ...result.table, guests: [], seatAssignments: {}, space: table.space, x: Math.min(840, (table.x || 24) + 32), y: Math.min(440, (table.y || 24) + 32), width: table.width, height: table.height, rotation: table.rotation || 0, locked: false };
      await saveTableLayout(duplicate);
      setTables((current) => [...current, duplicate]);
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : "No pudimos duplicar la mesa.");
    } finally {
      setSaving(false);
    }
  };

  const overlappingTableIds = new Set(tables.flatMap((table, index) =>
    tables.slice(index + 1).flatMap((other) => {
      if ((table.space || "Espacio 1") !== (other.space || "Espacio 1")) return [];
      const margin = 8;
      const overlaps = (table.x || 24) < (other.x || 24) + (other.width || 140) + margin && (table.x || 24) + (table.width || 140) + margin > (other.x || 24) && (table.y || 24) < (other.y || 24) + (other.height || 70) + margin && (table.y || 24) + (table.height || 70) + margin > (other.y || 24);
      return overlaps ? [table.id, other.id] : [];
    })
  ));

  const resizeTable = (table: EventTable, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = table.width || 140;
    const startHeight = table.height || 70;
    let resized = table;
    const onMove = (moveEvent: PointerEvent) => {
      resized = { ...table, width: Math.max(100, Math.min(300, startWidth + moveEvent.clientX - startX)), height: Math.max(60, Math.min(180, startHeight + moveEvent.clientY - startY)) };
      setTables((current) => current.map((item) => item.id === table.id ? resized : item));
    };
    const onEnd = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      void saveTableLayout(resized)
        .then(() => rememberLayoutChange(table, resized))
        .catch(() => setError("No pudimos guardar el nuevo tamaño."));
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onEnd);
  };

  const saveFloorElement = async (element: FloorElement, method: "POST" | "PATCH" = "PATCH") => {
    const response = await fetch("/api/admin/tables", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "layout-element", ...element }) });
    const result = await response.json() as { element?: FloorElement; error?: string };
    if (!response.ok || !result.element) throw new Error(result.error || "No pudimos guardar el elemento.");
    return result.element;
  };

  const addFloorElement = async (kind: FloorElement["kind"], label: string, position?: { space: string; x: number; y: number }) => {
    try {
      const element = await saveFloorElement({ id: "", kind, label, space: position?.space || spaces[0], x: position?.x ?? 40, y: position?.y ?? 90, width: kind === "dance-floor" ? 220 : 150, height: kind === "dance-floor" ? 130 : 80 }, "POST");
      setFloorElements((current) => [...current, element]);
    } catch (addError) { setError(addError instanceof Error ? addError.message : "No pudimos agregar el elemento."); }
  };

  const updateFloorElement = (element: FloorElement, changes: Partial<FloorElement>) => {
    const next = { ...element, ...changes };
    setFloorElements((current) => current.map((item) => item.id === element.id ? next : item));
    return next;
  };

  const persistFloorElement = (element: FloorElement) => void saveFloorElement(element).catch((saveError) => setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el elemento."));

  const deleteFloorElement = async (id: string) => {
    const response = await fetch(`/api/admin/tables?elementId=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setFloorElements((current) => current.filter((item) => item.id !== id));
    else setError("No pudimos eliminar el elemento.");
  };

  const resizeFloorElement = (element: FloorElement, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    const startX = event.clientX, startY = event.clientY, startWidth = element.width, startHeight = element.height;
    let resized = element;
    const onMove = (moveEvent: PointerEvent) => {
      resized = updateFloorElement(element, { width: Math.max(90, Math.min(420, startWidth + moveEvent.clientX - startX)), height: Math.max(55, Math.min(260, startHeight + moveEvent.clientY - startY)) });
    };
    const onEnd = () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onEnd); persistFloorElement(resized); };
    document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onEnd);
  };

  const exportPlan = () => {
    const width = 1200;
    const spaceHeight = 520;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.max(spaceHeight, spaces.length * spaceHeight);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f5f8f9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    spaces.forEach((space, index) => {
      const top = index * spaceHeight;
      context.fillStyle = "#17384b";
      context.font = "bold 24px sans-serif";
      context.fillText(space, 24, top + 36);
      tables.filter((table) => (table.space || "Espacio 1") === space).forEach((table) => {
        const x = Math.min(width - 190, table.x || 24);
        const y = top + 58 + Math.min(420, table.y || 24);
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#0aabb0";
        context.lineWidth = 3;
        context.beginPath();
        const tableWidth = table.width || 140;
        const tableHeight = table.height || 70;
        context.roundRect(x, y, tableWidth, tableHeight, 14);
        context.fill();
        context.stroke();
        context.fillStyle = "#17384b";
        context.font = "bold 18px sans-serif";
        context.fillText(table.name, x + 14, y + Math.min(32, tableHeight / 2));
        context.font = "14px sans-serif";
        context.fillText(`${table.capacity} lugares`, x + 14, y + Math.min(58, tableHeight - 10));
      });
      floorElements.filter((element) => element.space === space).forEach((element) => {
        const x = Math.min(width - element.width, element.x);
        const y = top + 58 + Math.min(420, element.y);
        context.fillStyle = "#dff5f2";
        context.strokeStyle = "#17384b";
        context.lineWidth = 2;
        context.fillRect(x, y, element.width, element.height);
        context.strokeRect(x, y, element.width, element.height);
        context.fillStyle = "#17384b";
        context.font = "bold 16px sans-serif";
        context.fillText(element.label, x + 12, y + 28);
      });
    });
    const link = document.createElement("a");
    link.download = "plano-de-mesas.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportDetailedReport = () => {
    const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
    const spaceSections = spaces.map((space) => {
      const spaceTables = tables.filter((table) => (table.space || "Espacio 1") === space);
      const drawingTables = spaceTables.map((table) => `<div class="draw-table" style="left:${Math.min(82, (table.x || 0) / 10)}%;top:${Math.min(82, (table.y || 0) / 5)}%;width:${Math.max(10, (table.width || 140) / 10)}%;height:${Math.max(9, (table.height || 70) / 5)}%"><b>${safe(table.name)}</b><span>${table.capacity} ${safe(t("lugares", "seats", "lugares"))}</span></div>`).join("");
      const drawingElements = floorElements.filter((element) => element.space === space).map((element) => `<div class="draw-element" style="left:${Math.min(84, element.x / 10)}%;top:${Math.min(84, element.y / 5)}%;width:${Math.max(9, element.width / 10)}%;height:${Math.max(8, element.height / 5)}%">${safe(element.label)}</div>`).join("");
      const details = spaceTables.map((table) => {
        const tableGuests = table.guests.map((id) => guests.find((guest) => guest.id === id)).filter(Boolean) as Guest[];
        const occupied = tableGuests.reduce((total, guest) => total + confirmedPeopleForGuest(guest, guests), 0);
        const menuSummary = new Map<string, number>();
        tableGuests.forEach((guest) => {
          if (!meaningfulGuestValue(guest.menuChoice)) return;
          menuSummary.set(guest.menuChoice, (menuSummary.get(guest.menuChoice) || 0) + confirmedPeopleForGuest(guest, guests));
        });
        const operationalSummary = [
          ...[...menuSummary].map(([menu, count]) => `${count}× ${menu}`),
          ...tableGuests.filter((guest) => meaningfulGuestValue(guest.accessibilityNeeds)).map((guest) => `${guest.name}: ${guest.accessibilityNeeds}`),
        ];
        const seats = seatingRowsForTable(table);
        return `<article class="table-detail"><h3>${safe(table.name)}</h3><p><b>${occupied}/${table.capacity}</b> ${safe(t("lugares ocupados", "occupied seats", "lugares ocupados"))}${table.note ? ` · ${safe(table.note)}` : ""}</p>${operationalSummary.length ? `<div class="ops"><b>${safe(t("Operativa", "Operations", "Operação"))}:</b> ${operationalSummary.map(safe).join(" · ")}</div>` : ""}<ul>${seats.length ? seats.map((seat) => { const needs = [seat.menu, seat.food, seat.accessibility].filter(meaningfulGuestValue); return `<li><b>${safe(t("Asiento", "Seat", "Assento"))} ${seat.seat}</b> · ${safe(seat.name)} <span>${safe(seat.category)}${needs.length ? ` · ${needs.map(safe).join(" · ")}` : ""}</span></li>`; }).join("") : `<li>${safe(t("Sin invitados asignados", "No assigned guests", "Sem convidados atribuídos"))}</li>`}</ul></article>`;
      }).join("");
      return `<section><h2>${safe(space)}</h2><div class="drawing">${drawingElements}${drawingTables}</div><div class="details">${details || `<p>${safe(t("Sin mesas en este espacio", "No tables in this space", "Sem mesas neste espaço"))}</p>`}</div></section>`;
    }).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safe(t("Reporte de mesas", "Table report", "Relatório de mesas"))}</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font:12px Arial;color:#19354d;margin:0}header{display:flex;justify-content:space-between;border-bottom:2px solid #0aabb0;padding-bottom:10px;margin-bottom:18px}h1{margin:0;font:28px Georgia}header p{margin:6px 0 0;color:#718292}section{page-break-after:always}section:last-child{page-break-after:auto}h2{font:22px Georgia}.drawing{position:relative;height:360px;border:2px dashed #b9d9dc;border-radius:12px;background:#f8fbfc;overflow:hidden}.draw-table,.draw-element{position:absolute;display:grid;place-items:center;text-align:center;padding:6px;border-radius:9px}.draw-table{border:2px solid #0aabb0;background:#fff}.draw-table b{font-size:11px}.draw-table span,.draw-element{font-size:9px}.draw-element{border:1px solid #dde6ea;background:#dff5f2;color:#078f96;font-weight:bold}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.table-detail{border:1px solid #dde6ea;border-radius:10px;padding:12px;break-inside:avoid}.table-detail h3{margin:0 0 5px}.table-detail p{margin:0 0 8px;color:#718292}.table-detail .ops{margin:8px 0;padding:7px;border-radius:6px;background:#fff6dd;color:#694f08;font-size:9px}.table-detail ul{margin:0;padding-left:18px}.table-detail li{margin:4px 0}.table-detail li span{color:#718292}footer{position:fixed;bottom:0;right:0;color:#718292;font-size:9px}@media print{.print-action{display:none}}</style></head><body><header><div><h1>${safe(t("Plano y reporte de mesas", "Table plan and report", "Plano e relatório de mesas"))}</h1><p>${safe(t("Distribución completa del evento", "Complete event layout", "Distribuição completa do evento"))}</p></div><button class="print-action" onclick="window.print()">${safe(t("Guardar como PDF o imprimir", "Save as PDF or print", "Salvar como PDF ou imprimir"))}</button></header>${spaceSections}<footer>${new Date().toLocaleDateString()}</footer></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  function seatingRowsForTable(table: EventTable) {
    const slots: Array<{ guest: Guest; name: string } | undefined> = Array(table.capacity).fill(undefined);
    const tableGuests = table.guests.map((id) => guests.find((guest) => guest.id === id)).filter(Boolean) as Guest[];
    const place = (guest: Guest, preferredSeat = 0) => {
      const people = confirmedPeopleForGuest(guest, guests);
      const names = [guest.name, ...guest.companions.map((companion) => companion.name).filter(Boolean)];
      const fits = (start: number) => start >= 0 && start + people <= slots.length && Array.from({ length: people }, (_, index) => !slots[start + index]).every(Boolean);
      let start = preferredSeat && fits(preferredSeat - 1) ? preferredSeat - 1 : -1;
      if (start < 0) start = Array.from({ length: slots.length }, (_, index) => index).find(fits) ?? -1;
      if (start < 0) return;
      Array.from({ length: people }, (_, index) => { slots[start + index] = { guest, name: names[index] || `${t("Acompañante de", "Companion of", "Acompanhante de")} ${guest.name}` }; });
    };
    tableGuests.filter((guest) => table.seatAssignments?.[guest.id]).forEach((guest) => place(guest, table.seatAssignments[guest.id]));
    tableGuests.filter((guest) => !table.seatAssignments?.[guest.id]).forEach((guest) => place(guest));
    return slots.flatMap((slot, index) => slot ? [{
      table: table.name,
      seat: index + 1,
      name: slot.name,
      category: slot.guest.guestType === "child" ? t("Niño/a", "Child", "Criança") : slot.guest.guestType === "teen" ? t("Adolescente", "Teenager", "Adolescente") : t("Adulto", "Adult", "Adulto"),
      menu: slot.guest.menuChoice || "",
      food: meaningfulGuestValue(slot.guest.food) ? slot.guest.food : "",
      accessibility: slot.guest.accessibilityNeeds || "",
      notes: slot.guest.guestNotes || "",
    }] : []);
  }

  const exportCateringReport = () => {
    const rows = tables.flatMap(seatingRowsForTable);
    exportCsv(
      "catering-por-mesa.csv",
      [t("Mesa", "Table", "Mesa"), t("Asiento", "Seat", "Assento"), t("Nombre", "Name", "Nome"), t("Categoría", "Category", "Categoria"), t("Menú", "Menu", "Menu"), t("Alergias / restricciones", "Allergies / dietary needs", "Alergias / restrições"), t("Accesibilidad", "Accessibility", "Acessibilidade"), t("Observaciones", "Notes", "Observações")],
      rows.map((row) => [row.table, row.seat, row.name, row.category, row.menu, row.food, row.accessibility, row.notes]),
    );
  };

  const savePlan = async () => {
    setSaving(true);
    setError("");
    try {
      const responses = await Promise.all([
        ...tables.map((table) => fetch("/api/admin/tables", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "layout", id: table.id, space: table.space || "Espacio 1", x: table.x || 24, y: table.y || 24, width: table.width || 140, height: table.height || 70, rotation: table.rotation || 0, locked: Boolean(table.locked) }) })),
        ...floorElements.map((element) => fetch("/api/admin/tables", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "layout-element", ...element }) })),
      ]);
      if (responses.some((response) => !response.ok)) throw new Error("No pudimos guardar todo el plano.");
      setLayoutNotice(t("Plano guardado.", "Layout saved.", "Plano salvo."));
      window.setTimeout(() => setLayoutNotice(""), 2000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el plano.");
    } finally {
      setSaving(false);
    }
  };

  const saveSpaceSize = async (space: string, width: number, height: number) => {
    const next = { width: Math.max(700, Math.min(2400, width)), height: Math.max(480, Math.min(1800, height)) };
    setSpaceSizes((current) => ({ ...current, [space]: next }));
    const response = await fetch("/api/admin/tables", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "space-settings", space, ...next }) });
    if (!response.ok) setError(t("No pudimos guardar el tamaño del espacio.", "Could not save space size.", "Não foi possível salvar o tamanho do espaço."));
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t(
              "Distribución del salón",
              "Venue layout",
              "Distribuição do salão",
            )}
          </span>
          <h1>
            {t("Organización de mesas", "Table plan", "Organização de mesas")}
          </h1>
          <p>
            {canEdit
              ? t(
                  "Asigná invitados confirmados y controlá la capacidad de cada mesa.",
                  "Assign confirmed guests and control each table's capacity.",
                  "Atribua convidados confirmados e controle a capacidade de cada mesa.",
                )
              : t(
                  "Consultá la distribución y capacidad de las mesas.",
                  "View table distribution and capacity.",
                  "Consulte a distribuição e capacidade das mesas.",
                )}
          </p>
        </div>
        <div className="heading-actions">
          <button className="outline-button" onClick={exportDetailedReport}>⇩ {t("Exportar reporte", "Export report", "Exportar relatório")}</button>
          <button className="outline-button" onClick={exportCateringReport}>⇩ {t("Catering", "Catering", "Catering")}</button>
          <button className={`outline-button ${layoutMode ? "active" : ""}`} onClick={() => setLayoutMode((value) => !value)}>{layoutMode ? t("Ver lista", "View list", "Ver lista") : t("Editar plano", "Edit layout", "Editar plano")}</button>
          {canEdit && <button className="primary-button small" onClick={() => openNew()}>＋ {t("Agregar mesa", "Add table", "Adicionar mesa")}</button>}
        </div>
      </div>
      <ContextHelp
        title={t("Antes de asignar", "Before assigning", "Antes de atribuir")}
      >
        {t(
          "Sólo aparecen invitaciones confirmadas. La capacidad cuenta a todas las personas confirmadas dentro de cada grupo.",
          "Only confirmed invitations appear. Capacity counts every confirmed person within each group.",
          "Apenas convites confirmados aparecem. A capacidade conta todas as pessoas confirmadas de cada grupo.",
        )}
      </ContextHelp>
      {loading && (
        <p className="module-notice">
          {t(
            "Cargando organización de mesas…",
            "Loading table plan…",
            "Carregando organização das mesas…",
          )}
        </p>
      )}
      {error && (
        <p className="table-error seating-error" role="alert">
          {error}
        </p>
      )}
      {socialConflicts.length > 0 && (
        <section className="social-conflict-summary" role="status">
          <strong>⚠ {socialConflicts.length} {socialConflicts.length === 1 ? t("conflicto de distribución", "seating conflict", "conflito de distribuição") : t("conflictos de distribución", "seating conflicts", "conflitos de distribuição")}</strong>
          <span>{t("Revisá las preferencias sociales marcadas dentro de cada mesa.", "Review the social preferences marked on each table.", "Revise as preferências sociais marcadas em cada mesa.")}</span>
        </section>
      )}

      <section className="seating-summary">
        <article>
          <span>{t("Mesas creadas", "Tables created", "Mesas criadas")}</span>
          <strong>{tables.length}</strong>
          <small>
            {totalCapacity}{" "}
            {t("lugares disponibles", "available seats", "lugares disponíveis")}
          </small>
        </article>
        <article>
          <span>
            {t("Personas ubicadas", "People seated", "Pessoas alocadas")}
          </span>
          <strong>{assignedPeople}</strong>
          <small>
            {t("de", "of", "de")} {totalConfirmed}{" "}
            {t("confirmadas", "confirmed", "confirmadas")}
          </small>
        </article>
        <article className={unassigned.length ? "summary-warning" : ""}>
          <span>{t("Sin asignar", "Unassigned", "Sem atribuição")}</span>
          <strong>{totalConfirmed - assignedPeople}</strong>
          <small>
            {unassigned.length
              ? t("Requiere atención", "Needs attention", "Requer atenção")
              : t(
                  "Todos tienen mesa",
                  "Everyone has a table",
                  "Todos têm mesa",
                )}
          </small>
        </article>
      </section>

      {layoutMode && (
        <section className="panel floor-plan-panel">
          <div className="floor-plan-toolbar">
            <strong>{t("Plano arrastrable", "Draggable layout", "Plano arrastável")}</strong>
            <span>{t("Arrastrá cada mesa hasta su posición.", "Drag each table into position.", "Arraste cada mesa para sua posição.")}</span>
            {canEdit && <button className="outline-button compact" onClick={() => setSpaces((current) => [...current, `Espacio ${current.length + 1}`])}>＋ {t("Agregar espacio", "Add space", "Adicionar espaço")}</button>}
            {canEdit && <button className="primary-button small" disabled={saving} onClick={savePlan}>{saving ? t("Guardando…", "Saving…", "Salvando…") : t("Guardar modificaciones", "Save changes", "Salvar alterações")}</button>}
            <button className="outline-button compact" onClick={exportPlan}>⇩ PNG</button>
            <div className="floor-zoom" aria-label={t("Zoom del plano", "Layout zoom", "Zoom do plano")}>
              <button onClick={() => setFloorZoom((value) => Math.max(.6, Number((value - .1).toFixed(1))))}>−</button>
              <span>{Math.round(floorZoom * 100)}%</span>
              <button onClick={() => setFloorZoom((value) => Math.min(1.5, Number((value + .1).toFixed(1))))}>＋</button>
              <button onClick={() => setFloorZoom(1)}>↺</button>
            </div>
            <button className={`outline-button compact ${snapToGrid ? "active" : ""}`} onClick={() => setSnapToGrid((value) => !value)}>⠿ {snapToGrid ? t("Cuadrícula activa", "Grid on", "Grade ativa") : t("Cuadrícula libre", "Free movement", "Movimento livre")}</button>
            <div className="layout-history-actions" aria-label={t("Historial del plano", "Layout history", "Histórico do plano")}>
              <button disabled={!layoutUndoStack.length || saving} onClick={undoLayoutChange}>↶ {t("Deshacer", "Undo", "Desfazer")}</button>
              <button disabled={!layoutRedoStack.length || saving} onClick={redoLayoutChange}>↷ {t("Rehacer", "Redo", "Refazer")}</button>
            </div>
            {spaces.length > 1 && canEdit && <button className="delete-button" onClick={() => {
              const removed = spaces[spaces.length - 1];
              setSpaces((current) => current.slice(0, -1));
              setTables((current) => current.map((table) => table.space === removed ? { ...table, space: "Espacio 1", x: 24, y: 24 } : table));
            }}>{t("Eliminar último espacio", "Remove last space", "Remover último espaço")}</button>}
          </div>
          {layoutNotice && <p className="import-success" role="status">{layoutNotice}</p>}
          {overlappingTableIds.size > 0 && <p className="layout-overlap-warning" role="alert">⚠ {t(`${overlappingTableIds.size} mesas están superpuestas o demasiado juntas.`, `${overlappingTableIds.size} tables overlap or are too close.`, `${overlappingTableIds.size} mesas estão sobrepostas ou muito próximas.`)}</p>}
          <div className="floor-editor">
            {canEdit && <aside className="floor-elements-menu">
              <strong>{t("Elementos del salón", "Venue elements", "Elementos do salão")}</strong>
              <p>{t("Agregalos al plano y ubicalos donde quieras.", "Add them to the layout and place them anywhere.", "Adicione-os ao plano e posicione-os onde quiser.")}</p>
              {([["entrance", "Entrada"], ["dance-floor", "Pista"], ["gourmet", "Zona Gourmet"], ["hydration", "Zona Hidratación"]] as const).map(([kind, label]) => <button key={kind} draggable onDragStart={(event) => { event.dataTransfer.setData("text/new-element-kind", kind); event.dataTransfer.setData("text/new-element-label", label); }} onClick={() => void addFloorElement(kind, label)}>⠿ ＋ {label}</button>)}
              <button onClick={() => void addFloorElement("custom", t("Texto editable", "Editable text", "Texto editável"))}>＋ {t("Caja con texto", "Text box", "Caixa de texto")}</button>
            </aside>}
            <div className="floor-spaces" style={{ zoom: floorZoom }}>
          {spaces.map((space) => (
            <div className="floor-space" key={space} style={{ width: spaceSizes[space]?.width || 1200, height: spaceSizes[space]?.height || 700 }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              if (!canEdit) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const table = tables.find((item) => item.id === event.dataTransfer.getData("text/table-id"));
              if (table) { void moveTable(table, space, event.clientX - bounds.left - (table.width || 140) / 2, event.clientY - bounds.top - (table.height || 70) / 2); return; }
              const element = floorElements.find((item) => item.id === event.dataTransfer.getData("text/element-id"));
              if (element) { const next = updateFloorElement(element, { space, x: Math.max(0, event.clientX - bounds.left - element.width / 2), y: Math.max(0, event.clientY - bounds.top - element.height / 2) }); persistFloorElement(next); }
              const newElementKind = event.dataTransfer.getData("text/new-element-kind") as FloorElement["kind"];
              if (newElementKind) void addFloorElement(newElementKind, event.dataTransfer.getData("text/new-element-label") || t("Elemento", "Element", "Elemento"), { space, x: Math.max(0, event.clientX - bounds.left - 75), y: Math.max(0, event.clientY - bounds.top - 40) });
            }}>
              <div className="space-heading"><strong className="space-label">{space}</strong>{canEdit && <span><label>{t("Ancho", "Width", "Largura")}<input type="number" min="700" max="2400" value={spaceSizes[space]?.width || 1200} onChange={(event) => setSpaceSizes((current) => ({ ...current, [space]: { width: Number(event.target.value), height: current[space]?.height || 700 } }))} onBlur={(event) => void saveSpaceSize(space, Number(event.target.value), spaceSizes[space]?.height || 700)} /></label><label>{t("Alto", "Height", "Altura")}<input type="number" min="480" max="1800" value={spaceSizes[space]?.height || 700} onChange={(event) => setSpaceSizes((current) => ({ ...current, [space]: { width: current[space]?.width || 1200, height: Number(event.target.value) } }))} onBlur={(event) => void saveSpaceSize(space, spaceSizes[space]?.width || 1200, Number(event.target.value))} /></label></span>}</div>
              {tables.filter((table) => (table.space || "Espacio 1") === space).map((table) => (
                <article className={`floor-table is-${table.shape || "round"} ${table.locked ? "is-locked" : ""} ${overlappingTableIds.has(table.id) ? "has-overlap" : ""}`} key={table.id} draggable={canEdit && !table.locked} onClick={() => canEdit && openEdit(table)} onDragStart={(event) => event.dataTransfer.setData("text/table-id", table.id)} style={{ left: table.x || 24, top: table.y || 24, width: table.width || 140, height: table.height || 70 }}>
                  <div className="floor-table-shape" style={{ transform: `rotate(${table.rotation || 0}deg)` }} />
                  <strong>{table.name}</strong><small>{table.capacity} {t("lugares", "seats", "lugares")}</small>
                  {canEdit && <div className="floor-table-actions"><button onClick={(event) => { event.stopPropagation(); void updateTableLayout(table, { locked: !table.locked }); }} aria-label={table.locked ? t("Desbloquear mesa", "Unlock table", "Desbloquear mesa") : t("Bloquear mesa", "Lock table", "Bloquear mesa")}>{table.locked ? "🔒" : "🔓"}</button><button disabled={table.locked} onClick={(event) => { event.stopPropagation(); void updateTableLayout(table, { rotation: ((table.rotation || 0) + 45) % 360 }); }} aria-label={t("Girar mesa", "Rotate table", "Girar mesa")}>↻</button><button onClick={(event) => { event.stopPropagation(); void duplicateTable(table); }} aria-label={`${t("Duplicar", "Duplicate", "Duplicar")} ${table.name}`}>⧉</button><button onClick={(event) => { event.stopPropagation(); void deleteTable(table.id); }} aria-label={`${t("Eliminar", "Delete", "Excluir")} ${table.name}`}>×</button></div>}
                  {canEdit && !table.locked && <button className="resize-handle" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => resizeTable(table, event)} aria-label={t("Cambiar tamaño de mesa", "Resize table", "Redimensionar mesa")} />}
                </article>
              ))}
              {floorElements.filter((element) => element.space === space).map((element) => <article className={`floor-element is-${element.kind}`} key={element.id} draggable={canEdit} onDragStart={(event) => event.dataTransfer.setData("text/element-id", element.id)} style={{ left: element.x, top: element.y, width: element.width, height: element.height }}>
                {element.kind === "custom" && canEdit ? <input value={element.label} onChange={(event) => updateFloorElement(element, { label: event.target.value })} onBlur={(event) => persistFloorElement(updateFloorElement(element, { label: event.target.value }))} aria-label={t("Texto del elemento", "Element text", "Texto do elemento")} /> : <strong>{element.label}</strong>}
                {canEdit && <><button className="element-delete" onClick={() => void deleteFloorElement(element.id)} aria-label={`${t("Eliminar", "Delete", "Excluir")} ${element.label}`}>×</button><button className="resize-handle" onPointerDown={(event) => resizeFloorElement(element, event)} aria-label={t("Cambiar tamaño", "Resize", "Redimensionar")} /></>}
              </article>)}
            </div>
          ))}
            </div>
          </div>
        </section>
      )}

      {!layoutMode && <div className="seating-layout">
        <aside className="panel unassigned-panel">
          <div className="panel-title">
            <div>
              <h2>
                {t(
                  "Invitados confirmados",
                  "Confirmed guests",
                  "Convidados confirmados",
                )}
              </h2>
              <p>
                {t(
                  "Seleccioná un invitado y después una silla, o arrastralo",
                  "Select a guest and then a seat, or drag them",
                  "Selecione um convidado e depois um assento, ou arraste",
                )}
              </p>
              <div className="seat-category-legend">
                <span><i className="adult-dot" />{t("Adultos", "Adults", "Adultos")}</span>
                <span><i className="teen-dot" />{t("Adolescentes", "Teenagers", "Adolescentes")}</span>
                <span><i className="child-dot" />{t("Niños", "Children", "Crianças")}</span>
                <span><i className="alert-dot" />{t("Restricciones", "Restrictions", "Restrições")}</span>
              </div>
            </div>
            <span className="count-badge">{confirmedGuests.length}</span>
          </div>
          <div className="guest-assign-list">
            <label className="search seating-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado…", "Search guest…", "Buscar convidado…")} /></label>
            <div className="assignment-filters" role="group" aria-label={t("Filtrar grupos", "Filter groups", "Filtrar grupos")}>
              {([
                ["all", t("Todos", "All", "Todos"), confirmedGuests.length],
                ["unassigned", t("Sin mesa", "No table", "Sem mesa"), unassigned.length],
                ["assigned", t("Ubicados", "Seated", "Alocados"), confirmedGuests.length - unassigned.length],
              ] as const).map(([value, label, count]) => (
                <button
                  key={value}
                  className={assignmentFilter === value ? "active" : ""}
                  onClick={() => setAssignmentFilter(value)}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>
            <div className="category-filters" role="group" aria-label={t("Filtrar por categoría", "Filter by category", "Filtrar por categoria")}>
              {(["all", "adult", "teen", "child"] as const).map((value) => (
                <button key={value} className={guestCategoryFilter === value ? "active" : ""} onClick={() => setGuestCategoryFilter(value)}>
                  {value === "all" ? t("Todas", "All", "Todas") : value === "adult" ? t("Adultos", "Adults", "Adultos") : value === "teen" ? t("Adolescentes", "Teenagers", "Adolescentes") : t("Niños", "Children", "Crianças")}
                </button>
              ))}
            </div>
            {(query || assignmentFilter !== "all" || guestCategoryFilter !== "all") && <button className="clear-seating-filters" onClick={() => { setQuery(""); setAssignmentFilter("all"); setGuestCategoryFilter("all"); }}>× {t("Limpiar filtros", "Clear filters", "Limpar filtros")}</button>}
            {canEdit && (
              <div
                className={`unassign-drop-zone ${dragGuestId ? "is-active" : ""}`}
                onDragOver={(event) => { if (dragGuestId) event.preventDefault(); }}
                onDrop={(event) => {
                  event.preventDefault();
                  const guestId = event.dataTransfer.getData("text/guest-id");
                  if (guestId) void unassignGuest(guestId);
                }}
              >
                ↙ {t("Soltá aquí para dejar sin mesa", "Drop here to remove from table", "Solte aqui para remover da mesa")}
              </div>
            )}
            {confirmedGuests.filter((guest) => {
              const matchesQuery = `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase());
              const isAssigned = assignedIds.includes(guest.id);
              const matchesCategory = guestCategoryFilter === "all" || (guest.guestType || "adult") === guestCategoryFilter;
              return matchesQuery && matchesCategory && (assignmentFilter === "all" || (assignmentFilter === "assigned" ? isAssigned : !isAssigned));
            }).map((guest) => {
              const currentTable = tables.find((table) =>
                table.guests.includes(guest.id),
              );
              return (
                <div
                  key={guest.id}
                  className={`${currentTable ? "guest-assigned" : ""} ${dragGuestId === guest.id ? "is-dragging" : ""} ${selectedGuestId === guest.id ? "is-selected" : ""}`}
                  draggable={canEdit}
                  onClick={(event) => {
                    if (!canEdit || (event.target as HTMLElement).closest("button, select")) return;
                    selectGuestForSeat(guest.id);
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/guest-id", guest.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDragGuestId(guest.id);
                  }}
                  onDragEnd={() => setDragGuestId("")}
                >
                  <GuestAvatar guest={guest} />
                  <p>
                    <GuestNameButton guest={guest} />
                    <small>
                      {confirmedPeopleForGuest(guest, guests)}{" "}
                      {confirmedPeopleForGuest(guest, guests) === 1
                        ? t("persona", "person", "pessoa")
                        : t("personas", "people", "pessoas")}{" "}
                      · {guest.group}
                    </small>
                  </p>
                  <select
                    value={currentTable?.id ?? ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      event.target.value
                        ? assignGuest(guest.id, event.target.value)
                        : unassignGuest(guest.id)
                    }
                    aria-label={`${t("Mesa de", "Table for", "Mesa de")} ${guest.name}`}
                  >
                    <option value="">
                      {t("Sin mesa", "No table", "Sem mesa")}
                    </option>
                    {tables.map((table) => {
                      const occupied = table.guests.reduce(
                        (total, id) =>
                          total +
                          (() => { const assigned = guests.find((item) => item.id === id); return assigned ? confirmedPeopleForGuest(assigned, guests) : 0; })(),
                        0,
                      );
                      const available = table.capacity - occupied;
                      const lacksSpace =
                        table.id !== currentTable?.id &&
                        available < confirmedPeopleForGuest(guest, guests);
                      return (
                        <option
                          key={table.id}
                          value={table.id}
                          disabled={lacksSpace}
                        >
                          {table.name}
                          {lacksSpace
                            ? ` · ${t("faltan", "needs", "faltam")} ${confirmedPeopleForGuest(guest, guests) - available} ${t("lugares", "seats", "lugares")}`
                            : ` · ${available} ${t("libres", "free", "livres")}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="tables-workspace">
          {canEdit && (
            <div className="table-shape-tools" aria-label={t("Añadir mesas", "Add tables", "Adicionar mesas")}>
              <strong>{t("Añadir mesa", "Add table", "Adicionar mesa")}</strong>
              <button onClick={() => openNew("round")}><i className="shape-icon is-round" />{t("Redonda", "Round", "Redonda")}</button>
              <button onClick={() => openNew("rectangular")}><i className="shape-icon is-rectangular" />{t("Rectangular", "Rectangular", "Retangular")}</button>
              <button onClick={() => openNew("square")}><i className="shape-icon is-square" />{t("Cuadrada", "Square", "Quadrada")}</button>
            </div>
          )}
          <div className="workspace-heading">
            <div>
              <h2>{t("Plano de mesas", "Table layout", "Plano de mesas")}</h2>
              <p>
                {t(
                  "La capacidad se calcula según las personas confirmadas de cada grupo.",
                  "Capacity is calculated from confirmed people in each group.",
                  "A capacidade é calculada pelas pessoas confirmadas de cada grupo.",
                )}
              </p>
            </div>
            <div className="workspace-actions">
              <label className="table-search"><span>⌕</span><input value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} placeholder={t("Buscar mesa o invitado…", "Search table or guest…", "Buscar mesa ou convidado…")} /></label>
              <div className="table-navigation" aria-label={t("Recorrer mesas", "Browse tables", "Navegar mesas")}>
                <button onClick={() => focusTable(-1)} disabled={!visibleTables.length} aria-label={t("Mesa anterior", "Previous table", "Mesa anterior")}>←</button>
                <span>{visibleTables.length} {t("mesas", "tables", "mesas")}</span>
                <button onClick={() => focusTable(1)} disabled={!visibleTables.length} aria-label={t("Mesa siguiente", "Next table", "Próxima mesa")}>→</button>
              </div>
              <button className={`outline-button compact view-density-toggle ${compactTables ? "active" : ""}`} onClick={() => setCompactTables((current) => !current)}>{compactTables ? t("Vista detallada", "Detailed view", "Vista detalhada") : t("Vista compacta", "Compact view", "Vista compacta")}</button>
              {lastAssignment && (
                <button className="outline-button compact" onClick={undoLastAssignment}>
                  ↶ {t("Deshacer movimiento", "Undo move", "Desfazer movimento")}
                </button>
              )}
              <span className={`assignment-save-status is-${assignmentStatus}`} role="status">
                {assignmentStatus === "saving" ? t("Guardando…", "Saving…", "Salvando…") : assignmentStatus === "saved" ? `✓ ${t("Guardado", "Saved", "Salvo")}` : assignmentStatus === "error" ? t("No se guardó", "Not saved", "Não foi salvo") : t("Actualización automática", "Automatic updates", "Atualização automática")}
              </span>
            </div>
          </div>
          {selectedGuestId && <div className="seat-selection-banner"><strong>{guests.find((guest) => guest.id === selectedGuestId)?.name}</strong><span>{t("Ahora elegí una silla libre", "Now choose a free seat", "Agora escolha um assento livre")}</span><button onClick={() => setSelectedGuestId("")}>{t("Cancelar", "Cancel", "Cancelar")}</button></div>}
          {tableQuery && <div className="active-table-filter"><span>{t("Resultados para", "Results for", "Resultados para")} “{tableQuery}”</span><button onClick={() => setTableQuery("")}>× {t("Limpiar", "Clear", "Limpar")}</button></div>}
          <div className={`tables-grid ${compactTables ? "is-compact" : ""}`}>
            {!visibleTables.length && <div className="tables-empty-state"><strong>{t("No encontramos mesas", "No tables found", "Nenhuma mesa encontrada")}</strong><span>{t("Probá con otro nombre de mesa o invitado.", "Try another table or guest name.", "Tente outro nome de mesa ou convidado.")}</span><button onClick={() => setTableQuery("")}>{t("Ver todas las mesas", "View all tables", "Ver todas as mesas")}</button></div>}
            {visibleTables.map((table) => {
              const index = tables.findIndex((item) => item.id === table.id);
              const tableGuests = table.guests
                .map((id) => guests.find((guest) => guest.id === id))
                .filter(Boolean) as Guest[];
              const occupied = tableGuests.reduce(
                (total, guest) => total + confirmedPeopleForGuest(guest, guests),
                0,
              );
              const remaining = table.capacity - occupied;
              const full = remaining === 0;
              const over = remaining < 0;
              const menuSummary = new Map<string, number>();
              tableGuests.forEach((guest) => {
                if (!meaningfulGuestValue(guest.menuChoice)) return;
                menuSummary.set(
                  guest.menuChoice,
                  (menuSummary.get(guest.menuChoice) || 0) +
                    confirmedPeopleForGuest(guest, guests),
                );
              });
              const dietaryAlerts = tableGuests.flatMap((guest) => [
                ...(meaningfulGuestValue(guest.food)
                  ? [{ id: guest.id, name: guest.name, food: guest.food }]
                  : []),
                ...guest.companions
                  .filter((companion) => meaningfulGuestValue(companion.food))
                  .map((companion, companionIndex) => ({
                    id: `${guest.id}-${companionIndex}`,
                    name: companion.name || `${t("Acompañante de", "Companion of", "Acompanhante de")} ${guest.name}`,
                    food: companion.food,
                  })),
              ]);
              const accessibilityAlerts = tableGuests.filter((guest) =>
                meaningfulGuestValue(guest.accessibilityNeeds),
              );
              const tableSocialConflicts = socialConflicts.filter((conflict) => conflict.tableId === table.id);
              const draggedGuest = guests.find((guest) => guest.id === dragGuestId);
              const draggedPeople = draggedGuest
                ? confirmedPeopleForGuest(draggedGuest, guests)
                : 0;
              const alreadyHere = Boolean(
                dragGuestId && table.guests.includes(dragGuestId),
              );
              const canDrop = alreadyHere || remaining >= draggedPeople;
              const seatGuests: Array<{ guest: Guest; label: string; personName: string } | undefined> = Array(table.capacity).fill(undefined);
              const effectiveSeatByGuest = new Map<string, number>();
              const placeGuest = (guest: Guest, preferredSeat = 0) => {
                const people = confirmedPeopleForGuest(guest, guests);
                const members = [guest.name, ...guest.companions.map((companion) => companion.name).filter(Boolean)];
                const fitsAt = (start: number) => start >= 0 && start + people <= table.capacity && Array.from({ length: people }, (_, index) => !seatGuests[start + index]).every(Boolean);
                let start = preferredSeat > 0 && fitsAt(preferredSeat - 1) ? preferredSeat - 1 : -1;
                if (start < 0) start = Array.from({ length: table.capacity }, (_, index) => index).find(fitsAt) ?? -1;
                if (start < 0) return;
                effectiveSeatByGuest.set(guest.id, start + 1);
                Array.from({ length: people }, (_, personIndex) => {
                  const personName = members[personIndex] || `${t("Acompañante de", "Companion of", "Acompanhante de")} ${guest.name}`;
                  seatGuests[start + personIndex] = { guest, personName, label: initials(personName) };
                });
              };
              tableGuests
                .filter((guest) => table.seatAssignments?.[guest.id])
                .forEach((guest) => placeGuest(guest, table.seatAssignments[guest.id]));
              tableGuests
                .filter((guest) => !table.seatAssignments?.[guest.id])
                .forEach((guest) => placeGuest(guest));
              return (
                <article
                  id={`table-card-${table.id}`}
                  className={`table-card ${over ? "table-over" : full ? "table-full" : ""} ${dragGuestId ? (canDrop ? "drop-compatible" : "drop-blocked") : ""} ${selectedGuestId && table.guests.includes(selectedGuestId) ? "has-selected-guest" : ""} ${assignmentSavingId && table.guests.includes(assignmentSavingId) ? "is-saving" : ""}`}
                  key={table.id}
                  onDragOver={(event) => {
                    if (canEdit && dragGuestId && canDrop) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const guestId = event.dataTransfer.getData("text/guest-id");
                    if (canEdit && guestId && canDrop) void assignGuest(guestId, table.id);
                  }}
                  aria-label={
                    dragGuestId && !canDrop
                      ? `${table.name}: ${t("sin capacidad suficiente", "not enough capacity", "sem capacidade suficiente")}`
                      : undefined
                  }
                >
                  <div className="table-card-top">
                    <span className="table-number">{index + 1}</span>
                    <div>
                      <h3>{table.name}</h3>
                      <p>
                        {table.note ||
                          t("Sin observaciones", "No notes", "Sem observações")}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openEdit(table)}
                        aria-label={`Editar ${table.name}`}
                      >
                        •••
                      </button>
                    )}
                  </div>
                  <div className="capacity-row">
                    <span>
                      {occupied} {t("de", "of", "de")} {table.capacity}{" "}
                      {t("lugares", "seats", "lugares")}
                    </span>
                    <strong>
                      {over
                        ? `${Math.abs(remaining)} ${t("de más", "over", "a mais")}`
                        : full
                          ? t("Completa", "Full", "Completa")
                          : `${remaining} ${t("libres", "free", "livres")}`}
                    </strong>
                  </div>
                  <div className="capacity-bar">
                    <i
                      style={{
                        width: `${Math.min(100, (occupied / table.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                  {tableSocialConflicts.length > 0 && <div className="table-social-conflicts" aria-label={t("Conflictos sociales", "Social conflicts", "Conflitos sociais")}>{tableSocialConflicts.map((conflict) => <span key={conflict.id}>⚠ {conflict.message}</span>)}</div>}
                  <div className={`table-seat-map is-${table.shape || "round"}`}>
                    <div className="table-surface"><strong>{table.name}</strong></div>
                    {Array.from({ length: table.capacity }, (_, seatIndex) => {
                      const person = seatGuests[seatIndex];
                      const angle = (Math.PI * 2 * seatIndex) / table.capacity - Math.PI / 2;
                      const radiusX = table.shape === "rectangular" ? 43 : table.shape === "square" ? 37 : 42;
                      const radiusY = table.shape === "rectangular" ? 34 : table.shape === "square" ? 39 : 42;
                      return (
                        <span
                          className={`seat-marker ${person ? "is-occupied" : ""} ${person?.guest.guestType === "teen" ? "is-teen" : ""} ${person?.guest.guestType === "child" ? "is-child" : ""} ${person?.guest.id === selectedGuestId ? "is-selected" : ""} ${selectedGuestId && (!person || person.guest.id === selectedGuestId) ? "is-click-target" : ""} ${person && guestHasRestriction(person.guest) ? "has-alert" : ""}`}
                          key={seatIndex}
                          style={{ left: `${50 + Math.cos(angle) * radiusX}%`, top: `${50 + Math.sin(angle) * radiusY}%` }}
                          title={person ? `${person.personName}${meaningfulGuestValue(person.guest.food) ? ` · ${person.guest.food}` : ""}${person.guest.socialTogetherWith ? ` · ${t("Junto a", "Together with", "Junto a")} ${person.guest.socialTogetherWith}` : ""}${person.guest.socialSeparateFrom ? ` · ${t("Separado de", "Separate from", "Separado de")} ${person.guest.socialSeparateFrom}` : ""}${person.guest.preferredTableName ? ` · ${t("Mesa preferida", "Preferred table", "Mesa preferida")}: ${person.guest.preferredTableName}` : ""}` : `${t("Asiento", "Seat", "Assento")} ${seatIndex + 1}`}
                          draggable={Boolean(canEdit && person)}
                          onDragStart={(event) => {
                            if (!person) return;
                            event.stopPropagation();
                            event.dataTransfer.setData("text/guest-id", person.guest.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDragGuestId(person.guest.id);
                          }}
                          onDragEnd={() => setDragGuestId("")}
                          onDragOver={(event) => {
                            if (canEdit && dragGuestId && (!person || person.guest.id === dragGuestId)) event.preventDefault();
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const guestId = event.dataTransfer.getData("text/guest-id");
                            if (canEdit && guestId && (!person || person.guest.id === guestId)) void assignGuest(guestId, table.id, true, seatIndex + 1);
                          }}
                          onClick={() => {
                            if (canEdit && !assignmentSavingId && selectedGuestId && (!person || person.guest.id === selectedGuestId)) void assignGuest(selectedGuestId, table.id, true, seatIndex + 1);
                          }}
                        ><b className="seat-number">{seatIndex + 1}</b><em>{person?.label || "♧"}</em></span>
                      );
                    })}
                  </div>
                  {(menuSummary.size > 0 || dietaryAlerts.length > 0 || accessibilityAlerts.length > 0) && (
                    <div className="table-operations" aria-label={t("Datos operativos", "Operational details", "Dados operacionais")}>
                      {[...menuSummary].map(([menu, count]) => (
                        <span key={menu} title={menu}>🍽 {count}× {menu}</span>
                      ))}
                      {dietaryAlerts.map((alert) => (
                        <span className="is-alert" key={`food-${alert.id}`} title={`${alert.name}: ${alert.food}`}>⚠ {alert.name}: {alert.food}</span>
                      ))}
                      {accessibilityAlerts.map((guest) => (
                        <span className="is-accessibility" key={`access-${guest.id}`} title={`${guest.name}: ${guest.accessibilityNeeds}`}>♿ {guest.name}: {guest.accessibilityNeeds}</span>
                      ))}
                    </div>
                  )}
                  <div className="seated-guests">
                    {tableGuests.map((guest) => {
                      const people = confirmedPeopleForGuest(guest, guests);
                      const assignedSeat = effectiveSeatByGuest.get(guest.id) || 1;
                      const availableStarts = Array.from({ length: table.capacity }, (_, seatIndex) => seatIndex + 1).filter((start) =>
                        start + people - 1 <= table.capacity &&
                        Array.from({ length: people }, (_, offset) => seatGuests[start - 1 + offset]).every(
                          (slot) => !slot || slot.guest.id === guest.id,
                        ),
                      );
                      return <div key={guest.id}>
                        <GuestNameButton guest={guest} />
                        <small>
                          {people} {t("lugares", "seats", "lugares")}
                        </small>
                        {canEdit && (
                          <select
                            className="seat-position-select"
                            value={assignedSeat}
                            disabled={Boolean(assignmentSavingId)}
                            onChange={(event) => void assignGuest(guest.id, table.id, true, Number(event.target.value))}
                            aria-label={`${t("Asiento inicial de", "Starting seat for", "Assento inicial de")} ${guest.name}`}
                            title={t("Elegir asiento inicial", "Choose starting seat", "Escolher assento inicial")}
                          >
                            {availableStarts.map((seat) => <option key={seat} value={seat}>{t("Asiento", "Seat", "Assento")} {seat}</option>)}
                          </select>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => unassignGuest(guest.id)}
                            aria-label={`${t("Quitar a", "Remove", "Remover")} ${guest.name}`}
                          >
                            ×
                          </button>
                        )}
                      </div>;
                    })}
                    {!tableGuests.length &&
                      (canEdit ? (
                        <button
                          className="empty-table"
                          onClick={() =>
                            document
                              .querySelector<HTMLSelectElement>(
                                ".guest-assign-list select",
                              )
                              ?.focus()
                          }
                        >
                          ＋{" "}
                          {t(
                            "Asignar invitados",
                            "Assign guests",
                            "Atribuir convidados",
                          )}
                        </button>
                      ) : (
                        <span className="empty-table">
                          {t(
                            "Sin invitados asignados",
                            "No assigned guests",
                            "Sem convidados atribuídos",
                          )}
                        </span>
                      ))}
                  </div>
                  {over && (
                    <div className="capacity-alert">
                      {t(
                        "La mesa supera la capacidad configurada.",
                        "This table exceeds its configured capacity.",
                        "A mesa excede a capacidade configurada.",
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            {canEdit && (
              <button className="add-table-card" onClick={() => openNew()}>
                <span>＋</span>
                <strong>
                  {t(
                    "Agregar otra mesa",
                    "Add another table",
                    "Adicionar outra mesa",
                  )}
                </strong>
                <small>
                  {t(
                    "Definí nombre y capacidad",
                    "Set its name and capacity",
                    "Defina nome e capacidade",
                  )}
                </small>
              </button>
            )}
          </div>
        </section>
      </div>}

      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <div
            className="modal table-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShowModal(false)}>
              ×
            </button>
            <span className="eyebrow">
              {editing
                ? t("Configuración", "Settings", "Configuração")
                : t("Nueva mesa", "New table", "Nova mesa")}
            </span>
            <h2>
              {editing
                ? t("Editar mesa", "Edit table", "Editar mesa")
                : t("Agregar mesa", "Add table", "Adicionar mesa")}
            </h2>
            <div className="form-grid">
              <label>
                {t("Nombre o número", "Name or number", "Nome ou número")}
                <input
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                  placeholder={t(
                    "Ej. Mesa Familia",
                    "E.g. Family table",
                    "Ex. Mesa Família",
                  )}
                />
              </label>
              <label>
                {t(
                  "Cantidad de personas",
                  "Number of people",
                  "Quantidade de pessoas",
                )}
                <input
                  type="number"
                  min={
                    editing
                      ? editing.guests.reduce(
                          (total, id) =>
                            total +
                            (guests.find((guest) => guest.id === id)
                              ? confirmedPeopleForGuest(guests.find((guest) => guest.id === id)!, guests) : 0),
                          0,
                        ) || 1
                      : 1
                  }
                  max="30"
                  value={capacity}
                  onChange={(event) =>
                    setCapacity(Math.max(1, Number(event.target.value)))
                  }
                />
              </label>
            </div>
            <fieldset className="table-shape-picker">
              <legend>{t("Forma de la mesa", "Table shape", "Formato da mesa")}</legend>
              {(["round", "rectangular", "square"] as const).map((shape) => (
                <button type="button" key={shape} className={tableShape === shape ? "active" : ""} onClick={() => setTableShape(shape)}>
                  <i className={`shape-icon is-${shape}`} />
                  {shape === "round" ? t("Redonda", "Round", "Redonda") : shape === "rectangular" ? t("Rectangular", "Rectangular", "Retangular") : t("Cuadrada", "Square", "Quadrada")}
                </button>
              ))}
            </fieldset>
            <label className="modal-note">
              {t(
                "Ubicación u observaciones",
                "Location or notes",
                "Localização ou observações",
              )}
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t(
                  "Ej. Cerca de la pista",
                  "E.g. Near the dance floor",
                  "Ex. Perto da pista",
                )}
              />
            </label>
            <div className="modal-actions table-modal-actions">
              {editing && (
                <button
                  className="delete-button"
                  disabled={saving}
                  onClick={() => deleteTable(editing.id)}
                >
                  {t("Eliminar mesa", "Delete table", "Excluir mesa")}
                </button>
              )}
              <span />
              <button
                className="outline-button"
                onClick={() => setShowModal(false)}
              >
                {t("Cancelar", "Cancel", "Cancelar")}
              </button>
              <button
                className="primary-button small"
                disabled={saving}
                onClick={saveTable}
              >
                {saving
                  ? t("Guardando…", "Saving…", "Salvando…")
                  : editing
                    ? t("Guardar cambios", "Save changes", "Salvar alterações")
                    : t("Crear mesa", "Create table", "Criar mesa")}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

function SimpleModule({
  view,
  guests,
  setGuests,
  order,
  canEdit,
  onOrderChange,
}: {
  view: string;
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  order: AdminOrder;
  canEdit: boolean;
  onOrderChange: (order: AdminOrder) => void;
}) {
  const { text: t, locale, language } = useAdminI18n();
  const [remindingId, setRemindingId] = useState("");
  const [moduleError, setModuleError] = useState("");
  const [query, setQuery] = useState("");
  const [reminderMessage, setReminderMessage] = useState(
    "Te recordamos que se acerca nuestro evento. Si ya confirmaste, ¡muchas gracias! Si todavía no, nos encantaría recibir tu respuesta.",
  );
  const [giftText, setGiftText] = useState(order.giftDetails);
  const [confirmationTarget, setConfirmationTarget] = useState<"invitation" | "rsvp" | "custom">("invitation");
  const [invitationLink, setInvitationLink] = useState(order.invitationUrl);
  const [savingInvitation, setSavingInvitation] = useState(false);
  const [customConfirmationUrl, setCustomConfirmationUrl] = useState("");
  const restrictions = guests.flatMap((guest) => [
    ...(guest.food !== "—" && guest.food !== "Ninguna" ? [guest] : []),
    ...guest.companions
      .map((companion, index) => ({
        ...guest,
        id: `${guest.id}-companion-${index}`,
        name: companion.name,
        food: companion.food || "Ninguna",
        confirmed: 1,
      }))
      .filter((companion) => companion.food !== "Ninguna"),
  ]);
  const songs = guests.filter((g) => g.song !== "—");
  const pending = guests.filter((g) => g.status === "Pendiente");
  const reminded = pending.filter((g) => g.reminded !== "—");
  const previewGuest = pending[0];
  const previewBaseUrl = confirmationTarget === "invitation" && invitationLink
    ? invitationLink
    : confirmationTarget === "custom" && customConfirmationUrl
      ? customConfirmationUrl
      : `${window.location.origin}/confirmar`;
  const previewSeparator = previewBaseUrl.includes("?") ? "&" : "?";
  const previewConfirmationUrl = confirmationTarget === "custom"
    ? previewBaseUrl
    : `${previewBaseUrl}${previewSeparator}token=${previewGuest?.inviteToken || "enlace-personal"}`;
  const reminderPreview = `Hola ${previewGuest?.name || t("María", "Mary", "Maria")}.\n\n${reminderMessage}\n\n${t("Confirmar asistencia", "Confirm attendance", "Confirmar presença")}: ${previewConfirmationUrl}`;

  const saveInvitationLink = async () => {
    if (!invitationLink.trim() || invitationLink === order.invitationUrl) return;
    setSavingInvitation(true);
    setModuleError("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invitation-url", invitationUrl: invitationLink }) });
      const result = await response.json() as { invitationUrl?: string; error?: string };
      if (!response.ok || !result.invitationUrl) throw new Error(result.error || "No pudimos asociar la invitación.");
      setInvitationLink(result.invitationUrl);
      onOrderChange({ ...order, invitationUrl: result.invitationUrl });
    } catch (saveError) { setModuleError(saveError instanceof Error ? saveError.message : "No pudimos asociar la invitación."); }
    finally { setSavingInvitation(false); }
  };
  const content = {
    Restricciones: {
      eyebrow: "",
      title: "",
      description: "",
      stats: [
        [
          t("Registradas", "Recorded", "Registradas"),
          String(restrictions.length),
        ],
        [
          t("Personas", "People", "Pessoas"),
          String(
            restrictions.reduce(
              (total, guest) => total + (guest.confirmed || 1),
              0,
            ),
          ),
        ],
        [
          t("Pendientes", "Pending", "Pendentes"),
          String(
            restrictions.filter((guest) => guest.status === "Pendiente").length,
          ),
        ],
      ],
      rows: restrictions,
      headers: [
        t("Invitado", "Guest", "Convidado"),
        t("Grupo", "Group", "Grupo"),
        t("Restricción", "Dietary need", "Restrição"),
        t("Personas", "People", "Pessoas"),
      ],
    },
    Canciones: {
      eyebrow: "",
      title: "",
      description: "",
      stats: [
        [t("Sugeridas", "Suggested", "Sugeridas"), String(songs.length)],
        [
          t("Con respuesta", "With response", "Com resposta"),
          String(songs.filter((guest) => guest.status !== "Pendiente").length),
        ],
        [
          t("Pendientes", "Pending", "Pendentes"),
          String(songs.filter((guest) => guest.status === "Pendiente").length),
        ],
      ],
      rows: songs,
      headers: [
        t("Invitado", "Guest", "Convidado"),
        t("Canción", "Song", "Música"),
        t("Estado", "Status", "Status"),
      ],
    },
    Recordatorios: {
      eyebrow: "",
      title: "",
      description: "",
      stats: [
        [t("Pendientes", "Pending", "Pendentes"), String(pending.length)],
        [t("Recordados", "Reminded", "Lembrados"), String(reminded.length)],
        [
          t("Sin contactar", "Not contacted", "Sem contato"),
          String(pending.length - reminded.length),
        ],
      ],
      rows: pending.filter((guest) => `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase())),
      headers: [
        t("Invitado", "Guest", "Convidado"),
        "WhatsApp",
        t("Estado", "Status", "Status"),
        t("Último recordatorio", "Last reminder", "Último lembrete"),
        t("Acción", "Action", "Ação"),
      ],
    },
    Accesos: {
      eyebrow: "Seguridad del evento",
      title: "Administradores",
      description: "Gestioná quién puede acceder al panel.",
      stats: [
        ["Activos", "1"],
        ["Invitados", "0"],
        ["Sesiones", "1"],
      ],
      rows: [],
      headers: ["Administrador", "Contacto", "Rol", "Estado"],
    },
  }[view]!;

  const exportModule = () => {
    if (view === "Restricciones") {
      exportCsv(
        `restricciones-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Invitado", "Grupo", "Restricción", "Personas confirmadas", "Estado"],
        restrictions.map((guest) => [
          guest.name,
          guest.group,
          guest.food,
          guest.confirmed,
          guest.status,
        ]),
      );
    }
    if (view === "Canciones") {
      exportCsv(
        `canciones-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Invitado", "Grupo", "Canción sugerida", "Estado"],
        songs.map((guest) => [
          guest.name,
          guest.group,
          guest.song,
          guest.status,
        ]),
      );
    }
  };

  const reminderDate = (value: string) =>
    value === "—"
      ? value
      : new Intl.DateTimeFormat(locale, {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(value));
  const whatsappStatus = (value = "") =>
    (
      ({
        accepted: [adminStatus(language, "accepted"), "pending"],
        sent: [adminStatus(language, "sent"), "sent"],
        delivered: [adminStatus(language, "delivered"), "delivered"],
        read: [adminStatus(language, "read"), "read"],
        failed: [adminStatus(language, "failed"), "failed"],
      }) as Record<string, [string, string]>
    )[value] || [t("Sin envío", "Not sent", "Não enviado"), "empty"];

  const remindGuest = async (guest: Guest) => {
    setRemindingId(guest.id);
    setModuleError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, action: "remind", message: reminderMessage, giftText, confirmationTarget, customConfirmationUrl, invitationUrlOverride: invitationLink }),
      });
      const result = (await response.json()) as {
        guest?: Guest;
        mode?: "business" | "manual";
        url?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "No pudimos enviar el recordatorio.");
      if (result.mode === "manual" && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        if (result.guest)
          setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
        return;
      }
      if (!result.guest)
        throw new Error("No pudimos registrar el recordatorio.");
      setGuests((current) =>
        current.map((item) => (item.id === guest.id ? result.guest! : item)),
      );
    } catch (error) {
      setModuleError(
        error instanceof Error
          ? error.message
          : "No pudimos registrar el recordatorio.",
      );
    } finally {
      setRemindingId("");
    }
  };

  const emailReminder = async (guest: Guest) => {
    setRemindingId(guest.id);
    setModuleError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guest.id,
          action: "remind-email",
          template: "message",
          message: reminderMessage,
          giftText,
          confirmationTarget,
          customConfirmationUrl,
          invitationUrlOverride: invitationLink,
        }),
      });
      const result = (await response.json()) as {
        guest?: Guest;
        error?: string;
      };
      if (!response.ok || !result.guest)
        throw new Error(
          result.error || "No pudimos enviar el recordatorio por email.",
        );
      setGuests((current) =>
        current.map((item) => (item.id === guest.id ? result.guest! : item)),
      );
    } catch (error) {
      setModuleError(
        error instanceof Error
          ? error.message
          : "No pudimos enviar el recordatorio por email.",
      );
    } finally {
      setRemindingId("");
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {view === "Recordatorios"
              ? t("Seguimiento RSVP", "RSVP follow-up", "Acompanhamento RSVP")
              : view === "Restricciones"
                ? t(
                    "Información para catering",
                    "Catering information",
                    "Informações para o buffet",
                  )
                : t(
                    "Playlist colaborativa",
                    "Collaborative playlist",
                    "Playlist colaborativa",
                  )}
          </span>
          <h1>
            {view === "Recordatorios"
              ? t("Recordatorios", "Reminders", "Lembretes")
              : view === "Restricciones"
                ? t(
                    "Restricciones alimentarias",
                    "Dietary requirements",
                    "Restrições alimentares",
                  )
                : t(
                    "Canciones sugeridas",
                    "Suggested songs",
                    "Músicas sugeridas",
                  )}
          </h1>
          <p>
            {view === "Recordatorios"
              ? t(
                  "Contactá a quienes todavía no respondieron.",
                  "Contact guests who have not replied yet.",
                  "Entre em contato com quem ainda não respondeu.",
                )
              : view === "Restricciones"
                ? t(
                    "Organizá los requerimientos de tus invitados.",
                    "Organize your guests' requirements.",
                    "Organize as necessidades dos convidados.",
                  )
                : t(
                    "Revisá y organizá las canciones enviadas.",
                    "Review and organize submitted songs.",
                    "Revise e organize as músicas enviadas.",
                  )}
          </p>
        </div>
        {view !== "Recordatorios" && (
          <button className="primary-button small" onClick={exportModule}>
            ＋ {t("Exportar CSV", "Export CSV", "Exportar CSV")}
          </button>
        )}
      </div>
      {view === "Recordatorios" && canEdit && (
        <section className="panel reminder-composer">
          <div className="panel-title">
            <div>
              <h2>
                {t(
                  "Contenido del recordatorio",
                  "Reminder content",
                  "Conteúdo do lembrete",
                )}
              </h2>
              <p>{t("Configurá el contenido y el enlace que recibirá cada invitado.", "Set the content and link each guest will receive.", "Configure o conteúdo e o link que cada convidado receberá.")}</p>
            </div>
          </div>
          <div className="reminder-form message-composer-body">
            <label>{t("Contenido del recordatorio", "Reminder content", "Conteúdo do lembrete")}<textarea className="compact-message-textarea" value={reminderMessage} onChange={(event) => setReminderMessage(event.target.value)} rows={3} /></label>
            <label>{t("Destino para confirmar asistencia", "Attendance confirmation destination", "Destino para confirmar presença")}<select value={confirmationTarget} onChange={(event) => setConfirmationTarget(event.target.value as "invitation" | "rsvp" | "custom")}>
              <option value="invitation">{t("Invitación del evento", "Event invitation", "Convite do evento")}</option>
              <option value="rsvp">{t("Pantalla de confirmación", "Confirmation screen", "Tela de confirmação")}</option>
              <option value="custom">{t("Otro formulario o pantalla", "Another form or page", "Outro formulário ou tela")}</option>
            </select></label>
            {confirmationTarget === "invitation" && <label>{t("Enlace de la invitación", "Invitation link", "Link do convite")}<div className="inline-save-field"><input type="url" value={invitationLink} onChange={(event) => setInvitationLink(event.target.value)} placeholder="https://www.saveyourdate.site/..." /><button type="button" className="outline-button compact" disabled={savingInvitation || !invitationLink.trim()} onClick={() => void saveInvitationLink()}>{savingInvitation ? t("Guardando…", "Saving…", "Salvando…") : t("Asociar", "Link", "Associar")}</button></div></label>}
            {confirmationTarget === "custom" && <label>{t("Enlace alternativo", "Alternative link", "Link alternativo")}<input type="url" value={customConfirmationUrl} onChange={(event) => setCustomConfirmationUrl(event.target.value)} placeholder="https://" /></label>}
            <label>{t("Datos de la cuenta", "Account details", "Dados da conta")}<textarea value={giftText} onChange={(event) => setGiftText(event.target.value)} rows={3} placeholder={t("Agregá aquí los datos bancarios si querés incluirlos", "Add bank details here if you want to include them", "Adicione os dados bancários aqui se quiser incluí-los")} /></label>
            <div className="message-preview"><span>{t("Así quedará el mensaje final", "Final message preview", "Assim ficará a mensagem final")}</span><p>{reminderPreview}</p>{giftText && <p><strong>{t("Datos para regalos", "Gift details", "Dados para presentes")}</strong><br />{giftText}</p>}</div>
          </div>
        </section>
      )}
      <section className="metrics-grid mini">
        {content.stats.map(([label, value], index) => (
          <Metric
            key={label}
            label={label}
            value={value}
            note={t("registros", "records", "registros")}
            tone={["blue", "green", "amber"][index]}
          />
        ))}
      </section>
      <section className="panel table-panel">
        <div className="table-tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado o grupo…", "Search guest or group…", "Buscar convidado ou grupo…")} /></label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {content.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((guest, index) => (
                <tr key={guest.id}>
                  <td>
                    <div className="person">
                      <GuestAvatar guest={guest} />
                      <p>
                        {view === "Accesos" ? (
                          <strong>{index === 0 ? "Ana Pereira" : index === 1 ? "Martín Costa" : "Sofía Ramos"}</strong>
                        ) : (
                          <GuestNameButton guest={guest} />
                        )}
                        <small>{guest.group}</small>
                      </p>
                    </div>
                  </td>
                  {view === "Restricciones" && (
                    <>
                      <td>{guest.group}</td>
                      <td>
                        <span className="status status-pendiente">
                          {guest.food}
                        </span>
                      </td>
                      <td>{guest.confirmed || 1}</td>
                    </>
                  )}
                  {view === "Canciones" && (
                    <>
                      <td>{guest.song}</td>
                      <td>
                        <span className="status status-confirmado">
                          {t("Registrada", "Recorded", "Registrada")}
                        </span>
                      </td>
                    </>
                  )}
                  {view === "Recordatorios" && (
                    <>
                      <td>
                        {guest.phone ||
                          t("Sin número", "No number", "Sem número")}
                        <small className="cell-sub">
                          {guest.email ||
                            t("Sin email", "No email", "Sem email")}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`delivery-status is-${whatsappStatus(guest.whatsappStatus)[1]}`}
                        >
                          <i aria-hidden="true" />
                          {whatsappStatus(guest.whatsappStatus)[0]}
                        </span>
                      </td>
                      <td>{reminderDate(guest.reminded)}</td>
                      <td>
                        {canEdit ? (
                          <div className="reminder-actions">
                            <button
                              className="whatsapp-button"
                              disabled={
                                remindingId === guest.id || !guest.phone
                              }
                              onClick={() => remindGuest(guest)}
                            >
                              WhatsApp
                            </button>
                            <button
                              className="outline-button compact"
                              disabled={
                                remindingId === guest.id || !guest.email
                              }
                              onClick={() => emailReminder(guest)}
                            >
                              {remindingId === guest.id
                                ? t("Enviando…", "Sending…", "Enviando…")
                                : t("Enviar por email", "Send by email", "Enviar por email")}
                            </button>
                          </div>
                        ) : (
                          <span className="muted">
                            {t("Solo lectura", "View only", "Somente leitura")}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  {view === "Accesos" && (
                    <>
                      <td>
                        {index === 0
                          ? "ana@ejemplo.com"
                          : index === 1
                            ? "martin@ejemplo.com"
                            : "sofia@ejemplo.com"}
                      </td>
                      <td>
                        {index === 0
                          ? "Propietaria"
                          : index === 1
                            ? "Colaborador"
                            : "Solo lectura"}
                      </td>
                      <td>
                        <span
                          className={`status ${index < 2 ? "status-confirmado" : "status-pendiente"}`}
                        >
                          {index < 2 ? "Activo" : "Invitación pendiente"}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {moduleError && (
          <p className="table-error" role="alert">
            {moduleError}
          </p>
        )}
      </section>
    </>
  );
}

function Settings({
  code,
  onChange,
  orderNumber,
  order,
  onEventChange,
}: {
  code: string;
  onChange: (value: string) => void;
  orderNumber: string;
  order: AdminOrder;
  onEventChange: (details: { eventName: string; eventDate: string }) => void;
}) {
  const { text: t, locale } = useAdminI18n();
  const knownCode = countryCodes.some(([, value]) => value === code);
  const [selection, setSelection] = useState(knownCode ? code : "custom");
  const [customCode, setCustomCode] = useState(knownCode ? "" : code);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);
  const [automaticRemindersEnabled, setAutomaticRemindersEnabled] =
    useState(false);
  const [eventName, setEventName] = useState(order.customerName);
  const [eventDate, setEventDate] = useState(order.eventDate);
  const [testingReminder, setTestingReminder] = useState(false);
  const [healthBusy, setHealthBusy] = useState(true);
  const [health, setHealth] = useState<{
    checkedAt: string;
    services: Record<
      "database" | "email" | "scheduler",
      { status: "ok" | "error"; detail: string }
    >;
  } | null>(null);
  const [retentionDeadline, setRetentionDeadline] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [restoreBackup, setRestoreBackup] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<{
    guests: number;
    tables: number;
    collaborators: number;
  } | null>(null);
  const [canRestore, setCanRestore] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" }).then(
      async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as {
          eventName?: string;
          eventDate?: string;
          reminderDaysBefore?: number;
          automaticRemindersEnabled?: boolean;
        };
        setReminderDaysBefore(result.reminderDaysBefore || 7);
        setAutomaticRemindersEnabled(result.automaticRemindersEnabled === true);
        setEventName(result.eventName || order.customerName);
        setEventDate(result.eventDate || order.eventDate);
      },
    );
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthBusy(true);
    try {
      const response = await fetch("/api/admin/health", { cache: "no-store" });
      const result = (await response.json()) as typeof health & {
        error?: string;
      };
      if (!response.ok || !result?.services)
        throw new Error(result?.error || "No pudimos comprobar el sistema.");
      setHealth(result);
    } catch {
      setHealth(null);
    } finally {
      setHealthBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    fetch("/api/admin/privacy", { cache: "no-store" }).then(
      async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as {
          retentionDeadline?: string | null;
        };
        setRetentionDeadline(result.retentionDeadline || "");
      },
    );
  }, []);

  const save = async () => {
    const value = selection === "custom" ? customCode.trim() : selection;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultPhoneCountryCode: value,
          reminderDaysBefore,
          automaticRemindersEnabled,
          eventName,
          eventDate,
        }),
      });
      const result = (await response.json()) as {
        defaultPhoneCountryCode?: string;
        reminderDaysBefore?: number;
        automaticRemindersEnabled?: boolean;
        eventName?: string;
        eventDate?: string;
        error?: string;
      };
      if (!response.ok || !result.defaultPhoneCountryCode)
        throw new Error(result.error || "No pudimos guardar la configuración.");
      onChange(result.defaultPhoneCountryCode);
      setReminderDaysBefore(result.reminderDaysBefore || reminderDaysBefore);
      setAutomaticRemindersEnabled(result.automaticRemindersEnabled === true);
      const savedEventName = result.eventName || eventName;
      const savedEventDate = result.eventDate ?? eventDate;
      setEventName(savedEventName);
      setEventDate(savedEventDate);
      onEventChange({ eventName: savedEventName, eventDate: savedEventDate });
      setMessage("Configuración guardada correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos guardar la configuración.",
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    setBackingUp(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/backup", { cache: "no-store" });
      const result = (await response.json()) as {
        backup?: Record<string, unknown>;
        error?: string;
      };
      if (!response.ok || !result.backup)
        throw new Error(result.error || "No pudimos generar el respaldo.");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(result.backup, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `save-your-date-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Respaldo generado correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos generar el respaldo.",
      );
    } finally {
      setBackingUp(false);
    }
  };

  const sendTestReminder = async () => {
    setTestingReminder(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/test-reminder", {
        method: "POST",
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "No pudimos enviar la prueba.");
      setMessage(result.message || "Correo de prueba enviado.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No pudimos enviar la prueba.",
      );
    } finally {
      setTestingReminder(false);
    }
  };

  const deleteEvent = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== orderNumber) return;
    if (
      !window.confirm(
        "Esta acción elimina definitivamente el evento y no se puede deshacer. ¿Querés continuar?",
      )
    )
      return;
    setDeletingEvent(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/privacy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No pudimos eliminar el evento.");
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos eliminar el evento.",
      );
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
        body: JSON.stringify({ backup }),
      });
      const result = (await response.json()) as {
        valid?: boolean;
        canRestore?: boolean;
        summary?: { guests: number; tables: number; collaborators: number };
        error?: string;
      };
      if (!response.ok || !result.valid || !result.summary)
        throw new Error(result.error || "El respaldo no es válido.");
      setRestoreBackup(backup);
      setRestoreSummary(result.summary);
      setCanRestore(result.canRestore === true);
      setMessage(
        result.canRestore
          ? "Respaldo válido. Revisá el resumen antes de restaurar."
          : "El respaldo es válido, pero este evento contiene datos y no puede restaurarse sin riesgo.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No pudimos leer el respaldo.",
      );
    }
  };

  const restoreData = async () => {
    if (
      !restoreBackup ||
      !canRestore ||
      restoreConfirmation.trim().toUpperCase() !== orderNumber
    )
      return;
    setRestoring(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: restoreBackup,
          apply: true,
          confirmation: restoreConfirmation,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No pudimos restaurar el respaldo.");
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos restaurar el respaldo.",
      );
      setRestoring(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t(
              "Preferencias del evento",
              "Event preferences",
              "Preferências do evento",
            )}
          </span>
          <h1>{t("Configuración", "Settings", "Configurações")}</h1>
          <p>
            {t(
              "Definí valores predeterminados para automatizar la gestión.",
              "Set defaults to streamline event management.",
              "Defina valores padrão para automatizar a gestão.",
            )}
          </p>
        </div>
      </div>
      <ContextHelp
        title={t(
          "Configuración segura",
          "Safe settings",
          "Configuração segura",
        )}
      >
        {t(
          "Los respaldos no incluyen contraseñas ni códigos. Restaurar o eliminar datos siempre exige confirmar el número de pedido.",
          "Backups never include passwords or codes. Restoring or deleting data always requires your order number.",
          "Os backups não incluem senhas nem códigos. Restaurar ou excluir dados sempre exige o número do pedido.",
        )}
      </ContextHelp>
      <section className="panel settings-panel">
        <div className="panel-title">
          <div>
            <h2>{t("Datos del evento", "Event details", "Dados do evento")}</h2>
            <p>{t("Estos datos se muestran en el panel y en los recordatorios.", "These details appear in the dashboard and reminders.", "Esses dados aparecem no painel e nos lembretes.")}</p>
          </div>
        </div>
        <div className="settings-form event-settings-form">
          <label>{t("Nombre que se muestra", "Displayed name", "Nome exibido")}<input value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder={t("Ejemplo: Juanita", "Example: Juanita", "Exemplo: Juanita")} /></label>
          <label>{t("Fecha del evento", "Event date", "Data do evento")}<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
        </div>
        <div className="panel-title">
          <div>
            <h2>
              {t(
                "País predeterminado de WhatsApp",
                "Default WhatsApp country",
                "País padrão do WhatsApp",
              )}
            </h2>
            <p>
              {t(
                "Se aplicará automáticamente al agregar invitados y se podrá cambiar en cada caso.",
                "Applied automatically when adding guests, and editable for each guest.",
                "Aplicado automaticamente ao adicionar convidados e editável em cada caso.",
              )}
            </p>
          </div>
        </div>
        <div className="settings-form">
          <label>
            {t("País", "Country", "País")}
            <select
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
            >
              {countryCodes.map(([country, value]) => (
                <option key={value} value={value}>
                  {country} {value}
                </option>
              ))}
              <option value="custom">
                {t("Otro país", "Other country", "Outro país")}
              </option>
            </select>
          </label>
          {selection === "custom" && (
            <label>
              {t(
                "Código internacional",
                "International code",
                "Código internacional",
              )}
              <input
                value={customCode}
                onChange={(event) => setCustomCode(event.target.value)}
                placeholder="+___"
              />
            </label>
          )}
          <label>
            {t(
              "Recordatorios automáticos",
              "Automatic reminders",
              "Lembretes automáticos",
            )}
            <select
              value={automaticRemindersEnabled ? "enabled" : "disabled"}
              onChange={(event) =>
                setAutomaticRemindersEnabled(event.target.value === "enabled")
              }
            >
              <option value="disabled">
                {t("Desactivados", "Disabled", "Desativados")}
              </option>
              <option value="enabled">
                {t("Activados", "Enabled", "Ativados")}
              </option>
            </select>
          </label>
          <label>
            {t(
              "Enviar con anticipación",
              "Send in advance",
              "Enviar com antecedência",
            )}
            <input
              type="number"
              min="1"
              max="60"
              disabled={!automaticRemindersEnabled}
              value={reminderDaysBefore}
              onChange={(event) =>
                setReminderDaysBefore(
                  Math.max(1, Math.min(60, Number(event.target.value) || 1)),
                )
              }
            />
            <small>
              {t(
                "Días antes del evento",
                "Days before the event",
                "Dias antes do evento",
              )}
            </small>
          </label>
          <button
            className="primary-button small"
            disabled={saving}
            onClick={save}
          >
            {saving
              ? t("Guardando…", "Saving…", "Salvando…")
              : t(
                  "Guardar configuración",
                  "Save settings",
                  "Salvar configurações",
                )}
          </button>
        </div>
        {message && (
          <p className="settings-message" role="status">
            {message}
          </p>
        )}
      </section>
      <section className="panel settings-panel">
        <div className="panel-title">
          <div>
            <h2>
              {t(
                "Probar recordatorio por email",
                "Test email reminder",
                "Testar lembrete por email",
              )}
            </h2>
            <p>
              {t(
                "Envía una muestra únicamente al email del propietario. No contacta invitados ni modifica confirmaciones.",
                "Sends a sample only to the owner's email. It does not contact guests or change RSVPs.",
                "Envia uma amostra apenas ao email do proprietário. Não contata convidados nem altera confirmações.",
              )}
            </p>
          </div>
        </div>
        <div className="settings-form">
          <button
            className="outline-button"
            disabled={testingReminder}
            onClick={sendTestReminder}
          >
            {testingReminder
              ? t("Enviando…", "Sending…", "Enviando…")
              : t(
                  "Enviar email de prueba",
                  "Send test email",
                  "Enviar email de teste",
                )}
          </button>
        </div>
      </section>
      <section className="panel settings-panel">
        <div className="panel-title">
          <div>
            <h2>{t("Respaldo de datos", "Data backup", "Backup de dados")}</h2>
            <p>
              {t(
                "Descargá una copia completa del evento sin contraseñas, códigos ni secretos de autenticación.",
                "Download a complete event copy without passwords, codes or authentication secrets.",
                "Baixe uma cópia completa do evento sem senhas, códigos ou segredos de autenticação.",
              )}
            </p>
          </div>
        </div>
        <div className="settings-form">
          <button
            className="outline-button"
            disabled={backingUp}
            onClick={downloadBackup}
          >
            {backingUp
              ? t("Generando…", "Generating…", "Gerando…")
              : `⇩ ${t("Descargar respaldo JSON", "Download JSON backup", "Baixar backup JSON")}`}
          </button>
        </div>
      </section>
      <section className="panel settings-panel">
        <div className="panel-title">
          <div>
            <h2>
              {t("Restaurar respaldo", "Restore backup", "Restaurar backup")}
            </h2>
            <p>
              {t(
                "Primero validamos el archivo. Para evitar mezclas o sobrescrituras, sólo se puede restaurar cuando invitados, mesas y colaboradores están vacíos.",
                "We validate the file first. To prevent mixing or overwriting, restoration is only available when guests, tables and collaborators are empty.",
                "Primeiro validamos o arquivo. Para evitar misturas ou sobrescritas, a restauração só está disponível quando convidados, mesas e colaboradores estão vazios.",
              )}
            </p>
          </div>
        </div>
        <div className="settings-form restore-form">
          <label className="restore-file">
            {t("Archivo JSON", "JSON file", "Arquivo JSON")}
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => void inspectBackup(event.target.files?.[0])}
            />
          </label>
          {restoreSummary && (
            <p className="restore-summary">
              <strong>{restoreSummary.guests}</strong>{" "}
              {t("invitados", "guests", "convidados")} ·{" "}
              <strong>{restoreSummary.tables}</strong>{" "}
              {t("mesas", "tables", "mesas")} ·{" "}
              <strong>{restoreSummary.collaborators}</strong>{" "}
              {t("colaboradores", "collaborators", "colaboradores")}
            </p>
          )}
          {restoreSummary && !canRestore && (
            <p className="restore-blocked" role="status">
              {t(
                "Este evento ya contiene datos. La restauración está bloqueada para evitar sobrescrituras.",
                "This event already contains data. Restoration is blocked to prevent overwriting.",
                "Este evento já contém dados. A restauração está bloqueada para evitar sobrescritas.",
              )}
            </p>
          )}
          {restoreSummary && canRestore && (
            <label>
              {t("Confirmación", "Confirmation", "Confirmação")}
              <input
                value={restoreConfirmation}
                onChange={(event) => setRestoreConfirmation(event.target.value)}
                placeholder={`${t("Escribí", "Type", "Digite")} ${orderNumber}`}
              />
            </label>
          )}
          {restoreSummary && canRestore && (
            <button
              className="outline-button"
              disabled={
                restoring ||
                restoreConfirmation.trim().toUpperCase() !== orderNumber
              }
              onClick={restoreData}
            >
              {restoring
                ? t("Restaurando…", "Restoring…", "Restaurando…")
                : t("Restaurar datos", "Restore data", "Restaurar dados")}
            </button>
          )}
        </div>
      </section>
      <section className="panel settings-panel privacy-panel">
        <div className="panel-title">
          <div>
            <h2>
              {t(
                "Privacidad y eliminación",
                "Privacy and deletion",
                "Privacidade e exclusão",
              )}
            </h2>
            <p>
              {t(
                "Los datos se conservan durante 30 días después del evento. Luego se bloquean todos los accesos y se eliminan automáticamente.",
                "Data is retained for 30 days after the event. Then all access is disabled and the data is deleted automatically.",
                "Os dados são mantidos por 30 dias após o evento. Depois, todos os acessos são desativados e os dados são excluídos automaticamente.",
              )}
            </p>
          </div>
        </div>
        {retentionDeadline && (
          <p className="privacy-deadline">
            {t(
              "El acceso finalizará el",
              "Access will end on",
              "O acesso terminará em",
            )}{" "}
            <strong>
              {new Date(retentionDeadline).toLocaleDateString(locale, {
                dateStyle: "long",
                timeZone: "UTC",
              })}
            </strong>
            .
          </p>
        )}
        <div className="settings-form">
          <label>
            {t("Confirmación", "Confirmation", "Confirmação")}
            <input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={`${t("Escribí", "Type", "Digite")} ${orderNumber}`}
            />
          </label>
          <button
            className="danger-button"
            disabled={
              deletingEvent ||
              deleteConfirmation.trim().toUpperCase() !== orderNumber
            }
            onClick={deleteEvent}
          >
            {deletingEvent
              ? t("Eliminando…", "Deleting…", "Excluindo…")
              : t(
                  "Eliminar evento y todos sus datos",
                  "Delete event and all its data",
                  "Excluir evento e todos os dados",
                )}
          </button>
        </div>
      </section>
      <section className="panel settings-panel">
        <div className="panel-title">
          <div>
            <h2>
              {t("Estado del sistema", "System status", "Status do sistema")}
            </h2>
            <p>
              {t(
                "Diagnóstico privado de los servicios que sostienen el panel y los recordatorios.",
                "Private diagnostics for services powering the dashboard and reminders.",
                "Diagnóstico privado dos serviços que sustentam o painel e os lembretes.",
              )}
            </p>
          </div>
          <button
            className="outline-button"
            disabled={healthBusy}
            onClick={() => void loadHealth()}
          >
            {healthBusy
              ? t("Comprobando…", "Checking…", "Verificando…")
              : t("Actualizar estado", "Refresh status", "Atualizar status")}
          </button>
        </div>
        <div className="health-grid">
          {(
            [
              [
                "database",
                t("Base de datos", "Database", "Banco de dados"),
                t(
                  "Invitados, mesas y confirmaciones",
                  "Guests, tables and RSVPs",
                  "Convidados, mesas e confirmações",
                ),
              ],
              [
                "email",
                t("Correo", "Email", "Email"),
                t(
                  "Accesos y recordatorios",
                  "Access and reminders",
                  "Acessos e lembretes",
                ),
              ],
              [
                "scheduler",
                t("Automatización", "Automation", "Automação"),
                t(
                  "Ejecución programada del cron",
                  "Scheduled background execution",
                  "Execução programada em segundo plano",
                ),
              ],
            ] as const
          ).map(([key, label, description]) => {
            const service = health?.services[key];
            return (
              <article key={key}>
                <span
                  className={`health-indicator ${service?.status === "ok" ? "is-ok" : service ? "is-error" : "is-pending"}`}
                  aria-hidden="true"
                />
                <div>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </div>
                <span
                  className={`health-status ${service?.status === "ok" ? "is-ok" : "is-error"}`}
                >
                  {service
                    ? service.detail
                    : healthBusy
                      ? t("Comprobando…", "Checking…", "Verificando…")
                      : t("Sin respuesta", "No response", "Sem resposta")}
                </span>
              </article>
            );
          })}
        </div>
        {health?.checkedAt && (
          <p className="health-checked">
            {t("Última comprobación", "Last check", "Última verificação")}:{" "}
            {new Date(health.checkedAt).toLocaleString(locale)}
          </p>
        )}
      </section>
    </>
  );
}

type AdminAccess = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  created_at: string;
};
type AdminActivity = {
  id: string;
  actor_email: string;
  actor_role: "owner" | "editor" | "viewer";
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
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
      if (response.ok)
        setAccesses(
          ((await response.json()) as { accesses: AdminAccess[] }).accesses,
        );
    });
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (order.accessRole !== "owner") return;
    fetch("/api/admin/activity", { cache: "no-store" }).then(
      async (response) => {
        if (response.ok)
          setActivities(
            ((await response.json()) as { activities: AdminActivity[] })
              .activities,
          );
      },
    );
  }, [order.accessRole]);

  const activityLabel = (action: string) =>
    ({
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
      "settings.updated": "Actualizó la configuración",
    })[action] || action;

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const result = (await response.json()) as {
        access?: AdminAccess;
        error?: string;
      };
      if (!response.ok || !result.access)
        throw new Error(result.error || "No pudimos invitar al colaborador.");
      setAccesses((current) => [...current, result.access!]);
      setShowModal(false);
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "No pudimos invitar al colaborador.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const access = accesses.find((item) => item.id === id);
    if (
      !window.confirm(
        `¿Revocar el acceso de ${access?.email || "este colaborador"}?`,
      )
    )
      return;
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/access?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No pudimos revocar el acceso.");
      setAccesses((current) => current.filter((access) => access.id !== id));
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "No pudimos revocar el acceso.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  const updateRole = async (access: AdminAccess, role: AdminAccess["role"]) => {
    setUpdatingId(access.id);
    setError("");
    try {
      const response = await fetch("/api/admin/access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: access.id, role }),
      });
      const result = (await response.json()) as {
        access?: AdminAccess;
        error?: string;
      };
      if (!response.ok || !result.access)
        throw new Error(result.error || "No pudimos cambiar el rol.");
      setAccesses((current) =>
        current.map((item) => (item.id === access.id ? result.access! : item)),
      );
    } catch (roleError) {
      setError(
        roleError instanceof Error
          ? roleError.message
          : "No pudimos cambiar el rol.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t("Seguridad del evento", "Event security", "Segurança do evento")}
          </span>
          <h1>{t("Accesos", "Access", "Acessos")}</h1>
          <p>
            {t(
              "Gestioná quién puede ingresar y qué puede modificar.",
              "Manage who can sign in and what they can change.",
              "Gerencie quem pode entrar e o que pode alterar.",
            )}
          </p>
        </div>
        {order.accessRole === "owner" && (
          <button
            className="primary-button small"
            onClick={() => setShowModal(true)}
          >
            ＋{" "}
            {t(
              "Agregar colaborador",
              "Add collaborator",
              "Adicionar colaborador",
            )}
          </button>
        )}
      </div>
      <ContextHelp
        title={t(
          "Roles y permisos",
          "Roles and permissions",
          "Funções e permissões",
        )}
      >
        {t(
          "Los editores pueden gestionar el evento. Los usuarios de solo lectura pueden consultar la información sin modificarla.",
          "Editors can manage the event. View-only users can consult information without changing it.",
          "Editores podem gerenciar o evento. Usuários de somente leitura podem consultar sem fazer alterações.",
        )}
      </ContextHelp>
      <section className="metrics-grid mini">
        <Metric
          label={t("Propietarios", "Owners", "Proprietários")}
          value="1"
          note={t("acceso total", "full access", "acesso total")}
          tone="blue"
        />
        <Metric
          label={t("Editores", "Editors", "Editores")}
          value={String(
            accesses.filter((access) => access.role === "editor").length,
          )}
          note={t("pueden modificar", "can edit", "podem editar")}
          tone="green"
        />
        <Metric
          label={t("Solo lectura", "View only", "Somente leitura")}
          value={String(
            accesses.filter((access) => access.role === "viewer").length,
          )}
          note={t("sin cambios", "no changes", "sem alterações")}
          tone="amber"
        />
      </section>
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("Administrador", "Administrator", "Administrador")}</th>
                <th>{t("Rol", "Role", "Função")}</th>
                <th>{t("Estado", "Status", "Status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{order.loginEmail}</strong>
                </td>
                <td>{t("Propietario", "Owner", "Proprietário")}</td>
                <td>
                  <span className="status status-confirmado">
                    {t("Activo", "Active", "Ativo")}
                  </span>
                </td>
                <td />
              </tr>
              {accesses.map((access) => (
                <tr key={access.id}>
                  <td>
                    <strong>{access.email}</strong>
                  </td>
                  <td>
                    {order.accessRole === "owner" ? (
                      <select
                        className="status-select"
                        value={access.role}
                        disabled={updatingId === access.id}
                        onChange={(event) =>
                          updateRole(
                            access,
                            event.target.value as AdminAccess["role"],
                          )
                        }
                        aria-label={`${t("Rol de", "Role for", "Função de")} ${access.email}`}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">
                          {t("Solo lectura", "View only", "Somente leitura")}
                        </option>
                      </select>
                    ) : access.role === "editor" ? (
                      "Editor"
                    ) : (
                      t("Solo lectura", "View only", "Somente leitura")
                    )}
                  </td>
                  <td>
                    <span className="status status-confirmado">
                      {t("Activo", "Active", "Ativo")}
                    </span>
                  </td>
                  <td>
                    {order.accessRole === "owner" && (
                      <button
                        className="more-button"
                        disabled={updatingId === access.id}
                        onClick={() => remove(access.id)}
                      >
                        {t("Eliminar", "Remove", "Excluir")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && (
          <p className="table-error" role="alert">
            {error}
          </p>
        )}
      </section>
      {order.accessRole === "owner" && (
        <section className="panel table-panel audit-panel">
          <div className="panel-title">
            <div>
              <h2>
                {t(
                  "Historial de actividad",
                  "Activity history",
                  "Histórico de atividades",
                )}
              </h2>
              <p>
                {t(
                  "Últimos cambios realizados desde el panel.",
                  "Latest changes made from the dashboard.",
                  "Últimas alterações feitas no painel.",
                )}
              </p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Usuario", "User", "Usuário")}</th>
                  <th>{t("Acción", "Action", "Ação")}</th>
                  <th>{t("Elemento", "Item", "Elemento")}</th>
                  <th>{t("Fecha", "Date", "Data")}</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <strong>{activity.actor_email}</strong>
                      <small className="cell-sub">
                        {activity.actor_role === "owner"
                          ? t("Propietario", "Owner", "Proprietário")
                          : activity.actor_role === "editor"
                            ? "Editor"
                            : t("Solo lectura", "View only", "Somente leitura")}
                      </small>
                    </td>
                    <td>{activityLabel(activity.action)}</td>
                    <td>{activity.entity_type}</td>
                    <td>{reportDate(activity.created_at, locale)}</td>
                  </tr>
                ))}
                {!activities.length && (
                  <tr>
                    <td colSpan={4}>
                      <span className="muted">
                        {t(
                          "Los próximos cambios administrativos aparecerán acá.",
                          "Future administrative changes will appear here.",
                          "As próximas alterações administrativas aparecerão aqui.",
                        )}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <form
            className="modal"
            onSubmit={invite}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <span className="eyebrow">
              {t("Nuevo acceso", "New access", "Novo acesso")}
            </span>
            <h2>
              {t(
                "Agregar colaborador",
                "Add collaborator",
                "Adicionar colaborador",
              )}
            </h2>
            <div className="form-grid">
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                {t("Rol", "Role", "Função")}
                <select name="role">
                  <option value="editor">Editor</option>
                  <option value="viewer">
                    {t("Solo lectura", "View only", "Somente leitura")}
                  </option>
                </select>
              </label>
            </div>
            <p className="dynamic-help">
              {t(
                "Recibirá un email y podrá ingresar con el número de pedido y su propia dirección.",
                "They will receive an email and can sign in with the order number and their own address.",
                "A pessoa receberá um email e poderá entrar com o número do pedido e seu próprio endereço.",
              )}
            </p>
            {error && <p className="login-error">{error}</p>}
            <div className="modal-actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => setShowModal(false)}
              >
                {t("Cancelar", "Cancel", "Cancelar")}
              </button>
              <button className="primary-button small" disabled={saving}>
                {saving
                  ? t("Enviando…", "Sending…", "Enviando…")
                  : t("Enviar invitación", "Send invitation", "Enviar convite")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function GlobalGuestEditor({
  guest,
  guests,
  defaultPhoneCountryCode,
  defaultInviter,
  onClose,
  onSaved,
}: {
  guest: Guest;
  guests: Guest[];
  defaultPhoneCountryCode: string;
  defaultInviter: string;
  onClose: () => void;
  onSaved: (guest: Guest) => void;
}) {
  const { text: t, language } = useAdminI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, ...Object.fromEntries(data) }),
      });
      const result = (await response.json()) as { guest?: Guest; error?: string };
      if (!response.ok || !result.guest) throw new Error(result.error || "No pudimos guardar los cambios.");
      onSaved(result.guest);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <span className="eyebrow">{t("Información del invitado", "Guest information", "Informações do convidado")}</span>
        <h2>{t("Editar a", "Edit", "Editar")} {guest.name}</h2>
        <div className="form-grid">
          <label>{t("Nombre y apellido", "Full name", "Nome completo")}<input name="name" defaultValue={guest.name} required /></label>
          <label>{t("Grupo", "Group", "Grupo")}<input name="group" defaultValue={guest.group} /></label>
          <label>{t("Invitación realizada por", "Invited by", "Convite feito por")}<input name="invitedBy" defaultValue={guest.invitedBy || defaultInviter} /></label>
          <label>{t("Acompañante de", "Companion of", "Acompanhante de")}<select name="companionOfId" defaultValue={guest.companionOfId}><option value="">{t("Invitación principal", "Primary invitation", "Convite principal")}</option>{guests.filter((item) => item.id !== guest.id && !item.companionOfId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>{t("Estado", "Status", "Status")}<select name="status" defaultValue={guest.status}><option value="Confirmado">{adminStatus(language, "Confirmado")}</option><option value="Pendiente">{adminStatus(language, "Pendiente")}</option><option value="No asiste">{adminStatus(language, "No asiste")}</option></select></label>
          <label>{t("Categoría de edad", "Age category", "Categoria etária")}<select name="guestType" defaultValue={guest.guestType || "adult"}><option value="adult">{t("Adulto", "Adult", "Adulto")}</option><option value="teen">{t("Adolescente", "Teenager", "Adolescente")}</option><option value="child">{t("Niño/a", "Child", "Criança")}</option></select></label>
          <label>{t("Cupos", "Seats", "Vagas")}<input name="seats" type="number" min="1" max="20" defaultValue={guest.seats} /></label>
          <label>Email<input name="email" type="email" defaultValue={guest.email} /></label>
          <label>{t("Código de país", "Country code", "Código do país")}<input name="phoneCountryCode" defaultValue={guest.phoneCountryCode || defaultPhoneCountryCode} required /></label>
          <label>WhatsApp<input name="phone" inputMode="tel" defaultValue={guest.phone.replace(guest.phoneCountryCode || defaultPhoneCountryCode, "")} /></label>
          <label>{t("Tipo de identificación", "ID type", "Tipo de identificação")}<select name="identificationType" defaultValue={guest.identificationType}><option value="">{t("Sin identificación", "No ID", "Sem identificação")}</option><option>CI</option><option>DNI</option><option>CPF</option><option>{t("Pasaporte", "Passport", "Passaporte")}</option><option>{t("Otro", "Other", "Outro")}</option></select></label>
          <label>{t("Identificación", "ID number", "Identificação")}<input name="identificationNumber" defaultValue={guest.identificationNumber} /></label>
          <label>{t("Restricción alimentaria", "Dietary need", "Restrição alimentar")}<input name="food" defaultValue={guest.food === "—" ? "" : guest.food} /></label>
          <label>{t("Canción sugerida", "Suggested song", "Música sugerida")}<input name="song" defaultValue={guest.song === "—" ? "" : guest.song} /></label>
          <label>{t("Transporte", "Transport", "Transporte")}<select name="transportOption" defaultValue={guest.transportOption}><option value="">{t("No necesita", "Not needed", "Não precisa")}</option><option value="Ida">{t("Ida", "Outbound", "Ida")}</option><option value="Regreso">{t("Regreso", "Return", "Volta")}</option><option value="Ida y regreso">{t("Ida y regreso", "Outbound and return", "Ida e volta")}</option></select></label>
          <label>{t("Parada del transporte", "Transport stop", "Parada do transporte")}<small className="field-help">{t("Sólo si usa el traslado del evento.", "Only when using event transport.", "Somente se usar o transporte do evento.")}</small><input name="transportStop" defaultValue={guest.transportStop} placeholder={t("Ej. Terminal Tres Cruces", "E.g. Central station", "Ex. Terminal central")} /></label>
          <label>{t("Preferencia de menú", "Menu preference", "Preferência de menu")}<input name="menuChoice" defaultValue={guest.menuChoice} /></label>
          <label>{t("Accesibilidad", "Accessibility", "Acessibilidade")}<input name="accessibilityNeeds" defaultValue={guest.accessibilityNeeds} /></label>
          <label>{t("Sentar junto a", "Seat together with", "Sentar junto com")}<input name="socialTogetherWith" defaultValue={guest.socialTogetherWith} placeholder={t("Nombre o grupo", "Name or group", "Nome ou grupo")} /></label>
          <label>{t("Mantener separado de", "Keep separate from", "Manter separado de")}<input name="socialSeparateFrom" defaultValue={guest.socialSeparateFrom} placeholder={t("Nombre o grupo", "Name or group", "Nome ou grupo")} /></label>
          <label>{t("Mesa preferida", "Preferred table", "Mesa preferida")}<input name="preferredTableName" defaultValue={guest.preferredTableName} placeholder={t("Ej. Mesa familia", "E.g. Family table", "Ex. Mesa família")} /></label>
          <label className="form-span-2">{t("Observaciones", "Notes", "Observações")}<textarea name="guestNotes" rows={3} defaultValue={guest.guestNotes} /></label>
        </div>
        {error && <p className="login-error">{error}</p>}
        <div className="modal-actions"><button className="outline-button" type="button" onClick={onClose}>{t("Cancelar", "Cancel", "Cancelar")}</button><button className="primary-button small" disabled={saving}>{saving ? t("Guardando…", "Saving…", "Salvando…") : t("Guardar cambios", "Save changes", "Salvar alterações")}</button></div>
      </form>
    </div>
  );
}

function ThanksModule({
  guests,
  setGuests,
  order,
  canEdit,
}: {
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  order: AdminOrder;
  canEdit: boolean;
}) {
  const { text: t, locale } = useAdminI18n();
  const [query, setQuery] = useState("");
  const honoree = order.customerName;
  const message =
    "Hola {{nombre}}.\n\n{{asistencia}}\n\nCon cariño, {{homenajeado}}.{{cuenta}}";
  const [thankText, setThankText] = useState(
    "Muchas gracias por haber compartido este maravilloso momento con nosotros. Fue muy especial celebrarlo juntos.",
  );
  const [bankDetails, setBankDetails] = useState(order.giftDetails);
  const [sendingId, setSendingId] = useState("");
  const [error, setError] = useState("");
  const visibleGuests = guests.filter((guest) =>
    `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase()),
  );
  const previewName = visibleGuests[0]?.name || t("María", "Mary", "Maria");
  const thanksPreview = (body: string) => `Hola ${previewName}.\n\n${body}\n\nCon cariño, ${honoree}.${bankDetails ? `\n\nSi querés hacerme un regalo, te dejo mis datos:\n${bankDetails}` : ""}`;

  const sendThanks = async (guest: Guest) => {
    setSendingId(guest.id);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "thank-you",
          id: guest.id,
          honoree,
          message,
          attendedText: thankText,
          absentText: thankText,
          bankDetails,
        }),
      });
      const result = (await response.json()) as { guest?: Guest; url?: string; error?: string };
      if (!response.ok || !result.guest || !result.url)
        throw new Error(result.error || "No pudimos preparar el agradecimiento.");
      setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "No pudimos preparar el agradecimiento.");
    } finally {
      setSendingId("");
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("Después del evento", "After the event", "Depois do evento")}</span>
          <h1>{t("Agradecimientos", "Thank-you messages", "Agradecimentos")}</h1>
          <p>{t("Personalizá el mensaje y agradecé a cada invitado por WhatsApp.", "Personalize the message and thank each guest via WhatsApp.", "Personalize a mensagem e agradeça cada convidado pelo WhatsApp.")}</p>
        </div>
      </div>
      <section className="panel thanks-composer">
        <div className="panel-title"><div><h2>{t("Preparar mensaje", "Prepare message", "Preparar mensagem")}</h2><p>{t("Este mismo mensaje se enviará a todos los invitados seleccionados.", "The same message will be sent to all selected guests.", "A mesma mensagem será enviada a todos os convidados selecionados.")}</p></div></div>
        <div className="message-composer-body">
          <label>{t("Mensaje de agradecimiento", "Thank-you message", "Mensagem de agradecimento")}<textarea rows={3} value={thankText} onChange={(event) => setThankText(event.target.value)} /></label>
          <label>{t("Datos de la cuenta", "Account details", "Dados da conta")}<textarea rows={3} value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} placeholder={t("Agregá los datos bancarios para recordar el regalo", "Add bank details as a gift reminder", "Adicione os dados bancários para lembrar o presente")} /></label>
          <div className="message-preview"><span>{t("Ejemplo del mensaje final", "Final message example", "Exemplo da mensagem final")}</span><p>{thanksPreview(thankText)}</p></div>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="table-tools"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado o grupo…", "Search guest or group…", "Buscar convidado ou grupo…")} /></label></div>
        <div className="table-scroll"><table><thead><tr><th>{t("Invitado", "Guest", "Convidado")}</th><th>{t("Asistencia", "Attendance", "Presença")}</th><th>{t("Agradecimiento", "Thank-you", "Agradecimento")}</th><th>{t("Acción", "Action", "Ação")}</th></tr></thead>
          <tbody>{visibleGuests.map((guest) => <tr key={guest.id}><td><div className="person"><GuestAvatar guest={guest} /><p><GuestNameButton guest={guest} /><small>{guest.group}</small></p></div></td><td><Status value={guest.status} /></td><td>{guest.thankedAt ? <span className="status status-confirmado">{t("Enviado", "Sent", "Enviado")} · {reportDate(guest.thankedAt, locale)}</span> : <span className="muted">{t("Pendiente", "Pending", "Pendente")}</span>}</td><td>{canEdit ? <button className="whatsapp-button" disabled={!guest.phone || sendingId === guest.id} onClick={() => sendThanks(guest)}>{sendingId === guest.id ? t("Preparando…", "Preparing…", "Preparando…") : guest.thankedAt ? t("Reenviar por WhatsApp", "Resend via WhatsApp", "Reenviar pelo WhatsApp") : t("Enviar por WhatsApp", "Send via WhatsApp", "Enviar pelo WhatsApp")}</button> : <span className="muted">{t("Solo lectura", "View only", "Somente leitura")}</span>}</td></tr>)}</tbody>
        </table></div>
        {error && <p className="table-error" role="alert">{error}</p>}
      </section>
    </>
  );
}

function Admin({
  onLogout,
  order,
  onLanguageChange,
  onOrderChange,
}: {
  onLogout: () => void;
  order: AdminOrder;
  onLanguageChange: (language: AdminLanguage) => void;
  onOrderChange: (order: AdminOrder) => void;
}) {
  const { text: t, locale, language } = useAdminI18n();
  const [view, setView] = useState("Resumen");
  const [guests, setGuests] = useState(guestsSeed);
  const activeGuests = guests.filter((guest) => !guest.archivedAt);
  const [mobileNav, setMobileNav] = useState(false);
  const [defaultPhoneCountryCode, setDefaultPhoneCountryCode] = useState(
    order.defaultPhoneCountryCode || "+598",
  );
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [globalEditingId, setGlobalEditingId] = useState("");
  const [comfortableText, setComfortableText] = useState(
    () =>
      window.sessionStorage.getItem("syd-admin-font-size") === "comfortable-v2",
  );
  const navLabel = useCallback(
    (item: string) =>
      (
        ({
          Resumen: t("Resumen", "Overview", "Resumo"),
          Invitados: t("Invitados", "Guests", "Convidados"),
          Confirmaciones: t("Confirmaciones", "Confirmations", "Confirmações"),
          Mesas: t("Mesas", "Tables", "Mesas"),
          Restricciones: t("Restricciones", "Dietary needs", "Restrições"),
          Canciones: t("Canciones", "Songs", "Músicas"),
          Recordatorios: t("Recordatorios", "Reminders", "Lembretes"),
          Agradecimientos: t("Agradecimientos", "Thank-you", "Agradecimentos"),
          Accesos: t("Accesos", "Access", "Acessos"),
          Configuración: t("Configuración", "Settings", "Configurações"),
        }) as Record<string, string>
      )[item] || item,
    [t],
  );
  const title =
    view === "Resumen"
      ? t("Panel principal", "Main dashboard", "Painel principal")
      : navLabel(view);

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

  useEffect(() => {
    const openEditor = (event: Event) =>
      setGlobalEditingId(String((event as CustomEvent<string>).detail || ""));
    window.addEventListener("syd:edit-guest", openEditor);
    return () => window.removeEventListener("syd:edit-guest", openEditor);
  }, []);

  const navigate = (item: string) => {
    setView(item);
    setMobileNav(false);
  };
  const changeTextSize = (comfortable: boolean) => {
    setComfortableText(comfortable);
    window.sessionStorage.setItem(
      "syd-admin-font-size",
      comfortable ? "comfortable-v2" : "small-v2",
    );
  };

  return (
    <main
      className={`admin-shell ${comfortableText ? "font-comfortable" : "font-small"}`}
    >
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <Logo compact />
          <button className="mobile-close" onClick={() => setMobileNav(false)}>
            ×
          </button>
        </div>
        <div className="event-switcher">
          <span>{initials(order.customerName)}</span>
          <div>
            <strong>{order.customerName}</strong>
            <small>
              {t("Pedido", "Order", "Pedido")} {order.orderNumber}
            </small>
          </div>
        </div>
        <nav>
          {nav
            .filter(
              ([item]) =>
                item !== "Configuración" || order.accessRole === "owner",
            )
            .map(([item, icon]) => (
              <button
                key={item}
                className={view === item ? "active" : ""}
                onClick={() => navigate(item)}
              >
                <span>{icon}</span>
                {navLabel(item)}
                {item === "Recordatorios" &&
                  activeGuests.filter((guest) => guest.status === "Pendiente")
                    .length > 0 && (
                    <b>
                      {
                        activeGuests.filter((guest) => guest.status === "Pendiente")
                          .length
                      }
                    </b>
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-help">
          <span>?</span>
          <div>
            <strong>
              {t("¿Necesitás ayuda?", "Need help?", "Precisa de ajuda?")}
            </strong>
            <small>
              {t(
                "Estamos para acompañarte.",
                "We are here to help.",
                "Estamos aqui para ajudar.",
              )}
            </small>
          </div>
          <button
            onClick={() => {
              window.location.href = `mailto:hola@saveyourdate.site?subject=${encodeURIComponent(`${t("Ayuda con el pedido", "Help with order", "Ajuda com o pedido")} ${order.orderNumber}`)}`;
            }}
          >
            {t("Contactar soporte", "Contact support", "Contatar suporte")}
          </button>
        </div>
        <button className="logout" onClick={onLogout}>
          <span>↪</span>
          {t("Cerrar sesión", "Sign out", "Sair")}
        </button>
      </aside>
      {mobileNav && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMobileNav(false)}
        />
      )}
      <section className="admin-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}>
            ☰
          </button>
          <div className="topbar-title">
            <span>{title}</span>
            <small>
              {lastSynced
                ? `${t("Sincronizado", "Synced", "Sincronizado")} ${lastSynced.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
                : t(
                    "Sincronizando datos…",
                    "Syncing data…",
                    "Sincronizando dados…",
                  )}
            </small>
          </div>
          <div className="topbar-actions">
            <FontSizeSwitcher
              comfortable={comfortableText}
              onChange={changeTextSize}
            />
            <LanguageSwitcher
              compact
              value={language}
              onChange={onLanguageChange}
            />
            <button
              className={`notification sync-button ${syncing ? "syncing" : ""}`}
              onClick={() => refreshGuests(true)}
              aria-label={t(
                "Actualizar datos",
                "Refresh data",
                "Atualizar dados",
              )}
              title={t("Actualizar datos", "Refresh data", "Atualizar dados")}
            >
              ↻
            </button>
            <div className="admin-user">
              <span>{initials(order.loginEmail || order.customerName)}</span>
              <div>
                <strong>{order.customerName}</strong>
                <span className="admin-email">{order.loginEmail}</span>
                <small>
                  {order.accessRole === "owner"
                    ? t("Propietario", "Owner", "Proprietário")
                    : order.accessRole === "editor"
                      ? "Editor"
                      : t("Solo lectura", "Read only", "Somente leitura")}
                </small>
              </div>
            </div>
          </div>
        </header>
        <div className="admin-content">
          {view === "Resumen" && (
            <Dashboard
              guests={activeGuests}
              onNavigate={navigate}
              order={order}
              canEdit={order.accessRole !== "viewer"}
            />
          )}
          {view === "Invitados" && (
            <Guests
              guests={guests}
              setGuests={setGuests}
              defaultPhoneCountryCode={defaultPhoneCountryCode}
              defaultInviter={order.customerName}
              invitationUrl={order.invitationUrl}
              canEdit={order.accessRole !== "viewer"}
            />
          )}
          {view === "Mesas" && (
            <Seating guests={activeGuests} canEdit={order.accessRole !== "viewer"} />
          )}
          {["Restricciones", "Canciones", "Recordatorios"].includes(view) && (
            <SimpleModule
              view={view}
              guests={activeGuests}
              setGuests={setGuests}
              order={order}
              canEdit={order.accessRole !== "viewer"}
              onOrderChange={onOrderChange}
            />
          )}
          {view === "Agradecimientos" && (
            <ThanksModule
              guests={activeGuests}
              setGuests={setGuests}
              order={order}
              canEdit={order.accessRole !== "viewer"}
            />
          )}
          {view === "Accesos" && <Accesses order={order} />}
          {view === "Configuración" && (
            <Settings
              code={defaultPhoneCountryCode}
              onChange={setDefaultPhoneCountryCode}
              orderNumber={order.orderNumber}
              order={order}
              onEventChange={({ eventName, eventDate }) => onOrderChange({ ...order, customerName: eventName, eventTitle: eventName, eventDate })}
            />
          )}
        </div>
        <footer>
          <span>Save Your Date</span>
          <small>
            {t(
              "Invitaciones digitales para momentos inolvidables",
              "Digital invitations for unforgettable moments",
              "Convites digitais para momentos inesquecíveis",
            )}{" "}
            · Panel v106
          </small>
        </footer>
      </section>
      {globalEditingId && order.accessRole !== "viewer" && (() => {
        const guest = guests.find((item) => item.id === globalEditingId);
        return guest ? <GlobalGuestEditor guest={guest} guests={guests} defaultPhoneCountryCode={defaultPhoneCountryCode} defaultInviter={order.customerName} onClose={() => setGlobalEditingId("")} onSaved={(updated) => setGuests((current) => current.map((item) => item.id === updated.id ? updated : item))} /> : null;
      })()}
    </main>
  );
}

export function AdminPrototype() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [panelLanguage, setPanelLanguage] = useState<AdminLanguage>("es");
  useEffect(() => {
    document.documentElement.lang = panelLanguage;
  }, [panelLanguage]);

  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { order: AdminOrder };
        setOrder(result.order);
        const savedLanguage = window.sessionStorage.getItem(
          "syd-admin-language",
        ) as AdminLanguage | null;
        setPanelLanguage(
          savedLanguage && ["es", "en", "pt"].includes(savedLanguage)
            ? savedLanguage
            : result.order.language,
        );
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

  if (checkingSession)
    return <main className="admin-loading">Verificando acceso…</main>;
  return loggedIn && order ? (
    <AdminI18nProvider language={panelLanguage}>
      <Admin
        onLogout={logout}
        order={order}
        onLanguageChange={changePanelLanguage}
        onOrderChange={setOrder}
      />
    </AdminI18nProvider>
  ) : (
    <Login onLogin={() => window.location.reload()} />
  );
}

export default AdminPrototype;
