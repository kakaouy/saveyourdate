import React, { useCallback, useEffect, useRef, useState } from "react";
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
  socialCircle: string;
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
  whatsappStatusAt?: string;
  whatsappErrorDetail?: unknown;
  invitedBy: string;
  companionOfId: string;
  thankedAt?: string;
  checkedInAt?: string;
};

type GuestImportDraft = {
  name: string;
  group: string;
  socialCircle: string;
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

type GuestImportResult = {
  fileName: string;
  imported: number;
  omittedDuplicates: number;
  omittedErrors: number;
  importedIds: string[];
};

type GuestImportMapping = {
  fileName: string;
  rows: string[][];
  columns: Record<string, number>;
};

const guestImportFields = [
  ["name", "Nombre y apellido"],
  ["group", "Grupo de invitación"],
  ["socialCircle", "Círculo social"],
  ["phone", "WhatsApp"],
  ["phoneCountryCode", "Código de país"],
  ["seats", "Cupos"],
  ["email", "Email"],
  ["identificationType", "Tipo de identificación"],
  ["identificationNumber", "Número de identificación"],
  ["food", "Restricción alimentaria"],
  ["invitedBy", "Invitado por"],
  ["companionOf", "Acompañante de"],
] as const;

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
  accessRole: "owner" | "admin" | "editor" | "viewer";
  loginEmail: string;
  invitationUrl: string;
  giftDetails: string;
  enabledModules: Array<"invitation" | "guests_rsvp" | "tables" | "check_in" | "messaging" | "collaborative_album" | "suppliers">;
};

const guestsSeed: Guest[] = [];

const readApiJson = async <T,>(response: Response, unavailableMessage: string): Promise<T> => {
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(unavailableMessage);
  return (await response.json()) as T;
};

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
  return Boolean(normalized && !["—", "-", "ninguna", "ninguno", "none", "nenhuma", "nenhum", "no", "sin restricción", "sin restricciones", "no aplica", "n/a"].includes(normalized));
};

const guestHasRestriction = (guest: Guest) =>
  meaningfulGuestValue(guest.food) ||
  meaningfulGuestValue(guest.accessibilityNeeds) ||
  guest.companions.some((companion) => meaningfulGuestValue(companion.food));

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
    const { readSheet } = await import("read-excel-file/browser");
    return (await readSheet(file)).map((row: unknown[]) =>
      row.map((cell: unknown) => String(cell ?? "")),
    );
  }
  if (extension === "docx") {
    const { default: mammoth } = await import("mammoth/mammoth.browser");
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
  ["Invitación", "✦"],
  ["Invitados", "♙"],
  ["Restricciones", "◇"],
  ["Canciones", "♫"],
  ["Agradecimientos", "♡"],
  ["Mesas", "▦"],
  ["Check-in", "✓"],
  ["Álbum colaborativo", "▣"],
  ["Accesos", "♢"],
  ["Configuración", "⚙"],
];

const moduleForView: Record<string, AdminOrder["enabledModules"][number] | undefined> = {
  Invitación: "invitation",
  Invitados: "guests_rsvp",
  Restricciones: "guests_rsvp",
  Canciones: "invitation",
  Agradecimientos: "messaging",
  Mesas: "tables",
  "Check-in": "check_in",
  "Álbum colaborativo": "collaborative_album",
};

const upcomingViews = new Set(["Check-in", "Álbum colaborativo"]);

const builderTemplateIdForOrder = (modelName: string) => {
  const normalized = normalizedReference(modelName);
  return ["aurora", "astraea", "coruscant", "rosewood", "rivendell", "verona", "varezzia"]
    .find((templateId) => normalized.includes(templateId)) || "aurora";
};

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
  const readLoginResponse = async <T,>(response: Response): Promise<T> => {
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(
        t(
          "El servicio de acceso no está disponible. Intentá nuevamente en unos minutos.",
          "The access service is unavailable. Please try again in a few minutes.",
          "O serviço de acesso não está disponível. Tente novamente em alguns minutos.",
        ),
      );
    }
    return (await response.json()) as T;
  };
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
      const result = await readLoginResponse<{
        message?: string;
        error?: string;
      }>(response);
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
      const result = await readLoginResponse<{
        challengeId?: string;
        maskedEmail?: string;
        language?: "es" | "en" | "pt";
        error?: string;
      }>(response);
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
      const result = await readLoginResponse<{ error?: string }>(response);
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
            <div className="login-flow-links">
              <a href="/?concepto=plataforma">← {t("Volver al inicio", "Back to home", "Voltar ao início")}</a>
              <a href="/?demo=panel">{t("Ver la demostración", "View demo", "Ver demonstração")} →</a>
            </div>
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
  const pendingTasks = [
    { label: t("Invitaciones sin enviar", "Invitations not sent", "Convites não enviados"), count: guests.filter((guest) => guest.status === "Pendiente" && !guest.invitationSentAt).length, view: "Invitados" },
    { label: t("Respuestas pendientes", "Pending responses", "Respostas pendentes"), count: pending, view: "Invitados" },
    { label: t("Restricciones para revisar", "Dietary needs to review", "Restrições para revisar"), count: guests.filter(guestHasRestriction).length, view: "Restricciones" },
    { label: t("Preferencias de ubicación", "Seating preferences", "Preferências de lugares"), count: guests.filter((guest) => guest.socialTogetherWith || guest.socialSeparateFrom || guest.preferredTableName).length, view: "Mesas" },
  ];
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
      t("Seguimiento", "Tracking", "Acompanhamento"),
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
                    : ["Invitados", "Mesas", "Invitados"][
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

      <section className="panel pending-center">
        <div className="panel-title">
          <div><h2>{t("Centro de pendientes", "Action center", "Central de pendências")}</h2><p>{t("Lo importante del evento, ordenado para actuar.", "What needs attention, ready to act.", "O que precisa de atenção, pronto para agir.")}</p></div>
          <button onClick={() => onNavigate("Check-in")}>{t("Abrir check-in", "Open check-in", "Abrir check-in")} →</button>
        </div>
        <div className="pending-center-grid">
          {pendingTasks.map((task) => <button key={task.label} onClick={() => onNavigate(task.view)}><strong>{task.count}</strong><span>{task.label}</span><i>→</i></button>)}
        </div>
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
  const whatsappStatus = (value = "") =>
    (
      ({
        accepted: [adminStatus(language, "accepted"), "pending"],
        sent: [adminStatus(language, "sent"), "sent"],
        delivered: [adminStatus(language, "delivered"), "delivered"],
        read: [adminStatus(language, "read"), "read"],
        failed: [adminStatus(language, "failed"), "failed"],
        manual: [t("Preparado manualmente", "Prepared manually", "Preparado manualmente"), "pending"],
      }) as Record<string, [string, string]>
    )[value] || [t("Sin envío", "Not sent", "Não enviado"), "empty"];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState<"name" | "group" | "food" | "status">("name");
  const [selected, setSelected] = useState<string[]>([]);
  const [showBulkReminderReview, setShowBulkReminderReview] = useState(false);
  const [bulkReminderCursor, setBulkReminderCursor] = useState(0);
  const [bulkField, setBulkField] = useState<"status" | "group" | "socialCircle" | "invitedBy" | "guestType" | "transportOption" | "menuChoice" | "food" | "socialTogetherWith" | "socialSeparateFrom" | "preferredTableName">("invitedBy");
  const [bulkValue, setBulkValue] = useState(defaultInviter);
  const bulkAllowsEmpty = ["transportOption", "menuChoice", "food", "socialTogetherWith", "socialSeparateFrom", "preferredTableName"].includes(bulkField);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [importPreview, setImportPreview] = useState<GuestImportPreview | null>(null);
  const [importResult, setImportResult] = useState<GuestImportResult | null>(null);
  const [importMapping, setImportMapping] = useState<GuestImportMapping | null>(null);
  const [showAddGuests, setShowAddGuests] = useState(false);
  const [showPasteGuests, setShowPasteGuests] = useState(false);
  const [pastedGuests, setPastedGuests] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [inspectingGuest, setInspectingGuest] = useState<Guest | null>(null);
  const [detailsSocialCircle, setDetailsSocialCircle] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [whatsAppReviewGuest, setWhatsAppReviewGuest] = useState<Guest | null>(null);
  const [newGuestCode, setNewGuestCode] = useState(defaultPhoneCountryCode);
  const [newIdentificationType, setNewIdentificationType] = useState(
    suggestedIdentification(defaultPhoneCountryCode),
  );
  const [customGuestCode, setCustomGuestCode] = useState("");
  const [newCustomSocialCircle, setNewCustomSocialCircle] = useState(false);
  const [editCustomSocialCircle, setEditCustomSocialCircle] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<{
    defaultPhoneCountryCode: string;
    eventName: string;
    eventDate: string;
    reminderDaysBefore: number;
    automaticRemindersEnabled: boolean;
  } | null>(null);
  const [savingReminderSettings, setSavingReminderSettings] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!showModal) setNewCustomSocialCircle(false);
  }, [showModal]);
  useEffect(() => {
    if (!editingGuest) setEditCustomSocialCircle(false);
  }, [editingGuest]);
  useEffect(() => {
    setDetailsSocialCircle(inspectingGuest?.socialCircle || "");
  }, [inspectingGuest]);
  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const settings = await response.json() as NonNullable<typeof reminderSettings>;
      setReminderSettings(settings);
    }).catch(() => undefined);
  }, []);
  const activeGuests = guests.filter((guest) => !guest.archivedAt);
  const selectedGuests = activeGuests.filter((guest) => selected.includes(guest.id));
  const bulkReminderRecipients = selectedGuests.filter((guest) => guest.status === "Pendiente" && !guest.respondedAt && Boolean(guest.phone) && Boolean(guest.inviteToken));
  const bulkReminderExcluded = selectedGuests.filter((guest) => !bulkReminderRecipients.some((recipient) => recipient.id === guest.id));
  const archivedInvitations = guests.length - activeGuests.length;
  const confirmedPeople = confirmedPeopleTotal(activeGuests);
  const declinedInvitations = activeGuests.filter((guest) => guest.status === "No asiste").length;
  const hasGuestRestriction = guestHasRestriction;
  const defaultGuestSocialCircles = [
    "Amigos",
    "Facultad",
    "Trabajo",
    "Colegio",
    "Familia",
    "Club",
  ];
  const customGuestSocialCircles = [...new Set(guests.map((guest) => guest.socialCircle.trim()).filter((circle) => circle && !defaultGuestSocialCircles.includes(circle)))]
    .sort((left, right) => left.localeCompare(right, language, { sensitivity: "base" }));
  const guestSocialCircleOptions = [...defaultGuestSocialCircles, ...customGuestSocialCircles];
  const unsentInvitations = activeGuests.filter(
    (guest) => guest.status === "Pendiente" && !guest.invitationSentAt,
  ).length;
  const sentPendingInvitations = activeGuests.filter(
    (guest) => guest.status === "Pendiente" && Boolean(guest.invitationSentAt),
  ).length;
  const openedPendingInvitations = activeGuests.filter(
    (guest) => guest.status === "Pendiente" && Boolean(guest.invitationOpenedAt),
  ).length;
  const remindersDue = activeGuests.filter(
    (guest) => guest.status === "Pendiente" && Boolean(guest.invitationSentAt) && !guest.reminded,
  ).length;
  const filtered = guests
    .filter((guest) => {
      const matches = `${guest.name} ${guest.group} ${guest.socialCircle}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesView =
        filter === "Todos" ||
        filter === "Archivados" ||
        filter === "Logística" ||
        filter === "Sin enviar" ||
        filter === "Enviadas pendientes" ||
        filter === "Vistas pendientes" ||
        filter === "Necesitan recordatorio" ||
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
            : filter === "Vistas pendientes"
              ? guest.status === "Pendiente" && Boolean(guest.invitationOpenedAt)
            : filter === "Necesitan recordatorio"
              ? guest.status === "Pendiente" && Boolean(guest.invitationSentAt) && !guest.reminded
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

  const saveReminderSettings = async () => {
    if (!reminderSettings) return;
    setSavingReminderSettings(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderSettings),
      });
      const result = await readApiJson<NonNullable<typeof reminderSettings> & { error?: string }>(response, t("La configuración de recordatorios no está disponible.", "Reminder settings are unavailable.", "A configuração de lembretes não está disponível."));
      if (!response.ok || !result.eventName) throw new Error(result.error || t("No pudimos guardar los recordatorios.", "We couldn't save reminder settings.", "Não foi possível salvar os lembretes."));
      setReminderSettings(result);
      setNotice(result.automaticRemindersEnabled
        ? t("Recordatorio automático activado.", "Automatic reminder enabled.", "Lembrete automático ativado.")
        : t("Recordatorio automático desactivado.", "Automatic reminder disabled.", "Lembrete automático desativado."));
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : t("No pudimos guardar los recordatorios.", "We couldn't save reminder settings.", "Não foi possível salvar os lembretes."));
    } finally {
      setSavingReminderSettings(false);
    }
  };

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
      const result = await readApiJson<{
        guest?: Guest;
        error?: string;
      }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guest)
        throw new Error(result.error || "No pudimos guardar el invitado.");
      setGuests((current) => [...current, result.guest!]);
      setShowModal(false);
      setNotice(t("Invitado agregado correctamente.", "Guest added successfully.", "Convidado adicionado corretamente."));
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
      const result = await readApiJson<{ guests?: Guest[]; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guests)
        throw new Error(result.error || (archived ? "No pudimos archivar la selección." : "No pudimos restaurar la selección."));
      const archivedGuests = new Map(result.guests.map((guest) => [guest.id, guest]));
      setGuests((current) => current.map((guest) => archivedGuests.get(guest.id) || guest));
      setSelected([]);
      setNotice(archived ? t("Selección archivada. Podés restaurarla desde Archivados.", "Selection archived. You can restore it from Archived.", "Seleção arquivada. Você pode restaurá-la em Arquivados.") : t("Selección restaurada.", "Selection restored.", "Seleção restaurada."));
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
    if (!selected.length || (!bulkAllowsEmpty && !bulkValue.trim())) return;
    if (selected.length >= 25 && !window.confirm(t(
      `¿Aplicar este cambio a ${selected.length} invitados?`,
      `Apply this change to ${selected.length} guests?`,
      `Aplicar esta alteração a ${selected.length} convidados?`,
    ))) return;
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
      const result = await readApiJson<{ guests?: Guest[]; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
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
    setUpdatingId(guest.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: archived ? "archive" : "restore", id: guest.id }),
      });
      const result = await readApiJson<{ guest?: Guest; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guest)
        throw new Error(result.error || "No pudimos actualizar el archivo.");
      setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
      setNotice(archived ? t("Invitado archivado. Podés restaurarlo cuando quieras.", "Guest archived. You can restore them anytime.", "Convidado arquivado. Você pode restaurá-lo quando quiser.") : t("Invitado restaurado.", "Guest restored.", "Convidado restaurado."));
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "No pudimos actualizar el archivo.");
    } finally {
      setUpdatingId("");
    }
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
      const result = await readApiJson<{
        guest?: Guest;
        error?: string;
      }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
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
          socialCircle: data.get("socialCircle"),
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
      const result = await readApiJson<{
        guest?: Guest;
        error?: string;
      }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guest)
        throw new Error(result.error || "No pudimos guardar los datos.");
      setGuests((current) =>
        current.map((item) =>
          item.id === editingGuest.id ? result.guest! : item,
        ),
      );
      setEditingGuest(null);
      setNotice(t("Datos del invitado actualizados.", "Guest details updated.", "Dados do convidado atualizados."));
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

  const updateSocialCircleFromDetails = async () => {
    if (!inspectingGuest) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inspectingGuest.id,
          status: inspectingGuest.status,
          confirmed: inspectingGuest.confirmed,
          food: inspectingGuest.food,
          song: inspectingGuest.song,
          socialCircle: detailsSocialCircle,
        }),
      });
      const result = await readApiJson<{ guest?: Guest; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guest) throw new Error(result.error || t("No pudimos guardar el círculo social.", "Could not save the social circle.", "Não foi possível salvar o círculo social."));
      setGuests((current) => current.map((guest) => guest.id === inspectingGuest.id ? result.guest! : guest));
      setInspectingGuest(result.guest);
      setNotice(t("Círculo social actualizado.", "Social circle updated.", "Círculo social atualizado."));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : t("No pudimos guardar el círculo social.", "Could not save the social circle.", "Não foi possível salvar o círculo social."));
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

  const whatsappInviteContent = (guest: Guest) => {
    const target = invitationUrl || `${window.location.origin}/confirmar`;
    const separator = target.includes("?") ? "&" : "?";
    const link = `${target}${separator}token=${guest.inviteToken}`;
    const message = guest.invitationOpenedAt
      ? t(
          `Hola ${guest.name}. Vimos que ya pudiste ver la invitación de ${defaultInviter}. Cuando tengas un momento, ¿podés confirmar tu asistencia acá? ${link}`,
          `Hi ${guest.name}. We saw that you viewed ${defaultInviter}'s invitation. When you have a moment, could you RSVP here? ${link}`,
          `Olá ${guest.name}. Vimos que você abriu o convite de ${defaultInviter}. Quando puder, confirme sua presença aqui: ${link}`,
        )
      : guest.invitationSentAt
        ? t(
            `Hola ${guest.name}. Te reenviamos la invitación de ${defaultInviter} para que tengas a mano todos los detalles y puedas confirmar: ${link}`,
            `Hi ${guest.name}. We're resending ${defaultInviter}'s invitation so you have the details and can RSVP: ${link}`,
            `Olá ${guest.name}. Estamos reenviando o convite de ${defaultInviter} para você consultar os detalhes e confirmar: ${link}`,
          )
        : t(
            `Hola ${guest.name}, queremos invitarte a ${defaultInviter}. Encontrás todos los detalles y la confirmación acá: ${link}`,
            `Hi ${guest.name}, we'd love to invite you to ${defaultInviter}. Details and RSVP: ${link}`,
            `Olá ${guest.name}, queremos convidar você para ${defaultInviter}. Detalhes e confirmação: ${link}`,
          );
    return { link, message };
  };

  const openWhatsAppInvite = (guest: Guest) => {
    if (!guest.inviteToken)
      return setError("Falta el enlace personalizado del invitado.");
    const { message } = whatsappInviteContent(guest);
    const phone = guest.phone.replace(/\D/g, "");
    const popup = window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    if (!popup) {
      setError(t(
        "El navegador bloqueó WhatsApp. Habilitá las ventanas emergentes e intentá nuevamente.",
        "The browser blocked WhatsApp. Allow pop-ups and try again.",
        "O navegador bloqueou o WhatsApp. Permita pop-ups e tente novamente.",
      ));
      return;
    }
    popup.opener = null;
    setUpdatingId(guest.id);
    setNotice(t(
      `WhatsApp quedó abierto para ${guest.name}. Registrando el mensaje como preparado…`,
      `WhatsApp is open for ${guest.name}. Recording the message as prepared…`,
      `O WhatsApp foi aberto para ${guest.name}. Registrando a mensagem como preparada…`,
    ));
    void fetch("/api/admin/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark-whatsapp-prepared",
        id: guest.id,
        channel: "whatsapp",
        kind: guest.invitationSentAt ? "reminder" : "invitation",
      }),
    })
      .then(async (response) => {
        const result = await readApiJson<{ guest?: Guest; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
        if (!response.ok || !result.guest)
          throw new Error(result.error || "No pudimos registrar el envío.");
        setGuests((current) =>
          current.map((item) => (item.id === guest.id ? result.guest! : item)),
        );
        setNotice(t("WhatsApp registrado como preparado.", "WhatsApp recorded as prepared.", "WhatsApp registrado como preparado."));
      })
      .catch((sendError) =>
        setError(
          sendError instanceof Error
            ? sendError.message
            : "No pudimos registrar el envío.",
        ),
      )
      .finally(() => setUpdatingId(""));
  };

  const downloadTemplate = () =>
    exportCsv(
      "plantilla-invitados.csv",
      [
        t("Nombre", "Name", "Nome"),
        t("Grupo de invitación", "Invitation group", "Grupo do convite"),
        t("Círculo social", "Social circle", "Círculo social"),
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
          "Familia",
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
        t("Grupo de invitación", "Invitation group", "Grupo do convite"),
        t("Círculo social", "Social circle", "Círculo social"),
        t("Estado", "Status", "Status"),
        t("Cupos", "Seats", "Vagas"),
        t("Personas confirmadas", "Confirmed people", "Pessoas confirmadas"),
        "WhatsApp",
        "Email",
        t("Restricción", "Dietary need", "Restrição"),
        t("WhatsApp preparado", "WhatsApp prepared", "WhatsApp preparado"),
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
        guest.socialCircle,
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

  const buildGuestImportPreview = (fileName: string, rows: string[][], mappedColumns?: Record<string, number>) => {
      const normalize = (value: string) =>
        value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
      const headers = rows[0].map((header: string) => normalize(header));
      const column = (field: string, ...names: string[]) =>
        mappedColumns ? (mappedColumns[field] ?? -1) : headers.findIndex((header) => names.includes(header));
      const nameIndex = column("name", "nombre", "invitado", "nombre y apellido");
      if (nameIndex < 0) throw new Error(t("Indicá qué columna contiene el nombre.", "Choose the column containing the name.", "Indique qual coluna contém o nome."));
      const groupIndex = column("group", "grupo", "grupo de invitacion", "grupo invitacion", "familia");
      const socialCircleIndex = column("socialCircle", "circulo", "circulo social");
      const phoneIndex = column("phone", "whatsapp", "telefono", "celular");
      const codeIndex = column("phoneCountryCode", "codigo pais", "codigo de pais", "pais", "caracteristica");
      const seatsIndex = column("seats", "cupos", "personas", "cantidad");
      const emailIndex = column("email", "email", "correo");
      const identificationTypeIndex = column("identificationType", "tipo identificacion", "tipo de identificacion", "documento");
      const identificationNumberIndex = column("identificationNumber", "identificacion", "numero identificacion", "numero de identificacion");
      const foodIndex = column("food", "restriccion", "restricciones", "alimentacion", "dieta");
      const invitedByIndex = column("invitedBy", "invitado por", "invita", "responsable");
      const companionOfIndex = column("companionOf", "acompanante de", "invitado principal");
      const names = new Map(guests.map((guest) => [normalize(guest.name), guest.id]));
      const imported: GuestImportDraft[] = rows.slice(1).map((values: string[]) => ({
        name: values[nameIndex], group: groupIndex >= 0 ? values[groupIndex] : "",
        socialCircle: socialCircleIndex >= 0 ? values[socialCircleIndex] : "",
        phone: phoneIndex >= 0 ? values[phoneIndex] : "",
        phoneCountryCode: codeIndex >= 0 && values[codeIndex] ? values[codeIndex] : defaultPhoneCountryCode,
        seats: seatsIndex >= 0 ? values[seatsIndex] : "1", email: emailIndex >= 0 ? values[emailIndex] : "",
        identificationType: identificationTypeIndex >= 0 && values[identificationTypeIndex] ? values[identificationTypeIndex] : "",
        identificationNumber: identificationNumberIndex >= 0 ? values[identificationNumberIndex] : "",
        food: foodIndex >= 0 ? values[foodIndex] : "", invitedBy: invitedByIndex >= 0 && values[invitedByIndex] ? values[invitedByIndex] : defaultInviter,
        companionOfId: companionOfIndex >= 0 && values[companionOfIndex] ? names.get(normalize(values[companionOfIndex])) || "" : "",
      })).filter((guest) => guest.name);
      if (!imported.length) throw new Error(t("No encontramos filas con nombre.", "We found no rows with a name.", "Não encontramos linhas com nome."));
      const existingNames = new Set(guests.map((guest) => normalize(`${guest.name}|${guest.group}`)));
      const existingPhones = new Set(guests.map((guest) => guest.phone.replace(/\D/g, "")).filter(Boolean));
      const existingEmails = new Set(guests.map((guest) => guest.email.trim().toLowerCase()).filter(Boolean));
      const seenNames = new Set<string>(); const seenPhones = new Set<string>(); const seenEmails = new Set<string>();
      const previewRows = imported.map((guest) => {
        const nameKey = normalize(`${guest.name}|${guest.group}`); const phoneKey = `${guest.phoneCountryCode}${guest.phone}`.replace(/\D/g, ""); const emailKey = guest.email.trim().toLowerCase();
        const duplicate = existingPhones.has(phoneKey) && phoneKey ? t("WhatsApp ya registrado", "WhatsApp already exists", "WhatsApp já cadastrado") : existingEmails.has(emailKey) && emailKey ? t("Email ya registrado", "Email already exists", "Email já cadastrado") : existingNames.has(nameKey) || seenNames.has(nameKey) ? t("Nombre y grupo repetidos", "Duplicate name and group", "Nome e grupo repetidos") : seenPhones.has(phoneKey) && phoneKey ? t("WhatsApp repetido en el archivo", "Duplicate WhatsApp in file", "WhatsApp repetido no arquivo") : seenEmails.has(emailKey) && emailKey ? t("Email repetido en el archivo", "Duplicate email in file", "Email repetido no arquivo") : "";
        const errors: string[] = []; if (!/^\+\d{1,4}$/.test(guest.phoneCountryCode)) errors.push(t("Código de país inválido", "Invalid country code", "Código de país inválido"));
        const seats = Number(guest.seats); if (!Number.isInteger(seats) || seats < 1 || seats > 20) errors.push(t("Cupos fuera de rango", "Seats out of range", "Vagas fora do limite"));
        seenNames.add(nameKey); if (phoneKey) seenPhones.add(phoneKey); if (emailKey) seenEmails.add(emailKey); return { guest, duplicate, errors };
      });
      if (mappedColumns && typeof window !== "undefined") {
        const rememberedHeaders = Object.fromEntries(
          Object.entries(mappedColumns)
            .filter(([, index]) => index >= 0 && rows[0][index])
            .map(([field, index]) => [field, normalize(rows[0][index])]),
        );
        window.localStorage.setItem("syd-guest-import-mapping-v1", JSON.stringify(rememberedHeaders));
      }
      setImportPreview({ fileName, rows: previewRows }); setImportMapping(null); setShowAddGuests(false); setShowPasteGuests(false); setNotice("");
  };

  const previewGuestFile = async (file: File) => {
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
      const detected: Record<string, number> = { name: nameIndex };
      const aliases: Record<string, string[]> = { group: ["grupo", "grupo de invitacion", "grupo invitacion", "familia"], socialCircle: ["circulo", "circulo social"], phone: ["whatsapp", "telefono", "celular"], phoneCountryCode: ["codigo pais", "codigo de pais", "pais", "caracteristica"], seats: ["cupos", "personas", "cantidad"], email: ["email", "correo"], identificationType: ["tipo identificacion", "tipo de identificacion", "documento"], identificationNumber: ["identificacion", "numero identificacion", "numero de identificacion"], food: ["restriccion", "restricciones", "alimentacion", "dieta"], invitedBy: ["invitado por", "invita", "responsable"], companionOf: ["acompanante de", "invitado principal"] };
      Object.entries(aliases).forEach(([field, names]) => { detected[field] = column(...names); });
      try {
        const remembered = JSON.parse(window.localStorage.getItem("syd-guest-import-mapping-v1") || "{}") as Record<string, string>;
        Object.entries(remembered).forEach(([field, header]) => {
          const rememberedIndex = headers.indexOf(header);
          if (rememberedIndex >= 0) detected[field] = rememberedIndex;
        });
      } catch {
        // Una preferencia dañada no debe bloquear una nueva importación.
      }
      setImportMapping({ fileName: file.name, rows, columns: detected });
      setShowAddGuests(false);
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

  const importGuests = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await previewGuestFile(file);
  };

  const previewPastedGuests = async () => {
    const lines = pastedGuests.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) {
      setError(t("Pegá al menos un invitado.", "Paste at least one guest.", "Cole pelo menos um convidado."));
      return;
    }
    const escaped = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = lines.map((line) => {
      const cells = line.includes("\t") ? line.split("\t") : line.split(",");
      return [cells[0] || "", cells[1] || "", cells[2] || ""].map((cell) => escaped(cell.trim())).join(",");
    });
    const file = new File(
      [[ ["Nombre", "WhatsApp", "Grupo"].map(escaped).join(","), ...rows ].join("\n")],
      t("lista-pegada.csv", "pasted-list.csv", "lista-colada.csv"),
      { type: "text/csv" },
    );
    await previewGuestFile(file);
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
      setImportResult({
        fileName: importPreview.fileName,
        imported: result.guests.length,
        omittedDuplicates: importPreview.rows.filter((row) => row.duplicate).length,
        omittedErrors: importPreview.rows.filter((row) => row.errors.length > 0).length,
        importedIds: result.guests.map((guest) => guest.id),
      });
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

  const undoLastGuestImport = async () => {
    if (!importResult?.importedIds.length) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-archive", ids: importResult.importedIds }),
      });
      const result = await readApiJson<{ guests?: Guest[]; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guests) throw new Error(result.error || t("No pudimos deshacer la importación.", "We could not undo the import.", "Não foi possível desfazer a importação."));
      const archived = new Map(result.guests.map((guest) => [guest.id, guest]));
      setGuests((current) => current.map((guest) => archived.get(guest.id) || guest));
      setImportResult(null);
      setNotice(t("Importación deshecha. Los invitados quedaron en Archivados y podés restaurarlos.", "Import undone. Guests were moved to Archived and can be restored.", "Importação desfeita. Os convidados foram movidos para Arquivados e podem ser restaurados."));
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : t("No pudimos deshacer la importación.", "We could not undo the import.", "Não foi possível desfazer a importação."));
    } finally {
      setSaving(false);
    }
  };

  const updateImportPreviewGuest = (
    index: number,
    field: "name" | "group" | "phone" | "seats",
    value: string,
  ) => {
    setImportPreview((current) => {
      if (!current) return current;
      const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
      const drafts = current.rows.map((row, rowIndex) => ({
        ...row.guest,
        ...(rowIndex === index ? { [field]: value } : {}),
      }));
      const existingNames = new Set(guests.map((guest) => normalize(`${guest.name}|${guest.group}`)));
      const existingPhones = new Set(guests.map((guest) => guest.phone.replace(/\D/g, "")).filter(Boolean));
      const existingEmails = new Set(guests.map((guest) => guest.email.trim().toLowerCase()).filter(Boolean));
      const seenNames = new Set<string>();
      const seenPhones = new Set<string>();
      const seenEmails = new Set<string>();
      const rows = drafts.map((guest) => {
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
        if (!guest.name.trim()) errors.push(t("Falta el nombre", "Name is required", "Falta o nome"));
        if (!/^\+\d{1,4}$/.test(guest.phoneCountryCode)) errors.push(t("Código de país inválido", "Invalid country code", "Código de país inválido"));
        const seats = Number(guest.seats);
        if (!Number.isInteger(seats) || seats < 1 || seats > 20) errors.push(t("Cupos fuera de rango", "Seats out of range", "Vagas fora do limite"));
        seenNames.add(nameKey);
        if (phoneKey) seenPhones.add(phoneKey);
        if (emailKey) seenEmails.add(emailKey);
        return { guest, duplicate, errors };
      });
      return { ...current, rows };
    });
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
          <button
            className="help-circle context-tip"
            type="button"
            data-help={t(
              "Cada registro representa una invitación. Los cupos indican cuántas personas pueden confirmar con el mismo enlace.",
              "Each record represents an invitation. Seats indicate how many people can RSVP through the same link.",
              "Cada registro representa um convite. As vagas indicam quantas pessoas podem confirmar pelo mesmo link.",
            )}
            aria-label={t("Ayuda sobre invitados", "Guest help", "Ajuda sobre convidados")}
          >?</button>
          <button className="outline-button" onClick={exportGuestReport}>
            ⇩ {t("Exportar lista", "Export list", "Exportar lista")}
          </button>
          {canEdit && (
            <button
              className="primary-button small"
              onClick={() => setShowAddGuests(true)}
            >
              ＋ {t("Agregar invitados", "Add guests", "Adicionar convidados")}
            </button>
          )}
        </div>
      </div>
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
        <button className={`${filter === "Sin enviar" ? "active " : ""}${unsentInvitations ? "needs-attention" : ""}`} onClick={() => setFilter("Sin enviar")}>
          <span>{t("Sin enviar", "Not sent", "Não enviados")}</span>
          <strong>{unsentInvitations}</strong>
          <small>{t("primer contacto pendiente", "awaiting first contact", "primeiro contato pendente")}</small>
        </button>
        <button className={filter === "Enviadas pendientes" ? "active" : ""} onClick={() => setFilter("Enviadas pendientes")}>
          <span>{t("Preparadas", "Prepared", "Preparados")}</span>
          <strong>{sentPendingInvitations}</strong>
          <small>{t("WhatsApp abierto desde el panel", "WhatsApp opened from the panel", "WhatsApp aberto pelo painel")}</small>
        </button>
        <button className={`${filter === "Vistas pendientes" ? "active " : ""}${openedPendingInvitations ? "needs-attention" : ""}`} onClick={() => setFilter("Vistas pendientes")}>
          <span>{t("Vistas", "Opened", "Visualizados")}</span>
          <strong>{openedPendingInvitations}</strong>
          <small>{t("abrieron y aún no respondieron", "opened, no response yet", "abriram e ainda não responderam")}</small>
        </button>
        <button className={filter === "No asiste" ? "active" : ""} onClick={() => setFilter("No asiste")}>
          <span>{t("No asisten", "Declined", "Não comparecem")}</span>
          <strong>{declinedInvitations}</strong>
          <small>{t("invitaciones", "invitations", "convites")}</small>
        </button>
      </section>
      {reminderSettings && (
        <section className={`guest-reminder-schedule ${reminderSettings.automaticRemindersEnabled ? "is-enabled" : ""}`} aria-label={t("Recordatorios programados", "Scheduled reminders", "Lembretes programados")}>
          <div>
            <span className="guest-reminder-schedule-icon" aria-hidden="true">◷</span>
            <p>
              <strong>{t("Recordatorio automático por email", "Automatic email reminder", "Lembrete automático por email")}</strong>
              <small>{reminderSettings.eventDate
                ? t(`Se enviará una vez a quienes sigan pendientes, ${reminderSettings.reminderDaysBefore} días antes del evento.`, `It will be sent once to guests still pending, ${reminderSettings.reminderDaysBefore} days before the event.`, `Será enviado uma vez a quem continuar pendente, ${reminderSettings.reminderDaysBefore} dias antes do evento.`)
                : t("Agregá la fecha del evento en Configuración para poder programarlo.", "Add the event date in Settings to schedule it.", "Adicione a data do evento em Configurações para programá-lo.")}</small>
            </p>
          </div>
          {canEdit && <div className="guest-reminder-schedule-controls">
            <label>
              <span>{t("Días antes", "Days before", "Dias antes")}</span>
              <input type="number" min="1" max="60" value={reminderSettings.reminderDaysBefore} disabled={!reminderSettings.automaticRemindersEnabled || savingReminderSettings} onChange={(event) => setReminderSettings((current) => current ? { ...current, reminderDaysBefore: Math.max(1, Math.min(60, Number(event.target.value) || 1)) } : current)} />
            </label>
            <label className="guest-reminder-toggle">
              <input type="checkbox" checked={reminderSettings.automaticRemindersEnabled} disabled={!reminderSettings.eventDate || savingReminderSettings} onChange={(event) => setReminderSettings((current) => current ? { ...current, automaticRemindersEnabled: event.target.checked } : current)} />
              <span>{reminderSettings.automaticRemindersEnabled ? t("Activado", "Enabled", "Ativado") : t("Desactivado", "Disabled", "Desativado")}</span>
            </label>
            <button className="outline-button compact" type="button" disabled={savingReminderSettings || !reminderSettings.eventDate} onClick={() => void saveReminderSettings()}>{savingReminderSettings ? t("Guardando…", "Saving…", "Salvando…") : t("Guardar", "Save", "Salvar")}</button>
          </div>}
          <button type="button" className={`guest-reminder-due ${filter === "Necesitan recordatorio" ? "active" : ""}`} onClick={() => setFilter("Necesitan recordatorio")}>
            <strong>{remindersDue}</strong>
            <span>{t("necesitan recordatorio", "need a reminder", "precisam de lembrete")}</span>
          </button>
        </section>
      )}
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
            {["Todos", "Sin enviar", "Enviadas pendientes", "Vistas pendientes", "Necesitan recordatorio", "Confirmado", "Pendiente", "No asiste", "Respondieron", "Restricciones", "Logística", "Archivados"].map((item) => (
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
                      ? t("Preparadas, sin respuesta", "Prepared, no response", "Preparados, sem resposta")
                    : item === "Vistas pendientes"
                      ? t("Vistas, sin respuesta", "Opened, no response", "Visualizados, sem resposta")
                    : item === "Necesitan recordatorio"
                      ? t("Necesitan recordatorio", "Need a reminder", "Precisam de lembrete")
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
                onClick={() => setShowAddGuests(true)}
              >
                {saving
                  ? t("Importando…", "Importing…", "Importando…")
                  : `＋ ${t("Agregar invitados", "Add guests", "Adicionar convidados")}`}
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
                setBulkValue(field === "status" ? "Pendiente" : field === "guestType" ? "adult" : field === "transportOption" ? "" : field === "invitedBy" ? defaultInviter : "");
              }}
              aria-label={t("Campo a editar", "Field to edit", "Campo para editar")}
            >
              <option value="invitedBy">{t("Invitador", "Invited by", "Anfitrião")}</option>
              <option value="status">{t("Estado", "Status", "Status")}</option>
              <option value="guestType">{t("Categoría de edad", "Age category", "Categoria etária")}</option>
              <option value="group">{t("Grupo de invitación", "Invitation group", "Grupo do convite")}</option>
              <option value="socialCircle">{t("Círculo social", "Social circle", "Círculo social")}</option>
              <option value="transportOption">{t("Transporte", "Transport", "Transporte")}</option>
              <option value="menuChoice">{t("Preferencia de menú", "Menu preference", "Preferência de menu")}</option>
              <option value="food">{t("Restricción alimentaria", "Dietary need", "Restrição alimentar")}</option>
              <option value="socialTogetherWith">{t("Sentar junto a", "Seat together with", "Sentar junto com")}</option>
              <option value="socialSeparateFrom">{t("Mantener separado de", "Keep separate from", "Manter separado de")}</option>
              <option value="preferredTableName">{t("Mesa preferida", "Preferred table", "Mesa preferida")}</option>
            </select>}
            {filter !== "Archivados" && (bulkField === "status" ? (
              <select value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}>
                <option value="Pendiente">{adminStatus(language, "Pendiente")}</option>
                <option value="Confirmado">{adminStatus(language, "Confirmado")}</option>
                <option value="No asiste">{adminStatus(language, "No asiste")}</option>
              </select>
            ) : bulkField === "guestType" ? (
              <select value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}>
                <option value="adult">{t("Adultos", "Adults", "Adultos")}</option>
                <option value="teen">{t("Adolescentes", "Teenagers", "Adolescentes")}</option>
                <option value="child">{t("Niños", "Children", "Crianças")}</option>
              </select>
            ) : bulkField === "transportOption" ? (
              <select value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}>
                <option value="">{t("No necesita", "Not needed", "Não precisa")}</option>
                <option value="Ida">{t("Ida", "Outbound", "Ida")}</option>
                <option value="Regreso">{t("Regreso", "Return", "Volta")}</option>
                <option value="Ida y regreso">{t("Ida y regreso", "Outbound and return", "Ida e volta")}</option>
              </select>
            ) : (
              <input
                value={bulkValue}
                onChange={(event) => setBulkValue(event.target.value)}
                list={["socialTogetherWith", "socialSeparateFrom"].includes(bulkField) ? "bulk-social-references" : undefined}
                placeholder={bulkField === "group" ? t("Ej. Familia de ella, amigos del colegio…", "E.g. Her family, school friends…", "Ex. Família dela, amigos da escola…") : bulkField === "invitedBy" ? t("Nombre del invitador", "Host name", "Nome do anfitrião") : t("Valor para toda la selección", "Value for the selection", "Valor para toda a seleção")}
              />
            ))}
            <datalist id="bulk-social-references">{[...new Set(guests.flatMap((guest) => [guest.name, guest.group, guest.socialCircle]).filter(Boolean))].map((value) => <option key={value} value={value} />)}</datalist>
            {filter !== "Archivados" && <button className="primary-button small" type="button" disabled={saving || (!bulkAllowsEmpty && !bulkValue.trim())} onClick={updateSelected}>
              {t("Aplicar", "Apply", "Aplicar")}
            </button>}
            {filter !== "Archivados" && <button className="outline-button compact" type="button" disabled={saving} onClick={() => { setBulkReminderCursor(0); setShowBulkReminderReview(true); }}>
              {t("Recordar respuestas", "Remind responses", "Lembrar respostas")}
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
        {canEdit && filter !== "Archivados" && filtered.length > 0 && (
          <div className="guest-selection-shortcuts" aria-label={t("Selección rápida para seguimiento", "Quick tracking selection", "Seleção rápida para acompanhamento")}>
            <span>{t("Seleccionar para actuar", "Select for action", "Selecionar para agir")}</span>
            <button type="button" onClick={() => setSelected(filtered.filter((guest) => guest.status === "Pendiente" && !guest.invitationSentAt).map((guest) => guest.id))}>
              {t("Sin enviar", "Not sent", "Não enviados")} · {filtered.filter((guest) => guest.status === "Pendiente" && !guest.invitationSentAt).length}
            </button>
            <button type="button" onClick={() => setSelected(filtered.filter((guest) => guest.status === "Pendiente" && Boolean(guest.invitationSentAt) && !guest.invitationOpenedAt).map((guest) => guest.id))}>
              {t("Preparadas", "Prepared", "Preparados")} · {filtered.filter((guest) => guest.status === "Pendiente" && Boolean(guest.invitationSentAt) && !guest.invitationOpenedAt).length}
            </button>
            <button type="button" onClick={() => setSelected(filtered.filter((guest) => guest.status === "Pendiente" && Boolean(guest.invitationOpenedAt)).map((guest) => guest.id))}>
              {t("Vistas sin respuesta", "Viewed, no response", "Vistos sem resposta")} · {filtered.filter((guest) => guest.status === "Pendiente" && Boolean(guest.invitationOpenedAt)).length}
            </button>
          </div>
        )}
        <div className="table-scroll">
          <table className="guests-table">
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
                <th className="guest-person-column">{t("Invitado", "Guest", "Convidado")}</th>
                <th className="guest-group-column">{t("Grupo", "Group", "Grupo")}</th>
                <th className="guest-circle-column">{t("Círculo", "Circle", "Círculo")}</th>
                <th className="guest-seats-column">{t("Asistencia", "Attendance", "Presença")}</th>
                <th className="guest-status-column">{t("Estado", "Status", "Status")}</th>
                <th className="guest-secondary-column guest-follow-up-column">{t("Seguimiento", "Tracking", "Acompanhamento")}</th>
                <th className="guest-actions-column">{t("Acciones", "Actions", "Ações")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="guest-empty-row">
                  <td colSpan={canEdit ? 8 : 7}>
                    <div className="guest-empty-state">
                      <span aria-hidden="true">♙</span>
                      <strong>{activeGuests.length === 0
                        ? t("Todavía no agregaste invitados", "You haven't added guests yet", "Você ainda não adicionou convidados")
                        : t("No encontramos invitados con estos filtros", "No guests match these filters", "Nenhum convidado corresponde a estes filtros")}</strong>
                      <p>{activeGuests.length === 0
                        ? t("Empezá pegando una lista o cargando una invitación manualmente.", "Start by pasting a list or entering one invitation manually.", "Comece colando uma lista ou cadastrando um convite manualmente.")
                        : t("Probá otra búsqueda o volvé a mostrar la lista completa.", "Try another search or return to the full list.", "Tente outra busca ou volte para a lista completa.")}</p>
                      {canEdit && activeGuests.length === 0
                        ? <button className="primary-button small" type="button" onClick={() => setShowAddGuests(true)}>＋ {t("Agregar invitados", "Add guests", "Adicionar convidados")}</button>
                        : <button className="outline-button compact" type="button" onClick={() => { setQuery(""); setFilter("Todos"); }}>{t("Limpiar filtros", "Clear filters", "Limpar filtros")}</button>}
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((guest) => (
                <tr key={guest.id}>
                  {canEdit && (
                    <td className="checkbox-cell guest-select-column">
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
                  <td className="guest-person-column" data-label={t("Invitado", "Guest", "Convidado")}>
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
                  <td className="guest-group-column" data-label={t("Grupo de invitación", "Invitation group", "Grupo do convite")}><span className="guest-group-cell"><strong>{guest.group || "—"}</strong><small>{t("Una invitación compartida", "One shared invitation", "Um convite compartilhado")}</small></span></td>
                  <td className="guest-circle-column" data-label={t("Círculo social", "Social circle", "Círculo social")}><span className="guest-circle-cell">{guest.socialCircle || <em>{t("Sin asignar", "Unassigned", "Não atribuído")}</em>}</span></td>
                  <td className="guest-seats-column" data-label={t("Confirmados / cupos", "Confirmed / seats", "Confirmados / vagas")}>{(() => { const progress = seatProgress(guest, guests); return <span className="seat-progress"><strong>{progress.used}/{progress.total}</strong><small>{t("confirmados / cupos", "confirmed / seats", "confirmados / vagas")}</small></span>; })()}</td>
                  <td className="guest-status-column" data-label={t("Estado", "Status", "Status")}>
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
                  <td className="guest-secondary-column guest-follow-up-column" data-label={t("Seguimiento", "Tracking", "Acompanhamento")}>
                    <div className="guest-follow-up"><span className={`delivery-status guest-delivery-status ${guest.whatsappStatus ? `is-${whatsappStatus(guest.whatsappStatus)[1]}` : guest.respondedAt ? "responded" : guest.invitationOpenedAt ? "opened" : guest.invitationSentAt ? "sent" : "unsent"}`}>
                      <strong>{guest.whatsappStatus
                        ? whatsappStatus(guest.whatsappStatus)[0]
                        : guest.respondedAt
                        ? t("Respondió", "Responded", "Respondeu")
                        : guest.invitationOpenedAt
                          ? t("Abrió", "Opened", "Abriu")
                          : guest.invitationSentAt
                            ? t("Preparada", "Prepared", "Preparado")
                            : t("Sin enviar", "Not sent", "Não enviado")}</strong>
                      {(guest.whatsappStatusAt || guest.respondedAt || guest.invitationOpenedAt || guest.invitationSentAt) && <small>{reportDate(guest.whatsappStatusAt || guest.respondedAt || guest.invitationOpenedAt || guest.invitationSentAt || "", language)}</small>}
                      {guest.whatsappStatus === "failed" && <small className="guest-delivery-error">{t("Meta no pudo entregar el mensaje", "Meta could not deliver the message", "A Meta não conseguiu entregar a mensagem")}</small>}
                      {guest.status === "Pendiente" && guest.reminded && <small className="guest-last-reminder">{t("Último recordatorio", "Last reminder", "Último lembrete")} · {reportDate(guest.reminded, language)}</small>}
                    </span>{guest.status === "Pendiente" && <button type="button" disabled={!guest.phone || updatingId === guest.id} onClick={() => setWhatsAppReviewGuest(guest)}>{!guest.phone ? t("Falta WhatsApp", "WhatsApp missing", "Falta WhatsApp") : guest.invitationOpenedAt ? t("Recordar respuesta", "Remind to respond", "Lembrar resposta") : guest.invitationSentAt ? t("Reenviar invitación", "Resend invitation", "Reenviar convite") : t("Enviar invitación", "Send invitation", "Enviar convite")}</button>}</div>
                  </td>
                  <td className="guest-actions-column" data-label={t("Acciones", "Actions", "Ações")}>
                    <div className="row-actions icon-actions">
                      {canEdit && !guest.archivedAt && <button
                        className="whatsapp-button"
                        disabled={!guest.phone || updatingId === guest.id}
                        onClick={() => setWhatsAppReviewGuest(guest)}
                      >
                        {updatingId === guest.id ? "…" : "WA"}
                      </button>}
                      {!guest.archivedAt && <>
                        <details className="guest-more-menu">
                          <summary aria-label={`${t("Más opciones para", "More options for", "Mais opções para")} ${guest.name}`} title={t("Más opciones", "More options", "Mais opções")}>•••</summary>
                          <div>
                            <button type="button" onClick={() => copyInviteLink(guest)}>
                              <span aria-hidden="true">{copiedId === guest.id ? "✓" : "⧉"}</span>
                              {copiedId === guest.id ? t("Enlace copiado", "Link copied", "Link copiado") : t("Copiar enlace", "Copy link", "Copiar link")}
                            </button>
                            {canEdit && <button type="button" onClick={() => setEditingGuest(guest)}>
                              <span className="admin-action-icon is-edit" aria-hidden="true" />
                              {t("Editar invitado", "Edit guest", "Editar convidado")}
                            </button>}
                            <button type="button" onClick={() => setInspectingGuest(guest)}>
                              <span aria-hidden="true">ⓘ</span>
                              {t("Ver historial y datos", "View history and details", "Ver histórico e dados")}
                            </button>
                            {hasGuestRestriction(guest) && <div className="guest-menu-restrictions" role="group" aria-label={`${t("Restricciones y ubicación de", "Dietary needs and placement for", "Restrições e localização de")} ${guest.name}`}>
                              <strong>{t("Restricciones y ubicación", "Dietary needs and placement", "Restrições e localização")}</strong>
                              {meaningfulGuestValue(guest.food) && <span>⚠ {guest.food}</span>}
                              {guest.socialTogetherWith && <span>↔ {t("Junto a", "Together with", "Junto com")}: {guest.socialTogetherWith}</span>}
                              {guest.socialSeparateFrom && <span>⇥ {t("Separado de", "Separate from", "Separado de")}: {guest.socialSeparateFrom}</span>}
                              {guest.preferredTableName && <span>⌖ {t("Mesa preferida", "Preferred table", "Mesa preferida")}: {guest.preferredTableName}</span>}
                            </div>}
                            {canEdit && <button
                              className="guest-menu-danger"
                              type="button"
                              onClick={() => setGuestArchived(guest, true)}
                            >
                              <svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>
                              {t("Archivar invitado", "Archive guest", "Arquivar convidado")}
                            </button>}
                          </div>
                        </details>
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
      {showBulkReminderReview && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bulk-reminder-title" onMouseDown={() => setShowBulkReminderReview(false)}>
          <div className="modal bulk-reminder-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowBulkReminderReview(false)} aria-label={t("Cerrar", "Close", "Fechar")}>×</button>
            <span className="eyebrow">RSVP · WhatsApp</span>
            <h2 id="bulk-reminder-title">{t("Revisá antes de recordar", "Review before reminding", "Revise antes de lembrar")}</h2>
            <p>{t("Solo incluimos invitaciones pendientes que tienen WhatsApp y enlace personalizado. Cada mensaje se abre por separado para que puedas revisarlo antes de enviarlo.", "Only pending invitations with WhatsApp and a personal link are included. Each message opens separately so you can review it before sending.", "Incluímos apenas convites pendentes com WhatsApp e link pessoal. Cada mensagem abre separadamente para revisão antes do envio.")}</p>
            <div className="bulk-reminder-summary">
              <span><strong>{selectedGuests.length}</strong>{t("seleccionados", "selected", "selecionados")}</span>
              <span className="ready"><strong>{bulkReminderRecipients.length}</strong>{t("recibirán recordatorio", "will receive a reminder", "receberão lembrete")}</span>
              <span className="excluded"><strong>{bulkReminderExcluded.length}</strong>{t("excluidos automáticamente", "automatically excluded", "excluídos automaticamente")}</span>
            </div>
            <div className="bulk-reminder-review-list">
              {bulkReminderRecipients.map((guest, index) => <span className={index === bulkReminderCursor ? "is-current" : index < bulkReminderCursor ? "is-done" : ""} key={guest.id}><b>{index < bulkReminderCursor ? "✓" : index + 1}</b><strong>{guest.name}</strong><small>{guest.invitationOpenedAt ? t("Vio la invitación · recordar respuesta", "Viewed invitation · remind to respond", "Viu o convite · lembrar resposta") : guest.invitationSentAt ? t("WhatsApp preparado · reenviar", "WhatsApp prepared · resend", "WhatsApp preparado · reenviar") : t("Primera invitación pendiente", "First invitation pending", "Primeiro convite pendente")}</small></span>)}
            </div>
            {bulkReminderExcluded.length > 0 && <details className="bulk-reminder-excluded"><summary>{t("Ver quiénes quedaron afuera", "See who was excluded", "Ver quem ficou de fora")}</summary>{bulkReminderExcluded.map((guest) => <p key={guest.id}><strong>{guest.name}</strong> · {guest.respondedAt || guest.status !== "Pendiente" ? t("ya respondió", "already responded", "já respondeu") : !guest.phone ? t("falta WhatsApp", "WhatsApp missing", "falta WhatsApp") : t("falta enlace personalizado", "personal link missing", "falta link pessoal")}</p>)}</details>}
            <div className="modal-actions">
              <button className="outline-button" type="button" onClick={() => setShowBulkReminderReview(false)}>{bulkReminderCursor >= bulkReminderRecipients.length ? t("Cerrar", "Close", "Fechar") : t("Cancelar", "Cancel", "Cancelar")}</button>
              {bulkReminderCursor < bulkReminderRecipients.length && <button className="primary-button" type="button" onClick={() => { openWhatsAppInvite(bulkReminderRecipients[bulkReminderCursor]); setBulkReminderCursor((current) => current + 1); }}>{bulkReminderCursor === 0 ? t("Abrir primer mensaje", "Open first message", "Abrir primeira mensagem") : t("Abrir siguiente mensaje", "Open next message", "Abrir próxima mensagem")} · {bulkReminderCursor + 1}/{bulkReminderRecipients.length}</button>}
            </div>
          </div>
        </div>
      )}
      {whatsAppReviewGuest && (() => {
        const content = whatsappInviteContent(whatsAppReviewGuest);
        const actionLabel = whatsAppReviewGuest.invitationOpenedAt
          ? t("Recordatorio de respuesta", "Response reminder", "Lembrete de resposta")
          : whatsAppReviewGuest.invitationSentAt
            ? t("Reenvío de invitación", "Invitation resend", "Reenvio do convite")
            : t("Primera invitación", "First invitation", "Primeiro convite");
        return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="whatsapp-review-title" onMouseDown={() => setWhatsAppReviewGuest(null)}>
          <div className="modal whatsapp-review-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setWhatsAppReviewGuest(null)}>×</button>
            <span className="eyebrow">WhatsApp · {actionLabel}</span>
            <h2 id="whatsapp-review-title">{t("Revisá el mensaje", "Review the message", "Revise a mensagem")}</h2>
            <div className="whatsapp-review-recipient"><GuestAvatar guest={whatsAppReviewGuest} /><span><strong>{whatsAppReviewGuest.name}</strong><small>{whatsAppReviewGuest.phoneCountryCode} {whatsAppReviewGuest.phone}</small></span></div>
            <div className="whatsapp-message-preview"><p>{content.message}</p></div>
            <p className="dynamic-help">{t("WhatsApp se abrirá con este texto preparado. Podrás editarlo antes de enviarlo.", "WhatsApp will open with this message ready. You can edit it before sending.", "O WhatsApp abrirá com esta mensagem pronta. Você poderá editá-la antes de enviar.")}</p>
            <div className="modal-actions"><button className="outline-button" type="button" onClick={() => setWhatsAppReviewGuest(null)}>{t("Cancelar", "Cancel", "Cancelar")}</button><button className="primary-button small" type="button" onClick={() => { const guest = whatsAppReviewGuest; setWhatsAppReviewGuest(null); openWhatsAppInvite(guest); }}>{t("Continuar en WhatsApp", "Continue in WhatsApp", "Continuar no WhatsApp")}</button></div>
          </div>
        </div>;
      })()}
      {showAddGuests && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-guests-title" onMouseDown={() => setShowAddGuests(false)}>
          <div className="modal add-guests-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowAddGuests(false)} aria-label={t("Cerrar", "Close", "Fechar")}>×</button>
            <span className="eyebrow">{t("Lista de invitados", "Guest list", "Lista de convidados")}</span>
            <h2 id="add-guests-title">{t("¿Cómo querés agregar invitados?", "How would you like to add guests?", "Como você quer adicionar convidados?")}</h2>
            <p>{t("Elegí el método que te resulte más cómodo. Podrás revisar todo antes de guardar.", "Choose the method that works best for you. You can review everything before saving.", "Escolha o método mais conveniente. Você poderá revisar tudo antes de salvar.")}</p>
            <div className="guest-add-options">
              <button className="guest-template-option" type="button" onClick={downloadTemplate}>
                <span className="guest-add-icon">↓</span>
                <span><strong>{t("Descargar planilla tipo", "Download spreadsheet template", "Baixar planilha modelo")}</strong><small>{t("Incluye encabezados y una fila de ejemplo para completar sin dudas.", "Includes headers and an example row so it is easy to complete.", "Inclui cabeçalhos e uma linha de exemplo para preencher sem dúvidas.")}</small><code>{t("Nombre · Grupo de invitación · Círculo social · WhatsApp · Cupos · Email · Documento · Restricción", "Name · Invitation group · Social circle · WhatsApp · Seats · Email · ID · Dietary need", "Nome · Grupo do convite · Círculo social · WhatsApp · Vagas · Email · Documento · Restrição")}</code></span>
                <b aria-hidden="true">↓ CSV</b>
              </button>
              <button type="button" onClick={() => { setShowAddGuests(false); setShowModal(true); }}>
                <span className="guest-add-icon">▦</span>
                <span><strong>{t("Agregar manualmente", "Add manually", "Adicionar manualmente")}</strong><small>{t("Cargá una invitación con todos sus datos.", "Enter one invitation with all its details.", "Cadastre um convite com todos os dados.")}</small></span>
                <b aria-hidden="true">›</b>
              </button>
              <button className="recommended" type="button" onClick={() => { setShowAddGuests(false); setShowPasteGuests(true); setError(""); }}>
                <span className="guest-add-icon">⧉</span>
                <span><strong>{t("Pegar una lista", "Paste a list", "Colar uma lista")} <em>{t("Recomendado", "Recommended", "Recomendado")}</em></strong><small>{t("Copiá nombres desde Excel, Sheets o Numbers.", "Copy names from Excel, Sheets or Numbers.", "Copie nomes do Excel, Sheets ou Numbers.")}</small></span>
                <b aria-hidden="true">›</b>
              </button>
              <button type="button" onClick={() => { setShowAddGuests(false); importInput.current?.click(); }}>
                <span className="guest-add-icon">⇧</span>
                <span><strong>{t("Importar un archivo", "Import a file", "Importar um arquivo")}</strong><small>{t("Subí un CSV, Excel XLSX o una tabla DOCX.", "Upload a CSV, Excel XLSX or DOCX table.", "Envie um CSV, Excel XLSX ou tabela DOCX.")}</small></span>
                <b aria-hidden="true">›</b>
              </button>
            </div>
          </div>
        </div>
      )}
      {showPasteGuests && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paste-guests-title" onMouseDown={() => setShowPasteGuests(false)}>
          <div className="modal paste-guests-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowPasteGuests(false)} aria-label={t("Cerrar", "Close", "Fechar")}>×</button>
            <button className="modal-back-link" type="button" onClick={() => { setShowPasteGuests(false); setShowAddGuests(true); }}>← {t("Volver", "Back", "Voltar")}</button>
            <span className="eyebrow">{t("Paso 1 de 3 · Pegar lista", "Step 1 of 3 · Paste list", "Etapa 1 de 3 · Colar lista")}</span>
            <h2 id="paste-guests-title">{t("Pegá tus invitados", "Paste your guests", "Cole seus convidados")}</h2>
            <p>{t("Usá una fila por invitado. Las columnas pueden ser Nombre, WhatsApp y Grupo, en ese orden.", "Use one row per guest. Columns can be Name, WhatsApp and Group, in that order.", "Use uma linha por convidado. As colunas podem ser Nome, WhatsApp e Grupo, nessa ordem.")}</p>
            <textarea className="paste-guests-input" value={pastedGuests} onChange={(event) => setPastedGuests(event.target.value)} autoFocus placeholder={t("María Pérez    099123456    Familia Pérez\nJuan Gómez     098654321    Amigos", "Maria Perez    5551234    Perez family\nJohn Smith     5559876    Friends", "Maria Pérez    1199123456    Família Pérez\nJoão Silva     1198765432    Amigos")} />
            <div className="paste-format-hint"><span>1</span>{t("Copiá las celdas de tu planilla y pegalas aquí.", "Copy the cells from your spreadsheet and paste them here.", "Copie as células da planilha e cole aqui.")}<span>2</span>{t("En el siguiente paso revisás duplicados y errores.", "Review duplicates and errors in the next step.", "Na próxima etapa, revise duplicados e erros.")}</div>
            {error && <p className="table-error" role="alert">{error}</p>}
            <div className="modal-actions">
              <button className="outline-button" type="button" onClick={() => setShowPasteGuests(false)}>{t("Cancelar", "Cancel", "Cancelar")}</button>
              <button className="primary-button small" type="button" disabled={saving || !pastedGuests.trim()} onClick={previewPastedGuests}>{saving ? t("Procesando…", "Processing…", "Processando…") : t("Revisar lista", "Review list", "Revisar lista")}</button>
            </div>
          </div>
        </div>
      )}
      {importMapping && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="map-columns-title" onMouseDown={() => setImportMapping(null)}>
          <div className="modal import-mapping-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setImportMapping(null)} aria-label={t("Cerrar", "Close", "Fechar")}>×</button>
            <span className="eyebrow">{t("Paso 2 de 3 · Asociar columnas", "Step 2 of 3 · Match columns", "Etapa 2 de 3 · Associar colunas")}</span>
            <h2 id="map-columns-title">{t("Decinos qué contiene cada columna", "Tell us what each column contains", "Informe o que contém cada coluna")}</h2>
            <p>{t("Detectamos los encabezados automáticamente. Corregí únicamente los que no coincidan; solo el nombre es obligatorio.", "We detected the headers automatically. Fix only those that do not match; only the name is required.", "Detectamos os cabeçalhos automaticamente. Corrija apenas os que não correspondem; somente o nome é obrigatório.")}</p>
            <div className="import-file-chip"><span>▦</span><strong>{importMapping.fileName}</strong><small>{importMapping.rows.length - 1} {t("filas encontradas", "rows found", "linhas encontradas")}</small></div>
            <div className="import-mapping-grid">
              {guestImportFields.map(([field, label]) => (
                <label key={field}>
                  <span>{label}{field === "name" && <b> *</b>}</span>
                  <select value={importMapping.columns[field] ?? -1} onChange={(event) => setImportMapping((current) => current ? { ...current, columns: { ...current.columns, [field]: Number(event.target.value) } } : current)}>
                    <option value={-1}>{t("No importar", "Do not import", "Não importar")}</option>
                    {importMapping.rows[0].map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `${t("Columna", "Column", "Coluna")} ${index + 1}`}</option>)}
                  </select>
                  <small>{(importMapping.columns[field] ?? -1) >= 0 ? `${t("Ejemplo", "Example", "Exemplo")}: ${importMapping.rows[1]?.[importMapping.columns[field]] || "—"}` : t("Se dejará vacío", "It will be left empty", "Será deixado vazio")}</small>
                </label>
              ))}
            </div>
            {error && <p className="table-error" role="alert">{error}</p>}
            <div className="modal-actions">
              <button className="outline-button" type="button" onClick={() => { setImportMapping(null); setShowAddGuests(true); }}>{t("Volver", "Back", "Voltar")}</button>
              <button className="primary-button small" type="button" disabled={(importMapping.columns.name ?? -1) < 0} onClick={() => { try { setError(""); buildGuestImportPreview(importMapping.fileName, importMapping.rows, importMapping.columns); } catch (mappingError) { setError(mappingError instanceof Error ? mappingError.message : t("Revisá las columnas.", "Review the columns.", "Revise as colunas.")); } }}>{t("Revisar invitados", "Review guests", "Revisar convidados")}</button>
            </div>
          </div>
        </div>
      )}
      {inspectingGuest && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guest-details-title" onMouseDown={() => setInspectingGuest(null)}>
          <div className="modal guest-details-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setInspectingGuest(null)} aria-label={t("Cerrar", "Close", "Fechar")}>×</button>
            <span className="eyebrow">{t("Datos del invitado", "Guest details", "Dados do convidado")}</span>
            <h2 id="guest-details-title">{inspectingGuest.name}</h2>
            <p>{t("Se muestran únicamente los datos que fueron solicitados o completados.", "Only requested or completed information is shown.", "São exibidos apenas os dados solicitados ou preenchidos.")}</p>
            <dl className="guest-details-grid">
              {inspectingGuest.identificationNumber && <div><dt>{inspectingGuest.identificationType || t("Documento", "ID", "Documento")}</dt><dd>{inspectingGuest.identificationNumber}</dd></div>}
              {inspectingGuest.email && <div><dt>Email</dt><dd>{inspectingGuest.email}</dd></div>}
              {inspectingGuest.phone && <div><dt>WhatsApp</dt><dd>{inspectingGuest.phoneCountryCode} {inspectingGuest.phone}</dd></div>}
              {inspectingGuest.group && <div><dt>{t("Grupo de invitación", "Invitation group", "Grupo do convite")}</dt><dd>{inspectingGuest.group}</dd></div>}
              <div className="guest-details-circle"><dt>{t("Círculo social", "Social circle", "Círculo social")}</dt><dd>{canEdit ? <span><select value={detailsSocialCircle} disabled={saving} onChange={(event) => setDetailsSocialCircle(event.target.value)}><option value="">{t("Sin círculo social", "No social circle", "Sem círculo social")}</option>{guestSocialCircleOptions.map((circle) => <option key={circle} value={circle}>{circle}</option>)}</select><button type="button" disabled={saving || detailsSocialCircle === inspectingGuest.socialCircle} onClick={() => void updateSocialCircleFromDetails()}>{saving ? "…" : t("Guardar", "Save", "Salvar")}</button></span> : (inspectingGuest.socialCircle || t("Sin asignar", "Unassigned", "Não atribuído"))}</dd></div>
              {inspectingGuest.invitedBy && <div><dt>{t("Invitado por", "Invited by", "Convidado por")}</dt><dd>{inspectingGuest.invitedBy}</dd></div>}
              {meaningfulGuestValue(inspectingGuest.food) && <div><dt>{t("Restricción alimentaria", "Dietary requirement", "Restrição alimentar")}</dt><dd>{inspectingGuest.food}</dd></div>}
              {meaningfulGuestValue(inspectingGuest.menuChoice) && <div><dt>{t("Menú", "Menu", "Menu")}</dt><dd>{inspectingGuest.menuChoice}</dd></div>}
              {meaningfulGuestValue(inspectingGuest.accessibilityNeeds) && <div><dt>{t("Accesibilidad", "Accessibility", "Acessibilidade")}</dt><dd>{inspectingGuest.accessibilityNeeds}</dd></div>}
              {meaningfulGuestValue(inspectingGuest.transportOption) && <div><dt>{t("Transporte", "Transport", "Transporte")}</dt><dd>{inspectingGuest.transportOption}{meaningfulGuestValue(inspectingGuest.transportStop) ? ` · ${inspectingGuest.transportStop}` : ""}</dd></div>}
              {meaningfulGuestValue(inspectingGuest.song) && <div><dt>{t("Canción", "Song", "Música")}</dt><dd>{inspectingGuest.song}</dd></div>}
              {meaningfulGuestValue(inspectingGuest.guestNotes) && <div className="is-wide"><dt>{t("Otras respuestas u observaciones", "Other answers or notes", "Outras respostas ou observações")}</dt><dd>{inspectingGuest.guestNotes}</dd></div>}
            </dl>
            <section className="guest-contact-history" aria-label={t("Historial de contacto", "Contact history", "Histórico de contato")}>
              <h3>{t("Recorrido de la invitación", "Invitation journey", "Percurso do convite")}</h3>
              <ol>
                <li className={inspectingGuest.invitationSentAt ? "is-complete" : ""}><span /> <div><em>{t("Mensaje", "Message", "Mensagem")}</em><strong>{t("Preparado para WhatsApp", "Prepared for WhatsApp", "Preparado para WhatsApp")}</strong><small>{inspectingGuest.invitationSentAt ? reportDate(inspectingGuest.invitationSentAt, language) : t("Todavía no se preparó", "Not prepared yet", "Ainda não preparado")}</small></div></li>
                {inspectingGuest.whatsappStatus && <li className={inspectingGuest.whatsappStatus === "failed" ? "has-error" : "is-complete"}><span /> <div><em>WhatsApp Business</em><strong>{whatsappStatus(inspectingGuest.whatsappStatus)[0]}</strong><small>{inspectingGuest.whatsappStatusAt ? reportDate(inspectingGuest.whatsappStatusAt, language) : t("Actualización recibida de Meta", "Update received from Meta", "Atualização recebida da Meta")}</small>{inspectingGuest.whatsappStatus === "failed" && <small>{t("Meta no pudo entregar el mensaje", "Meta could not deliver the message", "A Meta não conseguiu entregar a mensagem")}</small>}</div></li>}
                <li className={inspectingGuest.invitationOpenedAt ? "is-complete" : ""}><span /> <div><em>{t("Invitación web", "Web invitation", "Convite web")}</em><strong>{t("Abrió el enlace", "Opened the link", "Abriu o link")}</strong><small>{inspectingGuest.invitationOpenedAt ? reportDate(inspectingGuest.invitationOpenedAt, language) : t("Sin apertura registrada", "No view recorded", "Sem visualização registrada")}</small></div></li>
                <li className={inspectingGuest.respondedAt ? "is-complete" : ""}><span /> <div><em>RSVP</em><strong>{t("Respuesta recibida", "Response received", "Resposta recebida")}</strong><small>{inspectingGuest.respondedAt ? `${adminStatus(language, inspectingGuest.status)} · ${reportDate(inspectingGuest.respondedAt, language)}` : t("Respuesta pendiente", "Response pending", "Resposta pendente")}</small></div></li>
                <li className={inspectingGuest.reminded ? "is-complete" : ""}><span /><div><em>{t("Seguimiento", "Follow-up", "Acompanhamento")}</em><strong>{t("Último recordatorio", "Last reminder", "Último lembrete")}</strong><small>{inspectingGuest.reminded ? reportDate(inspectingGuest.reminded, language) : t("Todavía no se recordó", "No reminder yet", "Ainda sem lembrete")}</small></div></li>
              </ol>
            </section>
            <p className="delivery-verification-note">{t("“Preparado” registra la salida desde el panel. “Abrió el enlace” confirma una visita a la invitación web; no significa que WhatsApp haya marcado el mensaje como leído.", "“Prepared” records the action from the dashboard. “Opened the link” confirms a visit to the web invitation; it does not mean WhatsApp marked the message as read.", "“Preparado” registra a ação no painel. “Abriu o link” confirma uma visita ao convite web; não significa que o WhatsApp marcou a mensagem como lida.")}</p>
            <div className="modal-actions"><button className="outline-button" type="button" onClick={() => setInspectingGuest(null)}>{t("Cerrar", "Close", "Fechar")}</button>{canEdit && <button className="primary-button small" type="button" onClick={() => { setEditingGuest(inspectingGuest); setInspectingGuest(null); }}>{t("Editar datos", "Edit details", "Editar dados")}</button>}</div>
          </div>
        </div>
      )}
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
              <span className="eyebrow">{t("Paso 3 de 3 · Revisión", "Step 3 of 3 · Review", "Etapa 3 de 3 · Revisão")}</span>
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
                          <td><input aria-label={t("Nombre", "Name", "Nome")} value={row.guest.name} onChange={(event) => updateImportPreviewGuest(index, "name", event.target.value)} /><small>{row.guest.email}</small></td>
                          <td><input aria-label={t("Grupo", "Group", "Grupo")} value={row.guest.group} placeholder="—" onChange={(event) => updateImportPreviewGuest(index, "group", event.target.value)} /></td>
                          <td><div className="import-phone-field"><span>{row.guest.phoneCountryCode}</span><input aria-label="WhatsApp" value={row.guest.phone} placeholder="—" onChange={(event) => updateImportPreviewGuest(index, "phone", event.target.value)} /></div></td>
                          <td><input className="import-seats-field" aria-label={t("Cupos", "Seats", "Vagas")} inputMode="numeric" value={row.guest.seats} onChange={(event) => updateImportPreviewGuest(index, "seats", event.target.value)} /></td>
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
      {importResult && (
        <div className="modal-backdrop" onMouseDown={() => setImportResult(null)}>
          <div className="modal import-result-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setImportResult(null)}>×</button>
            <span className="eyebrow">{t("Importación terminada", "Import complete", "Importação concluída")}</span>
            <h2>{t("La lista quedó actualizada", "Your list is updated", "A lista foi atualizada")}</h2>
            <p>{importResult.fileName}</p>
            <div className="import-result-summary">
              <span><strong>{importResult.imported}</strong>{t("invitados agregados", "guests added", "convidados adicionados")}</span>
              <span><strong>{importResult.omittedDuplicates}</strong>{t("duplicados omitidos", "duplicates skipped", "duplicados ignorados")}</span>
              <span><strong>{importResult.omittedErrors}</strong>{t("filas con error omitidas", "invalid rows skipped", "linhas com erro ignoradas")}</span>
            </div>
            <p className="dynamic-help">{t("Ya podés buscarlos, completar sus datos o enviarles la invitación desde el panel.", "You can now search, complete their details or send invitations from the panel.", "Agora você pode pesquisar, completar os dados ou enviar convites pelo painel.")}</p>
            {error && <p className="table-error" role="alert">{error}</p>}
            <div className="modal-actions import-result-actions">
              <button className="outline-button" type="button" disabled={saving} onClick={undoLastGuestImport}>{saving ? t("Deshaciendo…", "Undoing…", "Desfazendo…") : t("Deshacer importación", "Undo import", "Desfazer importação")}</button>
              <button className="primary-button small" type="button" onClick={() => setImportResult(null)}>{t("Ver invitados", "View guests", "Ver convidados")}</button>
            </div>
          </div>
        </div>
      )}
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
                {t("Grupo de invitación", "Invitation group", "Grupo do convite")}
                <small className="field-help">{t("Personas incluidas en una misma invitación, por ejemplo: Ana y novio.", "People included in one invitation, for example: Ana and partner.", "Pessoas incluídas no mesmo convite, por exemplo: Ana e parceiro.")}</small>
                <input name="group" placeholder={t("Ej. Ana y novio", "E.g. Ana and partner", "Ex. Ana e parceiro")} />
              </label>
              <label>
                {t("Círculo social", "Social circle", "Círculo social")}
                <small className="field-help">{t("Ayuda a sentar juntas a personas afines y a acercar sus mesas.", "Helps seat related people together and keep their tables nearby.", "Ajuda a sentar pessoas próximas juntas e manter suas mesas perto.")}</small>
                <span className="social-circle-field">
                  <select name={newCustomSocialCircle ? undefined : "socialCircle"} defaultValue="" onChange={(event) => setNewCustomSocialCircle(event.target.value === "__custom__")}>
                    <option value="">{t("Sin círculo social", "No social circle", "Sem círculo social")}</option>
                    {guestSocialCircleOptions.map((circle) => <option key={circle} value={circle}>{circle}</option>)}
                    <option value="__custom__">＋ {t("Agregar otro círculo…", "Add another circle…", "Adicionar outro círculo…")}</option>
                  </select>
                  {newCustomSocialCircle && <input name="socialCircle" autoFocus placeholder={t("Ej. Amigos del novio", "E.g. Groom's friends", "Ex. Amigos do noivo")} />}
                </span>
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
                {t("Grupo de invitación", "Invitation group", "Grupo do convite")}
                <input name="group" defaultValue={editingGuest.group} />
              </label>
              <label>
                {t("Círculo social", "Social circle", "Círculo social")}
                <small className="field-help">{t("Se usa para sugerir la misma mesa o una mesa cercana.", "Used to suggest the same table or a nearby table.", "Usado para sugerir a mesma mesa ou uma mesa próxima.")}</small>
                <span className="social-circle-field">
                  <select name={editCustomSocialCircle ? undefined : "socialCircle"} defaultValue={editingGuest.socialCircle || ""} onChange={(event) => setEditCustomSocialCircle(event.target.value === "__custom__")}>
                    <option value="">{t("Sin círculo social", "No social circle", "Sem círculo social")}</option>
                    {guestSocialCircleOptions.map((circle) => <option key={circle} value={circle}>{circle}</option>)}
                    <option value="__custom__">＋ {t("Agregar otro círculo…", "Add another circle…", "Adicionar outro círculo…")}</option>
                  </select>
                  {editCustomSocialCircle && <input name="socialCircle" autoFocus placeholder={t("Ej. Amigos de los padres", "E.g. Parents' friends", "Ex. Amigos dos pais")} />}
                </span>
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
              <label>Sentar junto a<small className="field-help">Elegí una persona o grupo para recibir sugerencias en Mesas.</small><input name="socialTogetherWith" list="local-social-references" defaultValue={editingGuest.socialTogetherWith} placeholder="Nombre o grupo" /></label>
              <label>Sentar separado de<input name="socialSeparateFrom" list="local-social-references" defaultValue={editingGuest.socialSeparateFrom} placeholder="Nombre o grupo" /></label>
              <datalist id="local-social-references">{[...new Set(guests.flatMap((guest) => [guest.name, guest.group, guest.socialCircle]).filter(Boolean))].map((value) => <option key={value} value={value} />)}</datalist>
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
  shape: "round" | "rectangular" | "square" | "living";
  seatAssignments: Record<string, number>;
  rotation: number;
  locked: boolean;
};

type FloorElement = {
  id: string;
  kind: "entrance" | "dance-floor" | "gourmet" | "hydration" | "stage" | "dj" | "cake" | "gifts" | "buffet" | "wall" | "door" | "window" | "column" | "stairs" | "restroom" | "kitchen" | "emergency" | "photo-booth" | "fountain" | "plant" | "divider" | "custom";
  label: string;
  space: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

function Seating({ guests, setGuests, canEdit }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; canEdit: boolean }) {
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
  const savedSpaceSizesRef = useRef<Record<string, { width: number; height: number }>>({ "Espacio 1": { width: 1200, height: 700 } });
  const [layoutNotice, setLayoutNotice] = useState("");
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [floorZoom, setFloorZoom] = useState(1);
  const [showFloorLibrary, setShowFloorLibrary] = useState(true);
  const [showFloorInspector, setShowFloorInspector] = useState(true);
  const [planExportScale, setPlanExportScale] = useState(2);
  const [planPreviewUrl, setPlanPreviewUrl] = useState("");
  const floorPlanRef = useRef<HTMLElement | null>(null);
  const floorSpacesRef = useRef<HTMLDivElement | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [layoutUndoStack, setLayoutUndoStack] = useState<Array<{ before: EventTable; after: EventTable }>>([]);
  const [layoutRedoStack, setLayoutRedoStack] = useState<Array<{ before: EventTable; after: EventTable }>>([]);
  const [dragGuestId, setDragGuestId] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [tableQuery, setTableQuery] = useState("");
  const [compactTables, setCompactTables] = useState(false);
  const [assignmentSavingId, setAssignmentSavingId] = useState("");
  const [groupAssignmentSaving, setGroupAssignmentSaving] = useState("");
  const [mobileSeatingStep, setMobileSeatingStep] = useState<"guests" | "tables">("guests");
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [exportSelection, setExportSelection] = useState<"coordination" | "catering" | "layout">("coordination");
  const [selectedLayoutTableId, setSelectedLayoutTableId] = useState("");
  const [selectedFloorElementId, setSelectedFloorElementId] = useState("");
  const [layoutTableNameDraft, setLayoutTableNameDraft] = useState("");
  const [floorElementLabelDraft, setFloorElementLabelDraft] = useState("");
  const [seatHover, setSeatHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const [draggedNewFloorElement, setDraggedNewFloorElement] = useState<{ kind: FloorElement["kind"]; label: string } | null>(null);
  const [floorDropTarget, setFloorDropTarget] = useState("");
  const [floorSaveStatus, setFloorSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedFloorSave, setFailedFloorSave] = useState<{ element: FloorElement; method: "POST" | "PATCH" } | null>(null);
  const [floorLibraryCategory, setFloorLibraryCategory] = useState<"main" | "structure" | "services" | "furniture" | "utilities">("main");
  const [assignmentStatus, setAssignmentStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedAssignment, setFailedAssignment] = useState<{ guestId: string; tableId: string; seatNumber: number } | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [guestCategoryFilter, setGuestCategoryFilter] = useState<"all" | "adult" | "teen" | "child">("all");
  const [guestRestrictionFilter, setGuestRestrictionFilter] = useState(false);
  const [socialCircleFilter, setSocialCircleFilter] = useState("");
  const [showSocialCircleManager, setShowSocialCircleManager] = useState(false);
  const [socialCircleSaving, setSocialCircleSaving] = useState("");
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
    (total, table) => total + (table.shape === "living" ? 0 : table.capacity),
    0,
  );
  const overCapacityTables = tables.filter((table) => table.shape !== "living" && table.guests.reduce((total, id) => {
    const guest = confirmedGuests.find((candidate) => candidate.id === id);
    return total + (guest ? confirmedPeopleForGuest(guest, guests) : 0);
  }, 0) > table.capacity);
  const matchingInvitationGroups = query.trim()
    ? [...new Set(confirmedGuests.map((guest) => guest.group.trim()).filter(Boolean))]
      .filter((group) => normalizedReference(group).includes(normalizedReference(query)))
      .sort((a, b) => a.localeCompare(b))
    : [];
  const matchingSocialCircles = socialCircleFilter
    ? [socialCircleFilter]
    : query.trim()
      ? [...new Set(confirmedGuests.map((guest) => guest.socialCircle.trim()).filter(Boolean))]
        .filter((circle) => normalizedReference(circle).includes(normalizedReference(query)))
        .sort((a, b) => a.localeCompare(b))
      : [];
  const matchingSeatingCollections = [
    ...matchingInvitationGroups.map((value) => ({ kind: "group" as const, value })),
    ...matchingSocialCircles.map((value) => ({ kind: "socialCircle" as const, value })),
  ];
  const socialCircleOptions = [...new Set(confirmedGuests.map((guest) => guest.socialCircle.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const socialCircleStats = socialCircleOptions.map((circle) => {
    const members = guests.filter((guest) => normalizedReference(guest.socialCircle) === normalizedReference(circle));
    return { circle, invitations: members.length, people: members.reduce((total, guest) => total + confirmedPeopleForGuest(guest, guests), 0) };
  }).sort((left, right) => right.people - left.people || left.circle.localeCompare(right.circle));
  const visibleTables = tables.filter((table) => {
    const guestTerms = table.guests.map((id) => { const guest = guests.find((item) => item.id === id); return guest ? `${guest.name} ${guest.group} ${guest.socialCircle}` : ""; }).join(" ");
    return `${table.name} ${guestTerms}`.toLowerCase().includes(tableQuery.toLowerCase());
  });
  const findSocialReferences = (reference: string, guestId: string) => {
    const normalized = normalizedReference(reference);
    return normalized ? confirmedGuests.filter((candidate) => candidate.id !== guestId && (
      normalizedReference(candidate.name).includes(normalized) ||
      normalized.includes(normalizedReference(candidate.name)) ||
      normalizedReference(candidate.group) === normalized
    )) : [];
  };
  const socialConflicts = (() => {
    const conflicts = new Map<string, { id: string; tableId: string; message: string }>();
    confirmedGuests.forEach((guest) => {
      const table = tables.find((candidate) => candidate.guests.includes(guest.id));
      if (!table) return;
      const togetherMatches = findSocialReferences(guest.socialTogetherWith, guest.id);
      const together = togetherMatches[0];
      const hasTogetherMatchAtTable = togetherMatches.some((match) => table.guests.includes(match.id));
      if (together && !hasTogetherMatchAtTable) {
        const id = `together-${guest.id}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name} ${t("debe sentarse junto a", "should sit with", "deve sentar junto a")} ${guest.socialTogetherWith}` });
      }
      if (guest.socialTogetherWith && !together) {
        const id = `unresolved-together-${guest.id}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name}: ${t("no encontramos a", "could not find", "não encontramos")} “${guest.socialTogetherWith}”` });
      }
      const separateMatches = findSocialReferences(guest.socialSeparateFrom, guest.id);
      const separate = separateMatches[0];
      const hasSeparateMatchAtTable = separateMatches.some((match) => table.guests.includes(match.id));
      if (separate && hasSeparateMatchAtTable) {
        const id = `separate-${[guest.id, separate.id].sort().join("-")}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name} ${t("debe sentarse separado de", "should sit separately from", "deve sentar separado de")} ${separate.name}` });
      }
      if (guest.socialSeparateFrom && !separate) {
        const id = `unresolved-separate-${guest.id}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name}: ${t("no encontramos a", "could not find", "não encontramos")} “${guest.socialSeparateFrom}”` });
      }
      if (guest.preferredTableName && !normalizedReference(table.name).includes(normalizedReference(guest.preferredTableName))) {
        const id = `preferred-${guest.id}`;
        conflicts.set(id, { id, tableId: table.id, message: `${guest.name}: ${t("mesa preferida", "preferred table", "mesa preferida")} “${guest.preferredTableName}”` });
      }
    });
    socialCircleOptions.forEach((circle) => {
      const circleTables = tables.filter((table) => table.guests.some((guestId) => {
        const guest = confirmedGuests.find((candidate) => candidate.id === guestId);
        return normalizedReference(guest?.socialCircle || "") === normalizedReference(circle);
      }));
      circleTables.forEach((table, index) => {
        const distantPeer = circleTables.slice(index + 1).find((peer) =>
          peer.space === table.space && Math.hypot((peer.x || 0) - (table.x || 0), (peer.y || 0) - (table.y || 0)) > 380,
        );
        if (!distantPeer) return;
        const id = `circle-distance-${normalizedReference(circle)}-${table.id}-${distantPeer.id}`;
        conflicts.set(id, { id, tableId: table.id, message: `${t("Círculo disperso", "Spread-out circle", "Círculo disperso")}: ${circle} · ${table.name} / ${distantPeer.name}` });
      });
    });
    return [...conflicts.values()];
  })();
  const splitInvitationGroups = [...new Set(confirmedGuests.map((guest) => guest.group.trim()).filter(Boolean))].filter((group) => {
    const memberIds = new Set(confirmedGuests.filter((guest) => normalizedReference(guest.group) === normalizedReference(group)).map((guest) => guest.id));
    return tables.filter((table) => table.guests.some((id) => memberIds.has(id))).length > 1;
  });
  const normalizedTableNames = tables.map((table) => normalizedReference(table.name)).filter(Boolean);
  const duplicateTableNames = [...new Set(normalizedTableNames.filter((name, index) => normalizedTableNames.indexOf(name) !== index))];
  const unnamedTables = tables.filter((table) => !table.name.trim());
  const dispersedCircleConflicts = socialConflicts.filter((conflict) => conflict.id.startsWith("circle-distance-"));
  const confirmedRestrictions = confirmedGuests.filter(guestHasRestriction).length;
  const reviewIssueCount = unassigned.length + splitInvitationGroups.length + dispersedCircleConflicts.length + overCapacityTables.length + unnamedTables.length + duplicateTableNames.length;

  const focusSpecificTable = (tableId: string) => document.getElementById(`table-card-${tableId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  const exportSocialConflicts = () => exportCsv("conflictos-de-mesas.csv", [t("Mesa", "Table", "Mesa"), t("Conflicto", "Conflict", "Conflito")], socialConflicts.map((conflict) => [tables.find((table) => table.id === conflict.tableId)?.name || "—", conflict.message]));
  const suggestedTableForGuest = (guest: Guest) => {
    const explicitMatches = findSocialReferences(guest.socialTogetherWith, guest.id);
    const explicitTable = tables.find((table) => table.guests.some((guestId) => explicitMatches.some((match) => match.id === guestId)));
    if (explicitTable) return { table: explicitTable, reason: guest.socialTogetherWith, basis: "explicit" as const, nearby: false };
    const people = confirmedPeopleForGuest(guest, guests);
    const availableCapacity = (table: EventTable) => table.shape === "living" || table.capacity - table.guests.reduce((total, guestId) => {
      const seatedGuest = confirmedGuests.find((candidate) => candidate.id === guestId);
      return total + (seatedGuest ? confirmedPeopleForGuest(seatedGuest, guests) : 0);
    }, 0) >= people;
    const normalizedInvitationGroup = normalizedReference(guest.group);
    if (normalizedInvitationGroup) {
      const invitationGroupTable = tables
        .filter((table) => availableCapacity(table) && table.guests.some((guestId) => {
          const seatedGuest = guests.find((candidate) => candidate.id === guestId);
          return seatedGuest && seatedGuest.id !== guest.id && normalizedReference(seatedGuest.group) === normalizedInvitationGroup;
        }))
        .sort((left, right) => right.guests.filter((id) => normalizedReference(guests.find((item) => item.id === id)?.group || "") === normalizedInvitationGroup).length - left.guests.filter((id) => normalizedReference(guests.find((item) => item.id === id)?.group || "") === normalizedInvitationGroup).length)[0];
      if (invitationGroupTable) return { table: invitationGroupTable, reason: guest.group, basis: "group" as const, nearby: false };
    }
    const normalizedGroup = normalizedReference(guest.socialCircle);
    if (!normalizedGroup) return null;
    const circleTables = tables.filter((table) => table.guests.some((guestId) => {
      const seatedGuest = guests.find((candidate) => candidate.id === guestId);
      return seatedGuest && seatedGuest.id !== guest.id && normalizedReference(seatedGuest.socialCircle) === normalizedGroup;
    }));
    const sameCircleTable = circleTables
      .filter(availableCapacity)
      .sort((left, right) => right.guests.filter((id) => normalizedReference(guests.find((item) => item.id === id)?.socialCircle || "") === normalizedGroup).length - left.guests.filter((id) => normalizedReference(guests.find((item) => item.id === id)?.socialCircle || "") === normalizedGroup).length)[0];
    if (sameCircleTable) return { table: sameCircleTable, reason: guest.socialCircle, basis: "circle" as const, nearby: false };
    const nearbyTable = tables
      .filter((table) => !circleTables.includes(table) && availableCapacity(table) && circleTables.some((circleTable) => circleTable.space === table.space))
      .sort((left, right) => {
        const distance = (table: EventTable) => Math.min(...circleTables.map((circleTable) => Math.hypot((table.x || 0) - (circleTable.x || 0), (table.y || 0) - (circleTable.y || 0))));
        return distance(left) - distance(right);
      })[0];
    return nearbyTable ? { table: nearbyTable, reason: guest.socialCircle, basis: "circle" as const, nearby: true } : null;
  };
  const selectedGuest = confirmedGuests.find((guest) => guest.id === selectedGuestId);
  const explicitTogetherGuests = selectedGuest ? findSocialReferences(selectedGuest.socialTogetherWith, selectedGuest.id) : [];
  const selectedSuggestion = selectedGuest ? suggestedTableForGuest(selectedGuest) : null;
  const suggestedGroupTable = selectedSuggestion?.table;
  const seatedExplicitTargetIds = suggestedGroupTable ? explicitTogetherGuests.filter((guest) => suggestedGroupTable.guests.includes(guest.id)).map((guest) => guest.id) : [];
  const suggestedTargetIds = seatedExplicitTargetIds.length
    ? seatedExplicitTargetIds
    : selectedGuest && suggestedGroupTable ? confirmedGuests.filter((guest) => guest.id !== selectedGuest.id && suggestedGroupTable.guests.includes(guest.id) && (selectedSuggestion?.basis === "group" ? normalizedReference(guest.group) === normalizedReference(selectedGuest.group) : normalizedReference(guest.socialCircle) === normalizedReference(selectedGuest.socialCircle))).map((guest) => guest.id) : [];

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
    setMobileSeatingStep("tables");
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
        const loadedSpaceSizes = Object.fromEntries((result.layoutSpaces || []).map((space) => [space.name, { width: space.width, height: space.height }]));
        savedSpaceSizesRef.current = { ...savedSpaceSizesRef.current, ...loadedSpaceSizes };
        setSpaceSizes((current) => ({ ...current, ...loadedSpaceSizes }));
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
    setTableName(shape === "living" ? `Living ${tables.filter((table) => table.shape === "living").length + 1}` : `Mesa ${tables.filter((table) => table.shape !== "living").length + 1}`);
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
    const normalizedTableName = tableName.trim();
    if (!normalizedTableName) {
      setError(t("Ingresá un nombre o número para la mesa.", "Enter a name or number for the table.", "Digite um nome ou número para a mesa."));
      return;
    }
    const editingId = editing?.id || "";
    const previousTable = editing
      ? tables.find((table) => table.id === editing.id) || editing
      : null;
    if (editingId) {
      setTables((current) => current.map((table) =>
        table.id === editingId ? { ...table, name: normalizedTableName } : table,
      ));
    }
    setSaving(true);
    setError("");
    try {
      const onlyRenaming = Boolean(
        editing &&
        normalizedTableName !== editing.name &&
        capacity === editing.capacity &&
        note.trim() === editing.note.trim() &&
        tableShape === editing.shape
      );
      const response = await fetch("/api/admin/tables", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onlyRenaming
          ? { action: "rename", id: editing?.id, name: normalizedTableName }
          : { id: editing?.id, name: normalizedTableName, capacity, note, shape: tableShape }),
      });
      const result = (await response.json()) as {
        table?: EventTable;
        error?: string;
      };
      if (!response.ok || !result.table)
        throw new Error(result.error || "No pudimos guardar la mesa.");
      if (editingId && result.table.name !== normalizedTableName)
        throw new Error(t("El servidor no confirmó el nuevo nombre. Volvé a intentarlo.", "The server did not confirm the new name. Try again.", "O servidor não confirmou o novo nome. Tente novamente."));
      setTables((current) =>
        editingId
          ? current.map((table) =>
              table.id === editingId
                ? { ...table, ...result.table!, name: normalizedTableName, guests: table.guests, seatAssignments: table.seatAssignments || {} }
                : table,
            )
          : [...current, result.table!],
      );
      if (editingId) {
        setEditing((current) => current?.id === editingId
          ? { ...current, ...result.table!, name: normalizedTableName }
          : current,
        );
        setLayoutTableNameDraft(normalizedTableName);
      }
      setShowModal(false);
      setLayoutNotice(editing ? t("Mesa actualizada y guardada.", "Table updated and saved.", "Mesa atualizada e salva.") : t("Mesa creada.", "Table created.", "Mesa criada."));
      window.setTimeout(() => setLayoutNotice(""), 1800);
    } catch (saveError) {
      if (previousTable) {
        setTables((current) => current.map((table) =>
          table.id === previousTable.id ? previousTable : table,
        ));
      }
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
      setSelectedGuestId("");
      setAssignmentStatus("saved");
      setFailedAssignment(null);
      window.setTimeout(() => setAssignmentStatus((current) => current === "saved" ? "idle" : current), 1800);
      return true;
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "No pudimos asignar el invitado.",
      );
      setAssignmentStatus("error");
      setFailedAssignment({ guestId, tableId, seatNumber });
      return false;
    } finally {
      setAssignmentSavingId("");
    }
  };

  const unassignGuest = (guestId: string) => assignGuest(guestId, "");

  const updateSocialCircleMembers = async (sourceCircle: string, targetCircle: string) => {
    const ids = guests.filter((guest) => normalizedReference(guest.socialCircle) === normalizedReference(sourceCircle)).map((guest) => guest.id);
    const normalizedTarget = targetCircle.trim().slice(0, 120);
    if (!ids.length || normalizedReference(sourceCircle) === normalizedReference(normalizedTarget)) return;
    setSocialCircleSaving(sourceCircle);
    setError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-update", ids, socialCircle: normalizedTarget }),
      });
      const result = await readApiJson<{ guests?: Guest[]; error?: string }>(response, t("El servicio de invitados no está disponible.", "The guest service is unavailable.", "O serviço de convidados não está disponível."));
      if (!response.ok || !result.guests) throw new Error(result.error || t("No pudimos actualizar el círculo.", "Could not update the circle.", "Não foi possível atualizar o círculo."));
      const updated = new Map(result.guests.map((guest) => [guest.id, guest]));
      setGuests((current) => current.map((guest) => updated.get(guest.id) || guest));
      if (normalizedReference(socialCircleFilter) === normalizedReference(sourceCircle)) setSocialCircleFilter(normalizedTarget);
      setAssignmentStatus("saved");
    } catch (circleError) {
      setError(circleError instanceof Error ? circleError.message : t("No pudimos actualizar el círculo.", "Could not update the circle.", "Não foi possível atualizar o círculo."));
    } finally {
      setSocialCircleSaving("");
    }
  };

  const assignCollection = async (kind: "group" | "socialCircle", collectionName: string, tableId: string) => {
    const directGuests = confirmedGuests.filter(
      (guest) => normalizedReference(guest[kind]) === normalizedReference(collectionName),
    );
    const protectedInvitationGroups = new Set(directGuests.map((guest) => normalizedReference(guest.group)).filter(Boolean));
    const collectionGuests = kind === "socialCircle"
      ? confirmedGuests.filter((guest) => directGuests.some((member) => member.id === guest.id) || protectedInvitationGroups.has(normalizedReference(guest.group)))
      : directGuests;
    if (!collectionGuests.length || !tableId) return;
    const savingKey = `${kind}:${collectionName}`;
    setGroupAssignmentSaving(savingKey);
    setAssignmentStatus("saving");
    setError("");
    try {
      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-batch",
          assignments: collectionGuests.map((guest) => ({ guestId: guest.id, tableId })),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || t("No pudimos ubicar el grupo completo.", "Could not seat the entire group.", "Não foi possível alocar o grupo completo."));
      const groupIds = new Set(collectionGuests.map((guest) => guest.id));
      setTables((current) => current.map((table) => ({
        ...table,
        guests: table.id === tableId
          ? [...table.guests.filter((id) => !groupIds.has(id)), ...groupIds]
          : table.guests.filter((id) => !groupIds.has(id)),
        seatAssignments: Object.fromEntries(Object.entries(table.seatAssignments || {}).filter(([id]) => !groupIds.has(id))),
      })));
      setAssignmentStatus("saved");
      setTableQuery(collectionName);
      setMobileSeatingStep("tables");
      window.setTimeout(() => setAssignmentStatus((current) => current === "saved" ? "idle" : current), 1800);
    } catch (groupError) {
      setError(groupError instanceof Error ? groupError.message : t("No pudimos ubicar el grupo completo.", "Could not seat the entire group.", "Não foi possível alocar o grupo completo."));
      setAssignmentStatus("error");
    } finally {
      setGroupAssignmentSaving("");
    }
  };

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
    setFloorSaveStatus("saving");
    const response = await fetch("/api/admin/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "layout", id: table.id, space: table.space, x: table.x, y: table.y, width: table.width, height: table.height, rotation: table.rotation || 0, locked: Boolean(table.locked) }),
    });
    const result = await readApiJson<{ table?: EventTable; error?: string }>(response, t("El servicio del plano no está disponible.", "The layout service is unavailable.", "O serviço do plano não está disponível."));
    if (!response.ok || !result.table) {
      setFloorSaveStatus("error");
      throw new Error(result.error || t("No pudimos guardar el plano.", "Could not save the layout.", "Não foi possível salvar o plano."));
    }
    setFloorSaveStatus("saved");
    window.setTimeout(() => setFloorSaveStatus((current) => current === "saved" ? "idle" : current), 1800);
    return result.table;
  };

  const mergeSavedTableLayout = (saved: EventTable) => setTables((current) => current.map((item) => item.id === saved.id ? { ...item, ...saved, guests: item.guests, seatAssignments: item.seatAssignments } : item));

  const rememberLayoutChange = (before: EventTable, after: EventTable) => {
    setLayoutUndoStack((current) => [...current.slice(-29), { before, after }]);
    setLayoutRedoStack([]);
  };

  const restoreLayoutVersion = async (table: EventTable) => {
    setTables((current) => current.map((item) => item.id === table.id ? table : item));
    const saved = await saveTableLayout(table);
    mergeSavedTableLayout(saved);
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
    const room = spaceSizes[space] || { width: 1200, height: 700 };
    const next = {
      ...table,
      space,
      x: Math.max(0, Math.min(room.width - (table.width || 140), Math.round(x / grid) * grid)),
      y: Math.max(0, Math.min(room.height - (table.height || 70), Math.round(y / grid) * grid)),
    };
    setTables((current) => current.map((item) => item.id === table.id ? next : item));
    try {
      const saved = await saveTableLayout(next);
      mergeSavedTableLayout(saved);
      rememberLayoutChange(table, next);
    } catch (moveError) {
      setTables((current) => current.map((item) => item.id === table.id ? table : item));
      setError(moveError instanceof Error ? moveError.message : "No pudimos guardar la posición.");
    }
  };

  const moveTableWithPointer = (table: EventTable, event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || table.locked || !canEdit) return;
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const originalX = table.x || 24;
    const originalY = table.y || 24;
    const room = spaceSizes[table.space || "Espacio 1"] || { width: 1200, height: 700 };
    let nextX = originalX;
    let nextY = originalY;
    let moved = false;
    const onMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = (moveEvent.clientX - startX) / floorZoom;
      const deltaY = (moveEvent.clientY - startY) / floorZoom;
      if (!moved && Math.hypot(deltaX, deltaY) < 4) return;
      moved = true;
      nextX = Math.max(0, Math.min(room.width - (table.width || 140), originalX + deltaX));
      nextY = Math.max(0, Math.min(room.height - (table.height || 70), originalY + deltaY));
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, x: nextX, y: nextY } : item));
    };
    const onEnd = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      document.removeEventListener("pointercancel", onEnd);
      if (moved) void moveTable(table, table.space || "Espacio 1", nextX, nextY);
    };
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onEnd);
    document.addEventListener("pointercancel", onEnd);
  };

  const updateTableLayout = async (table: EventTable, changes: Partial<EventTable>) => {
    const next = { ...table, ...changes };
    setTables((current) => current.map((item) => item.id === table.id ? next : item));
    try {
      const saved = await saveTableLayout(next);
      mergeSavedTableLayout(saved);
      rememberLayoutChange(table, next);
    } catch (layoutError) {
      setTables((current) => current.map((item) => item.id === table.id ? table : item));
      setError(layoutError instanceof Error ? layoutError.message : "No pudimos actualizar la mesa.");
    }
  };

  const renameTableInline = async (table: EventTable, nextName: string) => {
    const name = nextName.trim().slice(0, 120);
    if (!name) {
      setError(t("Ingresá un nombre para la mesa.", "Enter a table name.", "Digite um nome para a mesa."));
      return;
    }
    if (name === table.name) return;
    const previousName = table.name;
    setTables((current) => current.map((item) => item.id === table.id ? { ...item, name } : item));
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", id: table.id, name }),
      });
      const result = await response.json() as { table?: EventTable; error?: string };
      if (!response.ok || !result.table) throw new Error(result.error || t("No pudimos cambiar el nombre de la mesa.", "Could not rename the table.", "Não foi possível renomear a mesa."));
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, ...result.table!, name, guests: item.guests, seatAssignments: item.seatAssignments } : item));
      setEditing((current) => current?.id === table.id ? { ...current, ...result.table!, name } : current);
      setLayoutTableNameDraft(name);
      setLayoutNotice(t("Nombre actualizado.", "Name updated.", "Nome atualizado."));
      window.setTimeout(() => setLayoutNotice(""), 1800);
    } catch (renameError) {
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, name: previousName } : item));
      setLayoutTableNameDraft(previousName);
      setError(renameError instanceof Error ? renameError.message : t("No pudimos cambiar el nombre de la mesa.", "Could not rename the table.", "Não foi possível renomear a mesa."));
    } finally { setSaving(false); }
  };

  const updateTableCapacityInline = async (table: EventTable, nextCapacity: number) => {
    if (table.shape === "living") return;
    const occupied = table.guests.reduce((total, id) => {
      const guest = confirmedGuests.find((candidate) => candidate.id === id);
      return total + (guest ? confirmedPeopleForGuest(guest, guests) : 0);
    }, 0);
    const normalizedCapacity = Math.max(occupied, Math.min(30, Math.round(nextCapacity)));
    if (normalizedCapacity === table.capacity) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: table.id, name: table.name, capacity: normalizedCapacity, note: table.note, shape: table.shape }),
      });
      const result = await response.json() as { table?: EventTable; error?: string };
      if (!response.ok || !result.table) throw new Error(result.error || t("No pudimos cambiar la capacidad.", "Could not change capacity.", "Não foi possível alterar a capacidade."));
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, ...result.table!, guests: item.guests, seatAssignments: item.seatAssignments } : item));
    } catch (capacityError) {
      setError(capacityError instanceof Error ? capacityError.message : t("No pudimos cambiar la capacidad.", "Could not change capacity.", "Não foi possível alterar a capacidade."));
    } finally { setSaving(false); }
  };

  const duplicateTable = async (table: EventTable) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${table.name} ${t("copia", "copy", "cópia")}`, capacity: table.capacity, note: table.note, shape: table.shape }) });
      const result = (await response.json()) as { table?: EventTable; error?: string };
      if (!response.ok || !result.table) throw new Error(result.error || "No pudimos duplicar la mesa.");
      const room = spaceSizes[table.space || "Espacio 1"] || { width: 1200, height: 700 };
      const duplicate = { ...result.table, guests: [], seatAssignments: {}, space: table.space, x: Math.min(room.width - (table.width || 140), (table.x || 24) + 32), y: Math.min(room.height - (table.height || 70), (table.y || 24) + 32), width: table.width, height: table.height, rotation: table.rotation || 0, locked: false };
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
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = table.width || 140;
    const startHeight = table.height || 70;
    const room = spaceSizes[table.space || "Espacio 1"] || { width: 1200, height: 700 };
    const maxWidth = Math.max(60, Math.min(300, room.width - (table.x || 24)));
    const maxHeight = Math.max(40, Math.min(180, room.height - (table.y || 24)));
    let resized = table;
    const onMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      if (table.shape === "round" || table.shape === "square") {
        const maxSurfaceSize = Math.min(maxHeight, maxWidth / 2);
        const requestedSize = Math.max(startHeight + moveEvent.clientY - startY, startWidth / 2 + (moveEvent.clientX - startX) / 2);
        const surfaceSize = Math.min(maxSurfaceSize, Math.max(Math.min(50, maxSurfaceSize), requestedSize));
        resized = { ...table, width: surfaceSize * 2, height: surfaceSize };
      } else {
        resized = { ...table, width: Math.min(maxWidth, Math.max(Math.min(100, maxWidth), startWidth + moveEvent.clientX - startX)), height: Math.min(maxHeight, Math.max(Math.min(60, maxHeight), startHeight + moveEvent.clientY - startY)) };
      }
      setTables((current) => current.map((item) => item.id === table.id ? resized : item));
    };
    const onEnd = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      void saveTableLayout(resized)
        .then((saved) => { mergeSavedTableLayout(saved); rememberLayoutChange(table, resized); })
        .catch(() => { setTables((current) => current.map((item) => item.id === table.id ? table : item)); setError("No pudimos guardar el nuevo tamaño."); });
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onEnd);
  };

  const saveFloorElement = async (element: FloorElement, method: "POST" | "PATCH" = "PATCH") => {
    setFloorSaveStatus("saving");
    try {
      const response = await fetch("/api/admin/tables", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "layout-element", ...element }) });
      const result = await response.json() as { element?: FloorElement; error?: string };
      if (!response.ok || !result.element) throw new Error(result.error || "No pudimos guardar el elemento.");
      setFailedFloorSave(null);
      setFloorSaveStatus("saved");
      window.setTimeout(() => setFloorSaveStatus((current) => current === "saved" ? "idle" : current), 1800);
      return result.element;
    } catch (saveError) {
      setFailedFloorSave({ element, method });
      setFloorSaveStatus("error");
      throw saveError;
    }
  };

  const defaultFloorElementSize = (kind: FloorElement["kind"]) => {
    if (kind === "dance-floor") return { width: 240, height: 160 };
    if (kind === "wall" || kind === "divider") return { width: 260, height: 24 };
    if (kind === "door" || kind === "window") return { width: 120, height: 28 };
    if (kind === "stage" || kind === "dj" || kind === "buffet") return { width: 200, height: 90 };
    if (["cake", "fountain", "plant", "column"].includes(kind)) return { width: 96, height: 96 };
    if (["restroom", "kitchen", "emergency", "entrance"].includes(kind)) return { width: 150, height: 64 };
    return { width: 150, height: 80 };
  };

  const minimumFloorElementSize = (kind: FloorElement["kind"]) => {
    void kind;
    return { width: 20, height: 20 };
  };

  const floorElementIcon = (kind: FloorElement["kind"]) => ({
    entrance: "↪", "dance-floor": "♫", gourmet: "▱", hydration: "♨", stage: "▰", dj: "◉", cake: "♨", gifts: "◇", buffet: "♨", wall: "▬", door: "⌑", window: "▤", column: "●", stairs: "≋", restroom: "WC", kitchen: "♨", emergency: "↗", "photo-booth": "▣", fountain: "≋", plant: "♧", divider: "┄", custom: "T",
  })[kind];

  const floorElementIconPath = (kind: FloorElement["kind"]) => ({
    entrance: "/admin-icons/emergency-exit.png", "dance-floor": "/admin-icons/dance-floor.png", gourmet: "/admin-icons/living.png", hydration: "/admin-icons/bar.png", stage: "/admin-icons/stage.png", dj: "/admin-icons/dj.png", cake: "/admin-icons/cake.png", gifts: "/admin-icons/gifts.png", buffet: "/admin-icons/kitchen.png", wall: "/admin-icons/wall.png", window: "/admin-icons/window.png", column: "/admin-icons/column.png", stairs: "/admin-icons/stairs.png", restroom: "/admin-icons/restroom.png", kitchen: "/admin-icons/kitchen.png", emergency: "/admin-icons/emergency-exit.png", "photo-booth": "/admin-icons/photo-booth.png", fountain: "/admin-icons/fountain.png", plant: "/admin-icons/plant.png", divider: "/admin-icons/divider.png", custom: "/admin-icons/edit.png",
  } as Partial<Record<FloorElement["kind"], string>>)[kind] || "";

  const floorElementNeedsIcon = (element: FloorElement) => element.width < 90 || element.height < 46 || element.label.length * 6.2 > element.width - 20;
  const isCircularFloorElement = (kind: FloorElement["kind"]) => ["cake", "fountain", "plant", "column"].includes(kind);

  const addFloorElement = async (kind: FloorElement["kind"], label: string, position?: { space: string; x: number; y: number }) => {
    const space = position?.space || spaces[0] || "Espacio 1";
    const room = spaceSizes[space] || { width: 1200, height: 700 };
    const size = defaultFloorElementSize(kind);
    const x = Math.max(0, Math.min(room.width - size.width, position?.x ?? (room.width - size.width) / 2));
    const y = Math.max(0, Math.min(room.height - size.height, position?.y ?? (room.height - size.height) / 2));
    try {
      const element = await saveFloorElement({ id: "", kind, label, space, x, y, ...size }, "POST");
      setFloorElements((current) => [...current, element]);
      setSelectedLayoutTableId("");
      setSelectedFloorElementId(element.id);
      setFloorElementLabelDraft(element.label);
      setShowFloorInspector(true);
      setLayoutNotice(t(`${label} agregado al plano.`, `${label} added to the layout.`, `${label} adicionado ao plano.`));
      window.setTimeout(() => setLayoutNotice(""), 1800);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : t("No pudimos agregar el elemento. Revisá que las migraciones estén aplicadas.", "Could not add the element. Check that migrations are applied.", "Não foi possível adicionar o elemento. Verifique as migrações."));
      setLayoutNotice("");
    }
  };

  const updateFloorElement = (element: FloorElement, changes: Partial<FloorElement>) => {
    const next = { ...element, ...changes };
    setFloorElements((current) => current.map((item) => item.id === element.id ? next : item));
    return next;
  };

  const persistFloorElement = async (element: FloorElement, rollback?: FloorElement) => {
    try {
      const saved = await saveFloorElement(element);
      setFloorElements((current) => current.map((item) => item.id === saved.id ? { ...item, ...saved } : item));
      setFloorElementLabelDraft((current) => selectedFloorElementId === saved.id ? saved.label : current);
    } catch (saveError) {
      if (rollback) setFloorElements((current) => current.map((item) => item.id === rollback.id ? rollback : item));
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el elemento.");
    }
  };

  const retryFloorElementSave = async () => {
    if (!failedFloorSave) return;
    setError("");
    try {
      const savedElement = await saveFloorElement(failedFloorSave.element, failedFloorSave.method);
      setFloorElements((current) => failedFloorSave.method === "POST" && !current.some((item) => item.id === savedElement.id) ? [...current, savedElement] : current.map((item) => item.id === savedElement.id ? { ...item, ...savedElement } : item));
      setSelectedFloorElementId(savedElement.id);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : t("No pudimos reintentar el guardado.", "Could not retry saving.", "Não foi possível tentar salvar novamente."));
    }
  };

  const deleteFloorElement = async (id: string) => {
    const response = await fetch(`/api/admin/tables?elementId=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      setFloorElements((current) => current.filter((item) => item.id !== id));
      setSelectedFloorElementId((current) => current === id ? "" : current);
    }
    else setError("No pudimos eliminar el elemento.");
  };

  const duplicateFloorElement = async (element: FloorElement) => {
    try {
      const duplicate = await saveFloorElement({ ...element, id: "", label: `${element.label} ${t("copia", "copy", "cópia")}`, x: element.x + 24, y: element.y + 24 }, "POST");
      setFloorElements((current) => [...current, duplicate]);
      setSelectedFloorElementId(duplicate.id);
      setFloorElementLabelDraft(duplicate.label);
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : t("No pudimos duplicar el elemento.", "Could not duplicate the element.", "Não foi possível duplicar o elemento."));
    }
  };

  const resizeFloorElement = (element: FloorElement, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    const startX = event.clientX, startY = event.clientY, startWidth = element.width, startHeight = element.height;
    const room = spaceSizes[element.space] || { width: 1200, height: 700 };
    const minimum = minimumFloorElementSize(element.kind);
    const maxWidth = Math.max(20, Math.min(420, room.width - element.x));
    const maxHeight = Math.max(20, Math.min(260, room.height - element.y));
    let resized = element;
    const onMove = (moveEvent: PointerEvent) => {
      if (isCircularFloorElement(element.kind)) {
        const maxSize = Math.min(maxWidth, maxHeight);
        const requestedSize = Math.max(startWidth + (moveEvent.clientX - startX) / floorZoom, startHeight + (moveEvent.clientY - startY) / floorZoom);
        const size = Math.min(maxSize, Math.max(20, requestedSize));
        resized = updateFloorElement(element, { width: size, height: size });
      } else {
        resized = updateFloorElement(element, { width: Math.min(maxWidth, Math.max(Math.min(minimum.width, maxWidth), startWidth + (moveEvent.clientX - startX) / floorZoom)), height: Math.min(maxHeight, Math.max(Math.min(minimum.height, maxHeight), startHeight + (moveEvent.clientY - startY) / floorZoom)) });
      }
    };
    const onEnd = () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onEnd); persistFloorElement(resized, element); };
    document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onEnd);
  };

  const moveFloorElementWithPointer = (element: FloorElement, event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || !canEdit) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const room = spaceSizes[element.space] || { width: 1200, height: 700 };
    let moved = false;
    let movedElement = element;
    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / floorZoom;
      const deltaY = (moveEvent.clientY - startY) / floorZoom;
      if (!moved && Math.hypot(deltaX, deltaY) < 4) return;
      moved = true;
      movedElement = updateFloorElement(element, {
        x: Math.max(0, Math.min(room.width - element.width, element.x + deltaX)),
        y: Math.max(0, Math.min(room.height - element.height, element.y + deltaY)),
      });
    };
    const onEnd = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      document.removeEventListener("pointercancel", onEnd);
      if (moved) void persistFloorElement(movedElement, element);
    };
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onEnd);
    document.addEventListener("pointercancel", onEnd);
  };

  const loadPlanIcon = (source: string) => new Promise<HTMLImageElement | null>((resolve) => {
    if (!source) { resolve(null); return; }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });

  const drawTintedPlanIcon = (context: CanvasRenderingContext2D, icon: HTMLImageElement, size: number) => {
    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = Math.max(1, Math.round(size));
    iconCanvas.height = Math.max(1, Math.round(size));
    const iconContext = iconCanvas.getContext("2d");
    if (!iconContext) return false;
    iconContext.drawImage(icon, 0, 0, iconCanvas.width, iconCanvas.height);
    iconContext.globalCompositeOperation = "source-in";
    iconContext.fillStyle = "#078f96";
    iconContext.fillRect(0, 0, iconCanvas.width, iconCanvas.height);
    context.drawImage(iconCanvas, -size / 2, -size / 2, size, size);
    return true;
  };

  const createPlanImage = async (scale = planExportScale) => {
    const iconSources = [...new Set(floorElements.map((element) => floorElementIconPath(element.kind)).filter(Boolean))];
    const loadedIcons = new Map(await Promise.all(iconSources.map(async (source) => [source, await loadPlanIcon(source)] as const)));
    const width = 1200;
    const spaceHeight = 520;
    const canvas = document.createElement("canvas");
    const height = Math.max(spaceHeight, spaces.length * spaceHeight);
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    if (!context) return "";
    context.scale(scale, scale);
    context.fillStyle = "#f5f8f9";
    context.fillRect(0, 0, width, height);
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
        context.fillText(table.shape === "living" ? "Sin límite" : `${table.capacity} lugares`, x + 14, y + Math.min(58, tableHeight - 10));
      });
      floorElements.filter((element) => element.space === space).forEach((element) => {
        const x = Math.min(width - element.width, element.x);
        const y = top + 58 + Math.min(420, element.y);
        const iconOnly = floorElementNeedsIcon(element);
        context.save();
        context.translate(x + element.width / 2, y + element.height / 2);
        context.rotate(((element.rotation || 0) * Math.PI) / 180);
        context.fillStyle = "#dff5f2";
        context.strokeStyle = "#17384b";
        context.lineWidth = 2;
        context.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
        context.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
        context.fillStyle = "#17384b";
        context.font = `bold ${iconOnly ? Math.max(9, Math.min(18, Math.min(element.width, element.height) * .65)) : 16}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.beginPath();
        context.rect(-element.width / 2, -element.height / 2, element.width, element.height);
        context.clip();
        const icon = loadedIcons.get(floorElementIconPath(element.kind));
        if (iconOnly && icon) {
          const iconSize = Math.max(8, Math.min(24, element.width - 6, element.height - 6));
          drawTintedPlanIcon(context, icon, iconSize);
        } else {
          context.fillText(iconOnly ? floorElementIcon(element.kind) : element.label, 0, 0, Math.max(8, element.width - 8));
        }
        context.restore();
      });
    });
    return canvas.toDataURL("image/png");
  };

  const exportPlan = async () => {
    const image = await createPlanImage();
    if (!image) return;
    const link = document.createElement("a");
    link.download = "plano-de-mesas.png";
    link.href = image;
    link.click();
  };

  const previewPlan = async () => {
    const image = await createPlanImage();
    if (image) setPlanPreviewUrl(image);
  };

  const centerFloorPlan = () => {
    const container = floorSpacesRef.current;
    if (container) container.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  };

  const changeFloorZoom = (nextZoom: number) => {
    const container = floorSpacesRef.current;
    const previousZoom = floorZoom;
    const centerX = container ? (container.scrollLeft + container.clientWidth / 2) / previousZoom : 0;
    const centerY = container ? (container.scrollTop + container.clientHeight / 2) / previousZoom : 0;
    const normalized = Math.max(.45, Math.min(1.5, Number(nextZoom.toFixed(2))));
    setFloorZoom(normalized);
    requestAnimationFrame(() => {
      if (!container) return;
      container.scrollLeft = centerX * normalized - container.clientWidth / 2;
      container.scrollTop = centerY * normalized - container.clientHeight / 2;
    });
  };

  const fitFloorPlan = () => {
    const container = floorSpacesRef.current;
    if (!container) return;
    const widestSpace = Math.max(...spaces.map((space) => spaceSizes[space]?.width || 1200));
    changeFloorZoom(Math.min(1, (container.clientWidth - 16) / widestSpace));
    requestAnimationFrame(() => container.scrollTo({ left: 0, top: 0, behavior: "smooth" }));
  };

  const toggleFloorFullscreen = async () => {
    const panel = floorPlanRef.current;
    if (!panel) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await panel.requestFullscreen();
  };

  const exportDetailedReport = () => {
    const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
    const spaceSections = spaces.map((space) => {
      const spaceTables = tables.filter((table) => (table.space || "Espacio 1") === space);
      const drawingTables = spaceTables.map((table) => `<div class="draw-table" style="left:${Math.min(82, (table.x || 0) / 10)}%;top:${Math.min(82, (table.y || 0) / 5)}%;width:${Math.max(10, (table.width || 140) / 10)}%;height:${Math.max(9, (table.height || 70) / 5)}%"><b>${safe(table.name)}</b><span>${table.shape === "living" ? safe(t("Sin límite", "Unlimited", "Sem limite")) : `${table.capacity} ${safe(t("lugares", "seats", "lugares"))}`}</span></div>`).join("");
      const drawingElements = floorElements.filter((element) => element.space === space).map((element) => {
        const iconOnly = floorElementNeedsIcon(element);
        const iconPath = floorElementIconPath(element.kind);
        const content = iconOnly && iconPath ? `<i aria-hidden="true" style="--element-icon:url('${safe(`${window.location.origin}${iconPath}`)}')"></i>` : safe(iconOnly ? floorElementIcon(element.kind) : element.label);
        return `<div class="draw-element${iconOnly ? " icon-only" : ""}" title="${safe(element.label)}" style="left:${Math.min(84, element.x / 10)}%;top:${Math.min(84, element.y / 5)}%;width:${Math.max(2, element.width / 10)}%;height:${Math.max(2, element.height / 5)}%;transform:rotate(${element.rotation || 0}deg)">${content}</div>`;
      }).join("");
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
        return `<article class="table-detail"><h3>${safe(table.name)}</h3><p><b>${occupied}</b> ${safe(table.shape === "living" ? t("personas · sin límite", "people · unlimited", "pessoas · sem limite") : t(`de ${table.capacity} lugares ocupados`, `of ${table.capacity} occupied seats`, `de ${table.capacity} lugares ocupados`))}${table.note ? ` · ${safe(table.note)}` : ""}</p>${operationalSummary.length ? `<div class="ops"><b>${safe(t("Operativa", "Operations", "Operação"))}:</b> ${operationalSummary.map(safe).join(" · ")}</div>` : ""}<ul>${seats.length ? seats.map((seat) => { const needs = [seat.menu, seat.food, seat.accessibility].filter(meaningfulGuestValue); return `<li><b>${table.shape === "living" ? safe(t("Zona", "Zone", "Zona")) : `${safe(t("Asiento", "Seat", "Assento"))} ${seat.seat}`}</b> · ${safe(seat.name)} <span>${safe(seat.category)}${needs.length ? ` · ${needs.map(safe).join(" · ")}` : ""}</span></li>`; }).join("") : `<li>${safe(t("Sin invitados asignados", "No assigned guests", "Sem convidados atribuídos"))}</li>`}</ul></article>`;
      }).join("");
      return `<section><h2>${safe(space)}</h2><div class="drawing">${drawingElements}${drawingTables}</div><div class="details">${details || `<p>${safe(t("Sin mesas en este espacio", "No tables in this space", "Sem mesas neste espaço"))}</p>`}</div></section>`;
    }).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safe(t("Reporte de mesas", "Table report", "Relatório de mesas"))}</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font:12px Arial;color:#19354d;margin:0}header{display:flex;justify-content:space-between;border-bottom:2px solid #0aabb0;padding-bottom:10px;margin-bottom:18px}h1{margin:0;font:28px Georgia}header p{margin:6px 0 0;color:#718292}section{page-break-after:always}section:last-child{page-break-after:auto}h2{font:22px Georgia}.drawing{position:relative;height:360px;border:2px dashed #b9d9dc;border-radius:12px;background:#f8fbfc;overflow:hidden}.draw-table,.draw-element{position:absolute;display:grid;place-items:center;text-align:center;padding:6px;border-radius:9px}.draw-table{border:2px solid #0aabb0;background:#fff}.draw-table b{font-size:11px}.draw-table span,.draw-element{font-size:9px}.draw-element{border:1px solid #dde6ea;background:#dff5f2;color:#078f96;font-weight:bold}.draw-element.icon-only{padding:2px}.draw-element.icon-only i{display:block;width:min(22px,80%);height:min(22px,80%);background:#078f96;-webkit-mask:var(--element-icon) center/contain no-repeat;mask:var(--element-icon) center/contain no-repeat}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.table-detail{border:1px solid #dde6ea;border-radius:10px;padding:12px;break-inside:avoid}.table-detail h3{margin:0 0 5px}.table-detail p{margin:0 0 8px;color:#718292}.table-detail .ops{margin:8px 0;padding:7px;border-radius:6px;background:#fff6dd;color:#694f08;font-size:9px}.table-detail ul{margin:0;padding-left:18px}.table-detail li{margin:4px 0}.table-detail li span{color:#718292}footer{position:fixed;bottom:0;right:0;color:#718292;font-size:9px}@media print{.print-action{display:none}}</style></head><body><header><div><h1>${safe(t("Plano y reporte de mesas", "Table plan and report", "Plano e relatório de mesas"))}</h1><p>${safe(t("Distribución completa del evento", "Complete event layout", "Distribuição completa do evento"))}</p></div><button class="print-action" onclick="window.print()">${safe(t("Guardar como PDF o imprimir", "Save as PDF or print", "Salvar como PDF ou imprimir"))}</button></header>${spaceSections}<footer>${new Date().toLocaleDateString()}</footer></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  function seatingRowsForTable(table: EventTable) {
    const tableGuests = table.guests.map((id) => guests.find((guest) => guest.id === id)).filter(Boolean) as Guest[];
    if (table.shape === "living") {
      return tableGuests.flatMap((guest) => [guest.name, ...guest.companions.map((companion) => companion.name).filter(Boolean)].map((name) => ({
        table: table.name, seat: "", name, category: guest.guestType === "child" ? t("Niño/a", "Child", "Criança") : guest.guestType === "teen" ? t("Adolescente", "Teenager", "Adolescente") : t("Adulto", "Adult", "Adulto"),
        menu: guest.menuChoice || "", food: meaningfulGuestValue(guest.food) ? guest.food : "", accessibility: guest.accessibilityNeeds || "", notes: guest.guestNotes || "",
      })));
    }
    const slots: Array<{ guest: Guest; name: string } | undefined> = Array(table.capacity).fill(undefined);
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
      seat: String(index + 1),
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
    const previous = savedSpaceSizesRef.current[space] || { width: 1200, height: 700 };
    const next = { width: Math.max(700, Math.min(2400, width)), height: Math.max(480, Math.min(1800, height)) };
    setSpaceSizes((current) => ({ ...current, [space]: next }));
    setFloorSaveStatus("saving");
    try {
      const response = await fetch("/api/admin/tables", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "space-settings", space, ...next }) });
      const result = await readApiJson<{ space?: { name: string; width: number; height: number }; error?: string }>(response, t("El servicio del plano no está disponible.", "The layout service is unavailable.", "O serviço do plano não está disponível."));
      if (!response.ok || !result.space) throw new Error(result.error || t("No pudimos guardar el tamaño del espacio.", "Could not save space size.", "Não foi possível salvar o tamanho do espaço."));
      const confirmed = { width: result.space.width, height: result.space.height };
      savedSpaceSizesRef.current = { ...savedSpaceSizesRef.current, [space]: confirmed };
      setSpaceSizes((current) => ({ ...current, [space]: confirmed }));
      const tablesToFit = tables.filter((table) => (table.space || "Espacio 1") === space).map((table) => ({
        before: table,
        after: { ...table, x: Math.max(0, Math.min(confirmed.width - (table.width || 140), table.x ?? 24)), y: Math.max(0, Math.min(confirmed.height - (table.height || 70), table.y ?? 24)) },
      })).filter(({ before, after }) => before.x !== after.x || before.y !== after.y);
      const elementsToFit = floorElements.filter((element) => element.space === space).map((element) => ({
        before: element,
        after: { ...element, x: Math.max(0, Math.min(confirmed.width - element.width, element.x)), y: Math.max(0, Math.min(confirmed.height - element.height, element.y)) },
      })).filter(({ before, after }) => before.x !== after.x || before.y !== after.y);
      setTables((current) => current.map((table) => tablesToFit.find(({ before }) => before.id === table.id)?.after || table));
      setFloorElements((current) => current.map((element) => elementsToFit.find(({ before }) => before.id === element.id)?.after || element));
      let repositionFailures = 0;
      await Promise.all([
        ...tablesToFit.map(async ({ before, after }) => {
          try { mergeSavedTableLayout(await saveTableLayout(after)); }
          catch { repositionFailures += 1; setTables((current) => current.map((table) => table.id === before.id ? before : table)); }
        }),
        ...elementsToFit.map(async ({ before, after }) => {
          try { const saved = await saveFloorElement(after); setFloorElements((current) => current.map((element) => element.id === saved.id ? { ...element, ...saved } : element)); }
          catch { repositionFailures += 1; setFloorElements((current) => current.map((element) => element.id === before.id ? before : element)); }
        }),
      ]);
      if (repositionFailures) throw new Error(t("Guardamos el tamaño, pero algunos elementos no pudieron reubicarse.", "The room size was saved, but some elements could not be repositioned.", "O tamanho foi salvo, mas alguns elementos não puderam ser reposicionados."));
      setFloorSaveStatus("saved");
      if (tablesToFit.length + elementsToFit.length > 0) {
        setLayoutNotice(t(`${tablesToFit.length + elementsToFit.length} elementos se ajustaron al nuevo tamaño.`, `${tablesToFit.length + elementsToFit.length} elements were fitted to the new size.`, `${tablesToFit.length + elementsToFit.length} elementos foram ajustados ao novo tamanho.`));
        window.setTimeout(() => setLayoutNotice(""), 2200);
      }
      window.setTimeout(() => setFloorSaveStatus((current) => current === "saved" ? "idle" : current), 1800);
    } catch (spaceError) {
      if (savedSpaceSizesRef.current[space]?.width === previous.width && savedSpaceSizesRef.current[space]?.height === previous.height) setSpaceSizes((current) => ({ ...current, [space]: previous }));
      setFloorSaveStatus("error");
      setError(spaceError instanceof Error ? spaceError.message : t("No pudimos guardar el tamaño del espacio.", "Could not save space size.", "Não foi possível salvar o tamanho do espaço."));
    }
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
                  "Creá las mesas, ubicá a los invitados, revisá la distribución y después diseñá el salón.",
                  "Create tables, seat guests, review the arrangement, and then design the venue.",
                  "Crie as mesas, aloque os convidados, revise a distribuição e depois desenhe o salão.",
                )
              : t(
                  "Consultá la distribución y capacidad de las mesas.",
                  "View table distribution and capacity.",
                  "Consulte a distribuição e capacidade das mesas.",
                )}
          </p>
        </div>
        <div className="seating-heading-controls">
          <nav className="seating-mode-tabs" aria-label={t("Vistas de organización", "Planning views", "Vistas de organização")}>
            <button aria-pressed={!layoutMode} onClick={() => setLayoutMode(false)}><span className="seating-tab-icon is-guests" aria-hidden="true" />{t("Personas y mesas", "People and tables", "Pessoas e mesas")}</button>
            <button aria-pressed={layoutMode} onClick={() => setLayoutMode(true)}><span className="seating-tab-icon is-plan" aria-hidden="true" />{t("Plano del salón", "Venue layout", "Plano do salão")}</button>
          </nav>
          <div className="heading-actions">
            <button className={`outline-button ${showExportCenter ? "active" : ""}`} onClick={() => setShowExportCenter((current) => !current)}><span className="admin-action-icon is-print" aria-hidden="true" />{t("Compartir e imprimir", "Share and print", "Compartilhar e imprimir")}</button>
            <button className={`outline-button ${layoutMode ? "active" : ""}`} onClick={() => setLayoutMode((value) => !value)}><span className={`admin-action-icon ${layoutMode ? "is-guests" : "is-plan"}`} aria-hidden="true" />{layoutMode ? t("Ver lista", "View list", "Ver lista") : t("Editar plano", "Edit layout", "Editar plano")}</button>
            {canEdit && <button className="primary-button small" onClick={() => openNew()}>＋ {t("Agregar mesa", "Add table", "Adicionar mesa")}</button>}
          </div>
        </div>
      </div>
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
          <button onClick={exportSocialConflicts}>⇩ CSV</button>
        </section>
      )}

      <section className="seating-overview">
      <div className="seating-summary">
        <article>
          <span>{t("Mesas creadas", "Tables created", "Mesas criadas")}</span>
          <strong>{tables.length}</strong>
          <small>
            {totalCapacity}{" "}
            {t("lugares en mesas · Living sin límite", "table seats · unlimited Living", "lugares em mesas · Living sem limite")}
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
      </div>
      </section>

      {showExportCenter && <section className="seating-export-center" aria-labelledby="export-center-title">
        <header>
          <div><span className="seating-kicker">{t("Entregables", "Deliverables", "Entregáveis")}</span><h2 id="export-center-title">{t("Elegí qué necesita recibir cada persona", "Choose what each person needs to receive", "Escolha o que cada pessoa precisa receber")}</h2><p>{t("Cada archivo muestra una cantidad distinta de información. Revisá las alertas antes de compartir la versión final.", "Each file contains a different level of detail. Review alerts before sharing the final version.", "Cada arquivo mostra um nível diferente de detalhe. Revise os alertas antes de compartilhar a versão final.")}</p></div>
          <button className="export-center-close" onClick={() => setShowExportCenter(false)} aria-label={t("Cerrar exportaciones", "Close exports", "Fechar exportações")}>×</button>
        </header>
        <div className={`export-readiness ${unassigned.length || socialConflicts.length || overCapacityTables.length || overlappingTableIds.size ? "has-warnings" : "is-ready"}`}>
          <span>{unassigned.length || socialConflicts.length || overCapacityTables.length || overlappingTableIds.size ? "⚠" : "✓"}</span>
          <div><strong>{unassigned.length || socialConflicts.length || overCapacityTables.length || overlappingTableIds.size ? t("Conviene revisar antes de compartir", "Review before sharing", "É recomendável revisar antes de compartilhar") : t("La distribución está lista para compartir", "The layout is ready to share", "A distribuição está pronta para compartilhar")}</strong><p>{[
            unassigned.length ? `${totalConfirmed - assignedPeople} ${t("personas sin mesa", "people without a table", "pessoas sem mesa")}` : "",
            socialConflicts.length ? `${socialConflicts.length} ${t("preferencias en conflicto", "seating conflicts", "preferências em conflito")}` : "",
            overCapacityTables.length ? `${overCapacityTables.length} ${t("mesas con sobrecupo", "tables over capacity", "mesas acima da capacidade")}` : "",
            overlappingTableIds.size ? `${overlappingTableIds.size} ${t("mesas superpuestas", "overlapping tables", "mesas sobrepostas")}` : "",
          ].filter(Boolean).join(" · ") || t("No detectamos asuntos pendientes en mesas, capacidad o plano.", "No pending issues were found in tables, capacity, or layout.", "Não foram encontrados assuntos pendentes em mesas, capacidade ou plano.")}</p></div>
        </div>
        <div className="export-workspace">
          <nav className="export-picker" aria-label={t("Tipo de entregable", "Deliverable type", "Tipo de entregável")}>
            <button className={exportSelection === "coordination" ? "active" : ""} aria-pressed={exportSelection === "coordination"} onClick={() => setExportSelection("coordination")}><span>▤</span><b>{t("Coordinación", "Coordination", "Coordenação")}</b><small>{t("Reporte completo", "Complete report", "Relatório completo")}</small></button>
            <button className={exportSelection === "catering" ? "active" : ""} aria-pressed={exportSelection === "catering"} onClick={() => setExportSelection("catering")}><span>☷</span><b>{t("Gastronomía", "Catering", "Gastronomia")}</b><small>{t("Listado por mesa", "List by table", "Lista por mesa")}</small></button>
            <button className={exportSelection === "layout" ? "active" : ""} aria-pressed={exportSelection === "layout"} onClick={() => setExportSelection("layout")}><span>⌗</span><b>{t("Montaje", "Setup", "Montagem")}</b><small>{t("Imagen del plano", "Layout image", "Imagem do plano")}</small></button>
          </nav>
          <article className="export-detail">
            {exportSelection === "coordination" && <><div className="export-detail-copy"><span className="export-audience">{t("Para coordinación", "For coordination", "Para coordenação")}</span><h3>{t("Reporte completo", "Complete report", "Relatório completo")}</h3><p>{t("Reúne plano, mesas, asientos, invitados y necesidades en un documento listo para imprimir o guardar como PDF.", "Combines layout, tables, seats, guests, and needs in a document ready to print or save as PDF.", "Reúne plano, mesas, assentos, convidados e necessidades em um documento pronto para imprimir ou salvar como PDF.")}</p><ul><li>{tables.length} {t("mesas", "tables", "mesas")}</li><li>{assignedPeople} {t("personas ubicadas", "people seated", "pessoas alocadas")}</li><li>{t("Incluye información privada", "Includes private information", "Inclui informação privada")}</li></ul><button className="primary-button small" onClick={exportDetailedReport}>▤ {t("Abrir reporte", "Open report", "Abrir relatório")}</button></div><div className="export-document-preview"><span>{t("REPORTE DE COORDINACIÓN", "COORDINATION REPORT", "RELATÓRIO DE COORDENAÇÃO")}</span><strong>{t("Organización del salón", "Venue organization", "Organização do salão")}</strong><div className="export-preview-metrics"><i>{tables.length}<small>{t("Mesas", "Tables", "Mesas")}</small></i><i>{assignedPeople}<small>{t("Ubicados", "Seated", "Alocados")}</small></i><i>{totalConfirmed - assignedPeople}<small>{t("Sin mesa", "Unseated", "Sem mesa")}</small></i></div><p>{t("Plano + detalle por mesa + necesidades", "Layout + table details + needs", "Plano + detalhe por mesa + necessidades")}</p></div></>}
            {exportSelection === "catering" && <><div className="export-detail-copy"><span className="export-audience">{t("Para gastronomía", "For catering", "Para gastronomia")}</span><h3>{t("Listado de catering", "Catering list", "Lista de catering")}</h3><p>{t("Descarga una planilla CSV ordenada por mesa y asiento con menú, restricciones, accesibilidad y observaciones.", "Download a CSV sorted by table and seat with menu, dietary needs, accessibility, and notes.", "Baixe uma planilha CSV ordenada por mesa e assento com menu, restrições, acessibilidade e observações.")}</p><ul><li>{t("Una fila por persona", "One row per person", "Uma linha por pessoa")}</li><li>{t("Ordenado por mesa y asiento", "Sorted by table and seat", "Ordenado por mesa e assento")}</li><li>{t("Contiene datos sensibles", "Contains sensitive data", "Contém dados sensíveis")}</li></ul><button className="primary-button small" onClick={exportCateringReport}>⇩ {t("Descargar CSV", "Download CSV", "Baixar CSV")}</button></div><div className="export-sheet-preview"><div><b>{t("Mesa", "Table", "Mesa")}</b><b>{t("Invitado", "Guest", "Convidado")}</b><b>{t("Necesidad", "Need", "Necessidade")}</b></div><div><span>01</span><span>{t("Invitado confirmado", "Confirmed guest", "Convidado confirmado")}</span><span>{t("Sin gluten", "Gluten-free", "Sem glúten")}</span></div><div><span>01</span><span>{t("Acompañante", "Plus-one", "Acompanhante")}</span><span>—</span></div><div><span>02</span><span>{t("Invitado confirmado", "Confirmed guest", "Convidado confirmado")}</span><span>{t("Accesibilidad", "Accessibility", "Acessibilidade")}</span></div><small>{t("La descarga incluye los datos reales; esta muestra no.", "The download includes real data; this preview does not.", "O download inclui dados reais; esta prévia não.")}</small></div></>}
            {exportSelection === "layout" && <><div className="export-detail-copy"><span className="export-audience">{t("Para montaje", "For setup", "Para montagem")}</span><h3>{t("Imagen del plano", "Layout image", "Imagem do plano")}</h3><p>{t("Genera un PNG limpio con la posición de mesas y elementos, sin nombres ni necesidades de invitados.", "Creates a clean PNG with tables and elements, without guest names or needs.", "Gera um PNG limpo com mesas e elementos, sem nomes nem necessidades dos convidados.")}</p><label className="export-quality">{t("Calidad de imagen", "Image quality", "Qualidade da imagem")}<select value={planExportScale} onChange={(event) => setPlanExportScale(Number(event.target.value))}><option value={1}>{t("Estándar · compartir", "Standard · sharing", "Padrão · compartilhar")}</option><option value={2}>{t("Alta · recomendada", "High · recommended", "Alta · recomendada")}</option><option value={3}>{t("Máxima · impresión", "Maximum · print", "Máxima · impressão")}</option></select></label><div className="export-card-actions"><button className="outline-button" onClick={previewPlan}>◎ {t("Vista previa", "Preview", "Prévia")}</button><button className="primary-button small" onClick={exportPlan}>▧ {t("Descargar PNG", "Download PNG", "Baixar PNG")}</button></div></div><div className="export-layout-preview" aria-hidden="true"><span>{t("PLANO SIN DATOS PRIVADOS", "LAYOUT WITHOUT PRIVATE DATA", "PLANO SEM DADOS PRIVADOS")}</span><div><i /><i /><i /><i className="square" /><i /></div><small>{t("Mesas, zonas y elementos del salón", "Tables, areas, and venue elements", "Mesas, áreas e elementos do salão")}</small></div></>}
          </article>
          {socialConflicts.length > 0 && <aside className="export-private-review"><div><strong>{t("Revisión interna disponible", "Internal review available", "Revisão interna disponível")}</strong><span>{t("Las preferencias sociales se exportan aparte y no deben compartirse con proveedores.", "Social preferences are exported separately and should not be shared with vendors.", "As preferências sociais são exportadas separadamente e não devem ser compartilhadas com fornecedores.")}</span></div><button className="outline-button" onClick={exportSocialConflicts}>⇩ {t("Descargar revisión", "Download review", "Baixar revisão")}</button></aside>}
        </div>
      </section>}

      {planPreviewUrl && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="plan-preview-title" onMouseDown={() => setPlanPreviewUrl("")}><div className="modal plan-preview-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPlanPreviewUrl("")} aria-label={t("Cerrar vista previa", "Close preview", "Fechar prévia")}>×</button><span className="eyebrow">PNG · {planExportScale}×</span><h2 id="plan-preview-title">{t("Vista previa del plano", "Layout preview", "Prévia do plano")}</h2><p>{t("Esta versión no incluye datos privados de los invitados.", "This version excludes private guest data.", "Esta versão não inclui dados privados dos convidados.")}</p><div className="plan-preview-frame"><img src={planPreviewUrl} alt={t("Vista previa exportable del plano", "Exportable layout preview", "Prévia exportável do plano")} /></div><div className="modal-actions"><button className="outline-button" onClick={() => setPlanPreviewUrl("")}>{t("Volver", "Back", "Voltar")}</button><button className="primary-button" onClick={exportPlan}>⇩ {t("Descargar PNG", "Download PNG", "Baixar PNG")}</button><button className="outline-button" onClick={exportDetailedReport}>▤ {t("Abrir PDF imprimible", "Open printable PDF", "Abrir PDF imprimível")}</button></div></div></div>}

      {layoutMode && (
        <section className="panel floor-plan-panel" ref={floorPlanRef}>
          <div className="floor-plan-legend" aria-label={t("Leyenda del plano", "Layout legend", "Legenda do plano")}>
            <strong>{t("Leyenda", "Legend", "Legenda")}</strong>
            <span><i className="legend-table" />{t("Mesa editable", "Editable table", "Mesa editável")}</span>
            <span><i className="legend-locked" />{t("Mesa bloqueada", "Locked table", "Mesa bloqueada")}</span>
            <span><i className="legend-overlap" />{t("Superposición", "Overlap", "Sobreposição")}</span>
            <span><i className="legend-service" />{t("Zona o servicio", "Area or service", "Área ou serviço")}</span>
          </div>
          <div className="floor-plan-toolbar">
            <strong>{t("Plano arrastrable", "Draggable layout", "Plano arrastável")}</strong>
            <span>{t("Arrastrá cada mesa hasta su posición.", "Drag each table into position.", "Arraste cada mesa para sua posição.")}</span>
            {canEdit && <button className="outline-button compact" onClick={() => setSpaces((current) => [...current, `Espacio ${current.length + 1}`])}>＋ {t("Agregar espacio", "Add space", "Adicionar espaço")}</button>}
            {canEdit && <button className="primary-button small" disabled={saving} onClick={savePlan}>{saving ? t("Guardando…", "Saving…", "Salvando…") : t("Guardar modificaciones", "Save changes", "Salvar alterações")}</button>}
            <button className="outline-button compact" onClick={exportPlan}>⇩ PNG</button>
            <div className="floor-zoom" aria-label={t("Zoom del plano", "Layout zoom", "Zoom do plano")}>
              <button onClick={() => changeFloorZoom(floorZoom - .1)}>−</button>
              <span>{Math.round(floorZoom * 100)}%</span>
              <button onClick={() => changeFloorZoom(floorZoom + .1)}>＋</button>
              <button onClick={() => changeFloorZoom(1)}>↺</button>
            </div>
            <button className="outline-button compact" onClick={fitFloorPlan}>↔ {t("Ajustar al salón", "Fit venue", "Ajustar ao salão")}</button>
            <button className="outline-button compact" onClick={centerFloorPlan}>⌖ {t("Ir al inicio", "Go to start", "Ir ao início")}</button>
            <button className="outline-button compact" onClick={() => void toggleFloorFullscreen()}>⛶ {t("Pantalla completa", "Fullscreen", "Tela cheia")}</button>
            <button className={`outline-button compact ${showFloorLibrary ? "active" : ""}`} onClick={() => setShowFloorLibrary((value) => !value)}>◧ {showFloorLibrary ? t("Ocultar elementos", "Hide elements", "Ocultar elementos") : t("Mostrar elementos", "Show elements", "Mostrar elementos")}</button>
            <button className={`outline-button compact ${showFloorInspector ? "active" : ""}`} disabled={!selectedLayoutTableId && !selectedFloorElementId} onClick={() => setShowFloorInspector((value) => !value)}>◨ {showFloorInspector ? t("Ocultar inspector", "Hide inspector", "Ocultar inspetor") : t("Mostrar inspector", "Show inspector", "Mostrar inspetor")}</button>
            <button className={`outline-button compact ${snapToGrid ? "active" : ""}`} title={t("La cuadrícula alinea los elementos en incrementos regulares", "The grid aligns elements at regular intervals", "A grade alinha os elementos em intervalos regulares")} onClick={() => setSnapToGrid((value) => !value)}>⠿ {snapToGrid ? t("Cuadrícula activa", "Grid on", "Grade ativa") : t("Movimiento libre", "Free movement", "Movimento livre")}</button>
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
          <div className={`floor-save-status is-${floorSaveStatus}`} role="status"><i />{floorSaveStatus === "saving" ? t("Guardando cambio…", "Saving change…", "Salvando alteração…") : floorSaveStatus === "saved" ? t("Cambio guardado", "Change saved", "Alteração salva") : floorSaveStatus === "error" ? t("El cambio no se guardó", "Change not saved", "A alteração não foi salva") : t("Los cambios se guardan automáticamente", "Changes save automatically", "As alterações são salvas automaticamente")}{floorSaveStatus === "error" && failedFloorSave && <button onClick={() => void retryFloorElementSave()}>{t("Reintentar", "Retry", "Tentar novamente")}</button>}</div>
          {overlappingTableIds.size > 0 && <p className="layout-overlap-warning" role="alert">⚠ {t(`${overlappingTableIds.size} mesas están superpuestas o demasiado juntas.`, `${overlappingTableIds.size} tables overlap or are too close.`, `${overlappingTableIds.size} mesas estão sobrepostas ou muito próximas.`)}</p>}
          <div className={`floor-editor ${(selectedLayoutTableId || selectedFloorElementId) && showFloorInspector ? "has-inspector" : ""} ${!showFloorLibrary ? "library-hidden" : ""}`}>
            {canEdit && showFloorLibrary && <aside className="floor-elements-menu">
              <strong>{t("Elementos del salón", "Venue elements", "Elementos do salão")}</strong>
              <p>{t("Arrastrá o hacé clic para colocar. Elegí una categoría para encontrar cada objeto.", "Drag or click to place. Choose a category to find each object.", "Arraste ou clique para posicionar. Escolha uma categoria para encontrar cada objeto.")}</p>
              <nav className="floor-library-tabs" aria-label={t("Categorías de elementos", "Element categories", "Categorias de elementos")}>
                {(["main", "structure", "services", "furniture", "utilities"] as const).map((category) => <button key={category} className={floorLibraryCategory === category ? "active" : ""} onClick={() => setFloorLibraryCategory(category)}><span>{category === "main" ? t("Áreas principales", "Main areas", "Áreas principais") : category === "structure" ? t("Estructura", "Structure", "Estrutura") : category === "services" ? t("Servicios", "Services", "Serviços") : category === "furniture" ? t("Mobiliario", "Furniture", "Mobiliário") : t("Utilidades", "Utilities", "Utilidades")}</span><b>{category === "main" ? 7 : category === "structure" ? 5 : category === "services" ? 3 : category === "furniture" ? 4 : 2}</b><i>{floorLibraryCategory === category ? "⌃" : "⌄"}</i></button>)}
              </nav>
              <div className="floor-library-items">{({
                main: [["dance-floor", t("Pista de baile", "Dance floor", "Pista de dança")], ["stage", t("Escenario", "Stage", "Palco")], ["dj", t("DJ y sonido", "DJ and sound", "DJ e som")], ["cake", t("Área de torta", "Cake area", "Área do bolo")], ["gifts", t("Mesa de regalos", "Gift table", "Mesa de presentes")], ["hydration", t("Barra de bebidas", "Drinks bar", "Bar de bebidas")], ["buffet", "Buffet"]],
                structure: [["wall", t("Pared o muro", "Wall", "Parede ou muro")], ["entrance", t("Puerta o entrada", "Door or entrance", "Porta ou entrada")], ["window", t("Ventana", "Window", "Janela")], ["column", t("Columna o pilar", "Column or pillar", "Coluna ou pilar")], ["stairs", t("Escaleras", "Stairs", "Escadas")]],
                services: [["restroom", t("Baños", "Restrooms", "Banheiros")], ["kitchen", t("Cocina y servicio", "Kitchen and service", "Cozinha e serviço")], ["emergency", t("Salida de emergencia", "Emergency exit", "Saída de emergência")]],
                furniture: [["photo-booth", "Photo booth"], ["gourmet", "Living / Lounge"], ["fountain", t("Fuente o centro", "Fountain or centerpiece", "Fonte ou centro")], ["plant", t("Planta o maceta", "Plant or planter", "Planta ou vaso")]],
                utilities: [["custom", t("Texto o etiqueta", "Text or label", "Texto ou etiqueta")], ["divider", t("Línea o divisor", "Line or divider", "Linha ou divisor")]],
              }[floorLibraryCategory] as Array<[FloorElement["kind"], string]>).map(([kind, label]) => <button className="context-tip" data-help={t("Hacé clic para agregarlo al centro o arrastralo a una posición exacta.", "Click to add it to the center or drag it to an exact position.", "Clique para adicionar ao centro ou arraste para uma posição exata.")} key={kind} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", kind); event.dataTransfer.setData("text/new-element-kind", kind); event.dataTransfer.setData("text/new-element-label", label); setDraggedNewFloorElement({ kind, label }); }} onDragEnd={() => { setDraggedNewFloorElement(null); setFloorDropTarget(""); }} onClick={() => void addFloorElement(kind, label)}><i className={`library-icon is-${kind}`} /> <span><strong>{label}</strong></span></button>)}</div>
            </aside>}
            <div className="floor-spaces" ref={floorSpacesRef}>
          {spaces.map((space) => (
            <div className={`floor-space ${floorDropTarget === space && draggedNewFloorElement ? "is-drop-target" : ""}`} key={space} style={{ width: spaceSizes[space]?.width || 1200, height: spaceSizes[space]?.height || 700, transform: `scale(${floorZoom})`, transformOrigin: "top left", marginRight: (spaceSizes[space]?.width || 1200) * (floorZoom - 1), marginBottom: (spaceSizes[space]?.height || 700) * (floorZoom - 1) }} onClick={(event) => { if (event.target === event.currentTarget) { setSelectedLayoutTableId(""); setSelectedFloorElementId(""); } }} onDragEnter={(event) => { if (draggedNewFloorElement) { event.preventDefault(); setFloorDropTarget(space); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFloorDropTarget((current) => current === space ? "" : current); }} onDragOver={(event) => { event.preventDefault(); if (draggedNewFloorElement) { event.dataTransfer.dropEffect = "copy"; setFloorDropTarget(space); } }} onDrop={(event) => {
              if (!canEdit) return;
              event.preventDefault();
              const bounds = event.currentTarget.getBoundingClientRect();
              const table = tables.find((item) => item.id === event.dataTransfer.getData("text/table-id"));
              if (table) { void moveTable(table, space, (event.clientX - bounds.left) / floorZoom - (table.width || 140) / 2, (event.clientY - bounds.top) / floorZoom - (table.height || 70) / 2); return; }
              const element = floorElements.find((item) => item.id === event.dataTransfer.getData("text/element-id"));
              if (element) {
                const room = spaceSizes[space] || { width: 1200, height: 700 };
                const next = updateFloorElement(element, { space, x: Math.max(0, Math.min(room.width - element.width, (event.clientX - bounds.left) / floorZoom - element.width / 2)), y: Math.max(0, Math.min(room.height - element.height, (event.clientY - bounds.top) / floorZoom - element.height / 2)) });
                void persistFloorElement(next, element);
              }
              const newElementKind = (event.dataTransfer.getData("text/new-element-kind") || draggedNewFloorElement?.kind || "") as FloorElement["kind"];
              const newElementLabel = event.dataTransfer.getData("text/new-element-label") || draggedNewFloorElement?.label || t("Elemento", "Element", "Elemento");
              if (newElementKind) {
                const size = defaultFloorElementSize(newElementKind);
                void addFloorElement(newElementKind, newElementLabel, { space, x: (event.clientX - bounds.left) / floorZoom - size.width / 2, y: (event.clientY - bounds.top) / floorZoom - size.height / 2 });
              }
              setDraggedNewFloorElement(null);
              setFloorDropTarget("");
            }}>
              {floorDropTarget === space && draggedNewFloorElement && <span className="floor-drop-message">＋ {t(`Soltá para agregar ${draggedNewFloorElement.label}`, `Drop to add ${draggedNewFloorElement.label}`, `Solte para adicionar ${draggedNewFloorElement.label}`)}</span>}
              <div className="space-heading"><strong className="space-label">{space}</strong>{canEdit && <span title={t("Estas medidas definen el lienzo visual; mantené la proporción del plano real", "These values define the visual canvas; preserve the real layout proportions", "Estas medidas definem a tela visual; mantenha a proporção do plano real")}><label>{t("Ancho", "Width", "Largura")}<input type="number" min="700" max="2400" value={spaceSizes[space]?.width || 1200} onChange={(event) => setSpaceSizes((current) => ({ ...current, [space]: { width: Number(event.target.value), height: current[space]?.height || 700 } }))} onBlur={(event) => void saveSpaceSize(space, Number(event.target.value), spaceSizes[space]?.height || 700)} /></label><label>{t("Alto", "Height", "Altura")}<input type="number" min="480" max="1800" value={spaceSizes[space]?.height || 700} onChange={(event) => setSpaceSizes((current) => ({ ...current, [space]: { width: current[space]?.width || 1200, height: Number(event.target.value) } }))} onBlur={(event) => void saveSpaceSize(space, spaceSizes[space]?.width || 1200, Number(event.target.value))} /></label></span>}</div>
              {socialCircleFilter && (() => {
                const linkedTables = tables.filter((table) => (table.space || "Espacio 1") === space && table.guests.some((guestId) => normalizedReference(confirmedGuests.find((guest) => guest.id === guestId)?.socialCircle || "") === normalizedReference(socialCircleFilter)));
                const origin = linkedTables[0];
                return origin && linkedTables.length > 1 ? <svg className="floor-social-connectors" width="100%" height="100%" aria-label={`${t("Proximidad del círculo", "Circle proximity", "Proximidade do círculo")} ${socialCircleFilter}`}>{linkedTables.slice(1).map((table) => <line key={`${origin.id}-${table.id}`} x1={(origin.x || 24) + (origin.width || 140) / 2} y1={(origin.y || 24) + (origin.height || 70) / 2} x2={(table.x || 24) + (table.width || 140) / 2} y2={(table.y || 24) + (table.height || 70) / 2} />)}</svg> : null;
              })()}
              {tables.filter((table) => (table.space || "Espacio 1") === space).map((table) => (
                <article className={`floor-table is-${table.shape || "round"} ${table.locked ? "is-locked" : ""} ${overlappingTableIds.has(table.id) ? "has-overlap" : ""} ${selectedLayoutTableId === table.id ? "is-selected" : ""} ${socialCircleFilter && table.guests.some((guestId) => normalizedReference(confirmedGuests.find((guest) => guest.id === guestId)?.socialCircle || "") === normalizedReference(socialCircleFilter)) ? "has-social-circle" : ""}`} key={table.id} draggable={canEdit && !table.locked} role="button" tabIndex={0} aria-pressed={selectedLayoutTableId === table.id} aria-label={`${table.name}. ${table.shape === "living" ? t("Sin límite", "Unlimited", "Sem limite") : `${table.capacity} ${t("lugares", "seats", "lugares")}`}`} onClick={() => { setSelectedFloorElementId(""); setSelectedLayoutTableId(table.id); setLayoutTableNameDraft(table.name); setShowFloorInspector(true); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); } }} onDoubleClick={() => canEdit && openEdit(table)} onDragStart={(event) => event.dataTransfer.setData("text/table-id", table.id)} onPointerDown={(event) => moveTableWithPointer(table, event)} style={{ left: table.x || 24, top: table.y || 24, width: table.width || 140, height: table.height || 70 }}>
                  <div className="floor-table-shape" style={{ transform: `rotate(${table.rotation || 0}deg)` }} />
                  <strong>{table.name}</strong><small>{table.shape === "living" ? t("Sin límite", "Unlimited", "Sem limite") : `${table.capacity} ${t("lugares", "seats", "lugares")}`}</small>
                  {canEdit && !table.locked && selectedLayoutTableId === table.id && <button className="resize-handle" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => resizeTable(table, event)} aria-label={t("Cambiar tamaño de mesa", "Resize table", "Redimensionar mesa")} />}
                </article>
              ))}
              {floorElements.filter((element) => element.space === space).map((element) => { const iconOnly = floorElementNeedsIcon(element); return <article className={`floor-element is-${element.kind} ${iconOnly ? "is-icon-only" : ""} ${element.width < 44 || element.height < 44 ? "is-very-small" : ""} ${selectedFloorElementId === element.id ? "is-selected" : ""}`} key={element.id} draggable={canEdit} role="button" tabIndex={0} title={element.label} aria-label={element.label} aria-pressed={selectedFloorElementId === element.id} onClick={(event) => { event.stopPropagation(); setSelectedLayoutTableId(""); setSelectedFloorElementId(element.id); setFloorElementLabelDraft(element.label); setShowFloorInspector(true); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); } }} onDragStart={(event) => event.dataTransfer.setData("text/element-id", element.id)} onPointerDown={(event) => moveFloorElementWithPointer(element, event)} style={{ left: element.x, top: element.y, width: element.width, height: element.height, transform: `rotate(${element.rotation || 0}deg)` }}>
                {iconOnly ? <span className={`floor-element-icon is-${element.kind}`} aria-hidden="true">{floorElementIcon(element.kind)}</span> : <strong>{element.label}</strong>}
                {canEdit && selectedFloorElementId === element.id && <><button className="element-delete" onClick={(event) => { event.stopPropagation(); void deleteFloorElement(element.id); }} aria-label={`${t("Eliminar", "Delete", "Excluir")} ${element.label}`}>×</button><button className="resize-handle" onPointerDown={(event) => resizeFloorElement(element, event)} aria-label={t("Cambiar tamaño", "Resize", "Redimensionar")} /></>}
              </article>; })}
            </div>
          ))}
            </div>
            {selectedFloorElementId && showFloorInspector && (() => { const selectedElement = floorElements.find((element) => element.id === selectedFloorElementId); if (!selectedElement) return null; const minimumSize = minimumFloorElementSize(selectedElement.kind); return <aside className="floor-table-inspector floor-element-inspector">
              <header><div><span>{t("Elemento seleccionado", "Selected element", "Elemento selecionado")}</span><strong>{selectedElement.label}</strong></div><button onClick={() => setSelectedFloorElementId("")} aria-label={t("Cerrar inspector", "Close inspector", "Fechar inspetor")}>×</button></header>
              <label>{t("Nombre", "Name", "Nome")}<span className="table-name-save"><input value={floorElementLabelDraft} maxLength={120} onChange={(event) => setFloorElementLabelDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && floorElementLabelDraft.trim()) persistFloorElement(updateFloorElement(selectedElement, { label: floorElementLabelDraft.trim() })); }} /><button disabled={!floorElementLabelDraft.trim() || floorElementLabelDraft.trim() === selectedElement.label} onClick={() => persistFloorElement(updateFloorElement(selectedElement, { label: floorElementLabelDraft.trim() }))}>{t("Guardar", "Save", "Salvar")}</button></span></label>
              {isCircularFloorElement(selectedElement.kind) ? <div className="floor-element-size is-proportional"><label>{t("Tamaño", "Size", "Tamanho")}<input type="number" min="20" max="260" value={Math.round(selectedElement.width)} onChange={(event) => { const room = spaceSizes[selectedElement.space] || { width: 1200, height: 700 }; const size = Math.max(20, Math.min(260, room.width - selectedElement.x, room.height - selectedElement.y, Number(event.target.value))); updateFloorElement(selectedElement, { width: size, height: size }); }} onBlur={() => persistFloorElement(floorElements.find((element) => element.id === selectedElement.id) || selectedElement)} /></label></div> : <div className="floor-element-size"><label>{t("Ancho", "Width", "Largura")}<input type="number" min={minimumSize.width} max="420" value={selectedElement.width} onChange={(event) => updateFloorElement(selectedElement, { width: Math.max(minimumSize.width, Math.min(420, Number(event.target.value))) })} onBlur={() => persistFloorElement(floorElements.find((element) => element.id === selectedElement.id) || selectedElement)} /></label><label>{t("Alto", "Height", "Altura")}<input type="number" min={minimumSize.height} max="260" value={selectedElement.height} onChange={(event) => updateFloorElement(selectedElement, { height: Math.max(minimumSize.height, Math.min(260, Number(event.target.value))) })} onBlur={() => persistFloorElement(floorElements.find((element) => element.id === selectedElement.id) || selectedElement)} /></label></div>}
              <div className="floor-element-position"><label>{t("Posición X", "X position", "Posição X")}<input type="number" min="0" max={(spaceSizes[selectedElement.space]?.width || 1200) - selectedElement.width} value={Math.round(selectedElement.x)} onChange={(event) => updateFloorElement(selectedElement, { x: Math.max(0, Math.min((spaceSizes[selectedElement.space]?.width || 1200) - selectedElement.width, Number(event.target.value))) })} onBlur={() => void persistFloorElement(floorElements.find((element) => element.id === selectedElement.id) || selectedElement)} /></label><label>{t("Posición Y", "Y position", "Posição Y")}<input type="number" min="0" max={(spaceSizes[selectedElement.space]?.height || 700) - selectedElement.height} value={Math.round(selectedElement.y)} onChange={(event) => updateFloorElement(selectedElement, { y: Math.max(0, Math.min((spaceSizes[selectedElement.space]?.height || 700) - selectedElement.height, Number(event.target.value))) })} onBlur={() => void persistFloorElement(floorElements.find((element) => element.id === selectedElement.id) || selectedElement)} /></label></div>
              {(["wall", "divider", "door", "window", "stage", "dj", "buffet", "gifts", "hydration", "gourmet", "photo-booth", "entrance", "emergency"] as FloorElement["kind"][]).includes(selectedElement.kind) && <fieldset className="floor-element-rotation"><legend>{t("Rotación", "Rotation", "Rotação")}</legend><div>{[0, 45, 90, 180, 270].map((rotation) => <button key={rotation} className={(selectedElement.rotation || 0) === rotation ? "active" : ""} onClick={() => void persistFloorElement(updateFloorElement(selectedElement, { rotation }), selectedElement)}>{rotation}°</button>)}</div></fieldset>}
              <div className="floor-element-actions"><button disabled={!canEdit} onClick={() => void duplicateFloorElement(selectedElement)}>{t("Duplicar", "Duplicate", "Duplicar")}</button><button className="is-danger" disabled={!canEdit} onClick={() => void deleteFloorElement(selectedElement.id)}>{t("Eliminar", "Delete", "Excluir")}</button></div>
              <small>{t("Arrastralo para moverlo o usá X/Y para ubicarlo con precisión. El control de la esquina cambia su tamaño.", "Drag it to move it or use X/Y for precise placement. The corner control resizes it.", "Arraste para mover ou use X/Y para posicionar com precisão. O controle do canto redimensiona.")}</small>
            </aside>; })()}
            {selectedLayoutTableId && showFloorInspector && (() => { const selectedTable = tables.find((table) => table.id === selectedLayoutTableId); if (!selectedTable) return null; const selectedTableGuests = selectedTable.guests.map((guestId) => confirmedGuests.find((guest) => guest.id === guestId)).filter(Boolean) as Guest[]; const occupied = selectedTableGuests.reduce((total, guest) => total + confirmedPeopleForGuest(guest, guests), 0); const selectedMenuSummary = new Map<string, number>(); selectedTableGuests.forEach((guest) => { if (meaningfulGuestValue(guest.menuChoice)) selectedMenuSummary.set(guest.menuChoice, (selectedMenuSummary.get(guest.menuChoice) || 0) + confirmedPeopleForGuest(guest, guests)); }); const selectedDietaryAlerts = selectedTableGuests.flatMap((guest) => [meaningfulGuestValue(guest.food) ? `${guest.name}: ${guest.food}` : "", ...guest.companions.filter((companion) => meaningfulGuestValue(companion.food)).map((companion) => `${companion.name || guest.name}: ${companion.food}`)]).filter(Boolean); const selectedAccessibilityAlerts = selectedTableGuests.filter((guest) => meaningfulGuestValue(guest.accessibilityNeeds)); const selectedSocialConflicts = socialConflicts.filter((conflict) => conflict.tableId === selectedTable.id); const lastAssignedSeat = selectedTable.guests.reduce((lastSeat, guestId) => { const start = selectedTable.seatAssignments?.[guestId] || 0; const guest = confirmedGuests.find((candidate) => candidate.id === guestId); return start && guest ? Math.max(lastSeat, start + confirmedPeopleForGuest(guest, guests) - 1) : lastSeat; }, 0); const minimumCapacity = Math.max(1, occupied, lastAssignedSeat); return <aside className="floor-table-inspector">
              <header><div><span>{t("Mesa seleccionada", "Selected table", "Mesa selecionada")}</span><strong>{selectedTable.name}</strong></div><button onClick={() => setSelectedLayoutTableId("")} aria-label={t("Cerrar inspector", "Close inspector", "Fechar inspetor")}>×</button></header>
              <label>{t("Nombre de la mesa", "Table name", "Nome da mesa")}<span className="table-name-save"><input value={layoutTableNameDraft} maxLength={120} onChange={(event) => setLayoutTableNameDraft(event.target.value)} onBlur={() => { if (layoutTableNameDraft.trim() && layoutTableNameDraft.trim() !== selectedTable.name) void renameTableInline(selectedTable, layoutTableNameDraft); }} onKeyDown={(event) => { if (event.key === "Enter") { event.currentTarget.blur(); } }} /><button disabled={saving || !layoutTableNameDraft.trim() || layoutTableNameDraft.trim() === selectedTable.name} onMouseDown={(event) => event.preventDefault()} onClick={() => void renameTableInline(selectedTable, layoutTableNameDraft)}>{saving ? "…" : t("Guardar", "Save", "Salvar")}</button></span></label>
              <div className="floor-inspector-capacity"><span>{t("Ocupación", "Occupancy", "Ocupação")}</span><strong>{selectedTable.shape === "living" ? `${occupied} ${t("personas", "people", "pessoas")}` : `${occupied}/${selectedTable.capacity}`}</strong>{selectedTable.shape !== "living" && <><div className="capacity-stepper"><button disabled={saving || selectedTable.capacity <= minimumCapacity} onClick={() => void updateTableCapacityInline(selectedTable, selectedTable.capacity - 1)} aria-label={t("Quitar un lugar", "Remove one seat", "Remover um lugar")}>−</button><b>{selectedTable.capacity}</b><button disabled={saving || selectedTable.capacity >= 30} onClick={() => void updateTableCapacityInline(selectedTable, selectedTable.capacity + 1)} aria-label={t("Agregar un lugar", "Add one seat", "Adicionar um lugar")}>+</button></div><div className="capacity-bar"><i style={{ width: `${Math.min(100, (occupied / selectedTable.capacity) * 100)}%` }} /></div>{selectedTable.capacity <= minimumCapacity && <small className="capacity-minimum-note">⚠ {lastAssignedSeat > occupied ? t(`No podés reducir: el asiento ${lastAssignedSeat} está ocupado.`, `Cannot reduce: seat ${lastAssignedSeat} is occupied.`, `Não é possível reduzir: o assento ${lastAssignedSeat} está ocupado.`) : t(`No podés reducir: ya hay ${occupied} personas ubicadas.`, `Cannot reduce: ${occupied} people are already seated.`, `Não é possível reduzir: já há ${occupied} pessoas alocadas.`)}</small>}</>}</div>
              <label>{t("Agregar invitado", "Add guest", "Adicionar convidado")}<select value="" disabled={!canEdit || saving || !unassigned.length} onChange={(event) => { if (event.target.value) void assignGuest(event.target.value, selectedTable.id); }}><option value="">{unassigned.length ? t("Elegir persona sin mesa…", "Choose an unseated guest…", "Escolher pessoa sem mesa…") : t("Todos tienen mesa", "Everyone has a table", "Todos têm mesa")}</option>{unassigned.map((guest) => { const people = confirmedPeopleForGuest(guest, guests); const free = selectedTable.shape === "living" ? Infinity : selectedTable.capacity - occupied; return <option key={guest.id} value={guest.id} disabled={people > free}>{guest.name} · {people} {people === 1 ? t("persona", "person", "pessoa") : t("personas", "people", "pessoas")}{people > free ? ` · ${t("sin lugar", "no room", "sem lugar")}` : ""}</option>; })}</select></label>
              {selectedTable.guests.length > 0 && <div className="floor-inspector-guests"><strong>{t("Personas en esta mesa", "Guests at this table", "Pessoas nesta mesa")}</strong>{selectedTable.guests.map((guestId) => { const guest = confirmedGuests.find((candidate) => candidate.id === guestId); return guest ? <span key={guest.id}>{guest.name}<button disabled={!canEdit || saving} onClick={() => void unassignGuest(guest.id)} aria-label={`${t("Quitar de la mesa", "Remove from table", "Remover da mesa")} ${guest.name}`}>×</button></span> : null; })}</div>}
              <details className="floor-inspector-advanced">
                <summary>{t("Opciones avanzadas", "Advanced options", "Opções avançadas")} <span>⌄</span></summary>
                <div>
                  <p className="floor-inspector-note">{selectedTable.note || t("Sin observaciones. Podés agregar una desde la edición completa.", "No notes. Add one from full settings.", "Sem observações. Adicione uma na edição completa.")}</p>
                  {(selectedMenuSummary.size > 0 || selectedDietaryAlerts.length > 0 || selectedAccessibilityAlerts.length > 0 || selectedSocialConflicts.length > 0) && <section className="floor-inspector-operations"><strong>{t("Necesidades y alertas de esta mesa", "Needs and alerts for this table", "Necessidades e alertas desta mesa")}</strong>{[...selectedMenuSummary].map(([menu, count]) => <span key={menu}>🍽 {count}× {menu}</span>)}{selectedDietaryAlerts.map((alert) => <span className="is-alert" key={alert}>⚠ {alert}</span>)}{selectedAccessibilityAlerts.map((guest) => <span className="is-accessibility" key={guest.id}>♿ {guest.name}: {guest.accessibilityNeeds}</span>)}{selectedSocialConflicts.map((conflict) => <button key={conflict.id} onClick={() => focusSpecificTable(conflict.tableId)}>⚠ {conflict.message}</button>)}</section>}
                  <div className="floor-inspector-actions"><button onClick={() => void updateTableLayout(selectedTable, { locked: !selectedTable.locked })}>{selectedTable.locked ? t("Desbloquear", "Unlock", "Desbloquear") : t("Bloquear", "Lock", "Bloquear")}</button><button disabled={selectedTable.locked} onClick={() => void updateTableLayout(selectedTable, { rotation: ((selectedTable.rotation || 0) + 45) % 360 })}>{t("Girar 45°", "Rotate 45°", "Girar 45°")}</button><button onClick={() => void duplicateTable(selectedTable)}>{t("Duplicar", "Duplicate", "Duplicar")}</button><button onClick={() => openEdit(selectedTable)}>{t("Edición completa", "Full settings", "Edição completa")}</button></div>
                </div>
              </details>
              <button className="floor-inspector-delete" onClick={() => void deleteTable(selectedTable.id)}>{t("Eliminar mesa", "Delete table", "Excluir mesa")}</button>
              <small>{t("Consejo: hacé doble clic sobre una mesa para abrir directamente toda su configuración.", "Tip: double-click a table to open all its settings.", "Dica: dê dois cliques em uma mesa para abrir toda a configuração.")}</small>
            </aside>; })()}
          </div>
        </section>
      )}

      {!layoutMode && <>
      <nav className="mobile-seating-switch" aria-label={t("Pasos para distribuir invitados", "Guest seating steps", "Etapas para distribuir convidados")}>
        <button className={mobileSeatingStep === "guests" ? "active" : ""} onClick={() => setMobileSeatingStep("guests")}>1 · {t("Buscar invitados", "Find guests", "Buscar convidados")}</button>
        <button className={mobileSeatingStep === "tables" ? "active" : ""} onClick={() => setMobileSeatingStep("tables")}>2 · {t("Elegir ubicación", "Choose location", "Escolher local")}</button>
      </nav>
      <div className="seating-layout">
        <aside className={`panel unassigned-panel ${mobileSeatingStep === "tables" ? "seating-mobile-hidden" : ""}`}>
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
            <label className="search seating-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado, grupo o círculo…", "Search guest, group or circle…", "Buscar convidado, grupo ou círculo…")} /></label>
            <label className="social-circle-filter"><span>{t("Círculo social", "Social circle", "Círculo social")}</span><select value={socialCircleFilter} onChange={(event) => setSocialCircleFilter(event.target.value)}><option value="">{t("Todos los círculos", "All circles", "Todos os círculos")}</option>{socialCircleOptions.map((circle) => <option key={circle} value={circle}>{circle}</option>)}</select></label>
            {canEdit && <button className="manage-circles-button" type="button" onClick={() => setShowSocialCircleManager(true)}>⚙ {t("Administrar círculos", "Manage circles", "Administrar círculos")}</button>}
            {matchingSeatingCollections.length > 0 && <section className="group-search-results" aria-label={t("Grupos y círculos encontrados", "Matching groups and circles", "Grupos e círculos encontrados")}>
              <strong>{t("Ubicar juntos", "Seat together", "Alocar juntos")}</strong>
              {matchingSeatingCollections.map(({ kind, value: groupName }) => {
                const groupGuests = confirmedGuests.filter((guest) => normalizedReference(guest[kind]) === normalizedReference(groupName));
                const groupIds = new Set(groupGuests.map((guest) => guest.id));
                const groupPeople = groupGuests.reduce((total, guest) => total + confirmedPeopleForGuest(guest, guests), 0);
                const savingKey = `${kind}:${groupName}`;
                return <label key={savingKey}>
                  <span><b>{groupName}</b><em>{kind === "group" ? t("Grupo de invitación", "Invitation group", "Grupo do convite") : t("Círculo social", "Social circle", "Círculo social")}</em><small>{groupGuests.length} {t("invitaciones", "invitations", "convites")} · {groupPeople} {t("personas", "people", "pessoas")}</small></span>
                  <select defaultValue="" disabled={!canEdit || groupAssignmentSaving === savingKey} onChange={(event) => { if (event.target.value) void assignCollection(kind, groupName, event.target.value); event.currentTarget.value = ""; }} aria-label={`${t("Ubicar juntos", "Seat together", "Alocar juntos")} ${groupName}`}>
                    <option value="">{groupAssignmentSaving === savingKey ? t("Guardando…", "Saving…", "Salvando…") : t("Elegir mesa o Living…", "Choose table or Living…", "Escolher mesa ou Living…")}</option>
                    {tables.map((table) => {
                      const occupiedByOthers = table.guests.filter((id) => !groupIds.has(id)).reduce((total, id) => {
                        const assigned = guests.find((guest) => guest.id === id);
                        return total + (assigned ? confirmedPeopleForGuest(assigned, guests) : 0);
                      }, 0);
                      const isLiving = table.shape === "living";
                      const available = table.capacity - occupiedByOthers;
                      return <option key={table.id} value={table.id} disabled={!isLiving && available < groupPeople}>{table.name} · {isLiving ? t("sin límite", "unlimited", "sem limite") : available >= groupPeople ? `${available} ${t("libres", "free", "livres")}` : `${t("faltan", "needs", "faltam")} ${groupPeople - available}`}</option>;
                    })}
                  </select>
                </label>;
              })}
            </section>}
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
            <button className={`restriction-filter ${guestRestrictionFilter ? "active" : ""}`} onClick={() => setGuestRestrictionFilter((current) => !current)}>⚠ {t("Sólo con restricciones", "Restrictions only", "Somente com restrições")}</button>
            {(query || socialCircleFilter || assignmentFilter !== "all" || guestCategoryFilter !== "all" || guestRestrictionFilter) && <button className="clear-seating-filters" onClick={() => { setQuery(""); setSocialCircleFilter(""); setAssignmentFilter("all"); setGuestCategoryFilter("all"); setGuestRestrictionFilter(false); }}>× {t("Limpiar filtros", "Clear filters", "Limpar filtros")}</button>}
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
              const matchesQuery = `${guest.name} ${guest.group} ${guest.socialCircle}`.toLowerCase().includes(query.toLowerCase());
              const matchesCircle = !socialCircleFilter || normalizedReference(guest.socialCircle) === normalizedReference(socialCircleFilter);
              const isAssigned = assignedIds.includes(guest.id);
              const matchesCategory = guestCategoryFilter === "all" || (guest.guestType || "adult") === guestCategoryFilter;
              const matchesRestriction = !guestRestrictionFilter || guestHasRestriction(guest);
              return matchesQuery && matchesCircle && matchesCategory && matchesRestriction && (assignmentFilter === "all" || (assignmentFilter === "assigned" ? isAssigned : !isAssigned));
            }).map((guest) => {
              const currentTable = tables.find((table) =>
                table.guests.includes(guest.id),
              );
              const guestSuggestion = suggestedTableForGuest(guest);
              const suggestionPeerCount = guestSuggestion ? guestSuggestion.table.guests.filter((guestId) => {
                const peer = confirmedGuests.find((candidate) => candidate.id === guestId);
                if (!peer || peer.id === guest.id) return false;
                return guestSuggestion.basis === "group" ? normalizedReference(peer.group) === normalizedReference(guest.group) : guestSuggestion.basis === "circle" ? normalizedReference(peer.socialCircle) === normalizedReference(guest.socialCircle) : true;
              }).length : 0;
              const suggestionFreeSeats = guestSuggestion && guestSuggestion.table.shape !== "living" ? guestSuggestion.table.capacity - guestSuggestion.table.guests.reduce((total, guestId) => { const seated = confirmedGuests.find((candidate) => candidate.id === guestId); return total + (seated ? confirmedPeopleForGuest(seated, guests) : 0); }, 0) : null;
              const hasConfirmedGroupPeers = confirmedGuests.some((candidate) => candidate.id !== guest.id && (
                (Boolean(normalizedReference(guest.group)) && normalizedReference(candidate.group) === normalizedReference(guest.group)) ||
                (Boolean(normalizedReference(guest.socialCircle)) && normalizedReference(candidate.socialCircle) === normalizedReference(guest.socialCircle))
              ));
              return (
                <div
                  key={guest.id}
                  className={`${currentTable ? "guest-assigned" : ""} ${dragGuestId === guest.id ? "is-dragging" : ""} ${selectedGuestId === guest.id ? "is-selected" : ""}`}
                  draggable={canEdit}
                  role={canEdit ? "button" : undefined}
                  tabIndex={canEdit ? 0 : undefined}
                  onClick={(event) => {
                    if (!canEdit || (event.target as HTMLElement).closest("button, select")) return;
                    selectGuestForSeat(guest.id);
                  }}
                  onKeyDown={(event) => {
                    if (canEdit && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); selectGuestForSeat(guest.id); }
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
                    {guest.socialCircle && <span className="guest-circle-tag">{guest.socialCircle}</span>}
                    <small>
                      {confirmedPeopleForGuest(guest, guests)}{" "}
                      {confirmedPeopleForGuest(guest, guests) === 1
                        ? t("persona", "person", "pessoa")
                        : t("personas", "people", "pessoas")}{" "}
                      · {guest.group || t("Sin grupo", "No invitation group", "Sem grupo")}
                    </small>
                    {guestSuggestion ? <small className={`guest-seat-suggestion ${guestSuggestion.table.id === currentTable?.id ? "is-current" : ""}`}>★ {t("Sugerencia", "Suggestion", "Sugestão")}: {guestSuggestion.table.name} · {guestSuggestion.basis === "explicit" ? `${t("junto a", "next to", "junto a")} ${guestSuggestion.reason}` : guestSuggestion.basis === "group" ? t("junto a su grupo de invitación", "next to their invitation group", "junto ao seu grupo do convite") : guestSuggestion.nearby ? t("mesa cercana a su círculo", "table near their circle", "mesa próxima ao seu círculo") : t("junto a su círculo", "next to their circle", "junto ao seu círculo")} · {suggestionPeerCount} {t("afines ubicados", "related guests seated", "convidados afins alocados")}{suggestionFreeSeats !== null ? ` · ${suggestionFreeSeats} ${t("lugares libres", "free seats", "lugares livres")}` : ` · ${t("sin límite", "unlimited", "sem limite")}`}{guestSuggestion.table.id === currentTable?.id ? ` · ${t("mesa correcta", "correct table", "mesa correta")}` : ""}</small> : hasConfirmedGroupPeers && <small className="guest-seat-suggestion is-waiting">☆ {t("Sugerencia pendiente: ubicá primero a alguien de su grupo o círculo", "Pending suggestion: seat someone from their group or circle first", "Sugestão pendente: coloque primeiro alguém do grupo ou círculo")}</small>}
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
                      const lacksSpace = table.shape !== "living" &&
                        table.id !== currentTable?.id &&
                        available < confirmedPeopleForGuest(guest, guests);
                      return (
                        <option
                          key={table.id}
                          value={table.id}
                          disabled={lacksSpace}
                        >
                          {table.name}
                          {table.shape === "living"
                            ? ` · ${t("sin límite", "unlimited", "sem limite")}`
                            : lacksSpace
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

        <section className={`tables-workspace ${mobileSeatingStep === "guests" ? "seating-mobile-hidden" : ""}`}>
          {canEdit && (
            <details className="add-table-menu">
              <summary>＋ {t("Añadir mesa", "Add table", "Adicionar mesa")} ▾</summary>
              <div className="table-shape-tools" aria-label={t("Elegir forma de mesa", "Choose table shape", "Escolher formato da mesa")}>
                <button onClick={() => openNew("round")}><i className="shape-icon is-round" /><span><strong>{t("Redonda", "Round", "Redonda")}</strong><small>{t("Distribución circular", "Circular seating", "Distribuição circular")}</small></span></button>
                <button onClick={() => openNew("rectangular")}><i className="shape-icon is-rectangular" /><span><strong>{t("Rectangular", "Rectangular", "Retangular")}</strong><small>{t("Mesa alargada", "Long table", "Mesa alongada")}</small></span></button>
                <button onClick={() => openNew("square")}><i className="shape-icon is-square" /><span><strong>{t("Cuadrada", "Square", "Quadrada")}</strong><small>{t("Distribución compacta", "Compact seating", "Distribuição compacta")}</small></span></button>
                <button onClick={() => openNew("living")}><i className="shape-icon is-living" /><span><strong>Living</strong><small>{t("Zona flexible sin límite", "Flexible area without a limit", "Área flexível sem limite")}</small></span></button>
              </div>
            </details>
          )}
          <div className="workspace-heading">
            <div>
              <div className="table-layout-title"><h2>{t("Plano de mesas", "Table layout", "Plano de mesas")}</h2><button className="help-circle context-tip" type="button" data-help={t("Verde: tiene lugares. Completa: no quedan lugares. Amarillo o rojo: requiere revisión. Los círculos alrededor de la mesa representan las sillas.", "Green: seats available. Full: no seats remain. Yellow or red: needs review. Circles around the table represent seats.", "Verde: há lugares. Completa: não há lugares. Amarelo ou vermelho: requer revisão. Os círculos ao redor da mesa representam assentos.")} aria-label={t("Cómo leer las mesas", "How to read tables", "Como ler as mesas")}>?</button></div>
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
              <details className="workspace-view-menu">
                <summary>{t("Vista", "View", "Vista")} ▾</summary>
                <div>
                  <span>{visibleTables.length} {t("mesas", "tables", "mesas")}</span>
                  <nav className="table-navigation" aria-label={t("Recorrer mesas", "Browse tables", "Navegar mesas")}>
                    <button onClick={() => focusTable(-1)} disabled={!visibleTables.length} aria-label={t("Mesa anterior", "Previous table", "Mesa anterior")}>← {t("Anterior", "Previous", "Anterior")}</button>
                    <button onClick={() => focusTable(1)} disabled={!visibleTables.length} aria-label={t("Mesa siguiente", "Next table", "Próxima mesa")}>{t("Siguiente", "Next", "Próxima")} →</button>
                  </nav>
                  <button className={`view-density-toggle ${compactTables ? "active" : ""}`} onClick={() => setCompactTables((current) => !current)}>{compactTables ? t("Vista detallada", "Detailed view", "Vista detalhada") : t("Vista compacta", "Compact view", "Vista compacta")}</button>
                </div>
              </details>
              {lastAssignment && (
                <button className="outline-button compact" onClick={undoLastAssignment}>
                  ↶ {t("Deshacer movimiento", "Undo move", "Desfazer movimento")}
                </button>
              )}
              <span className={`assignment-save-status is-${assignmentStatus}`} role="status">
                {assignmentStatus === "saving" ? t("Guardando…", "Saving…", "Salvando…") : assignmentStatus === "saved" ? `✓ ${t("Guardado", "Saved", "Salvo")}` : assignmentStatus === "error" ? t("No se guardó", "Not saved", "Não foi salvo") : t("Actualización automática", "Automatic updates", "Atualização automática")}
                {assignmentStatus === "error" && failedAssignment && <button type="button" onClick={() => void assignGuest(failedAssignment.guestId, failedAssignment.tableId, true, failedAssignment.seatNumber)}>{t("Reintentar", "Retry", "Tentar novamente")}</button>}
              </span>
            </div>
          </div>
          <details className={`seating-final-review ${reviewIssueCount ? "has-warnings" : "is-ready"}`}>
            <summary><span>{reviewIssueCount ? "⚠" : "✓"}</span><strong>{t("Revisión final", "Final review", "Revisão final")}</strong><small>{reviewIssueCount ? `${reviewIssueCount} ${t("asuntos para revisar", "items to review", "itens para revisar")}` : t("Distribución sin alertas", "Layout has no alerts", "Distribuição sem alertas")}</small></summary>
            <div>
              <button className={unassigned.length ? "has-issue" : ""} onClick={() => { setAssignmentFilter("unassigned"); setMobileSeatingStep("guests"); }}><b>{unassigned.length}</b><span>{t("Invitaciones sin mesa", "Invitations without a table", "Convites sem mesa")}</span></button>
              <button className={splitInvitationGroups.length ? "has-issue" : ""} onClick={() => { if (splitInvitationGroups[0]) setQuery(splitInvitationGroups[0]); setMobileSeatingStep("guests"); }}><b>{splitInvitationGroups.length}</b><span>{t("Grupos separados", "Split invitation groups", "Grupos separados")}</span></button>
              <button className={dispersedCircleConflicts.length ? "has-issue" : ""} onClick={() => { if (dispersedCircleConflicts[0]) focusSpecificTable(dispersedCircleConflicts[0].tableId); }}><b>{dispersedCircleConflicts.length}</b><span>{t("Círculos dispersos", "Spread-out circles", "Círculos dispersos")}</span></button>
              <button className={overCapacityTables.length ? "has-issue" : ""} onClick={() => { if (overCapacityTables[0]) focusSpecificTable(overCapacityTables[0].id); }}><b>{overCapacityTables.length}</b><span>{t("Sobrecupos", "Over capacity", "Acima da capacidade")}</span></button>
              <button className={unnamedTables.length || duplicateTableNames.length ? "has-issue" : ""} onClick={() => { const target = unnamedTables[0] || tables.find((table) => duplicateTableNames.includes(normalizedReference(table.name))); if (target) openEdit(target); }}><b>{unnamedTables.length + duplicateTableNames.length}</b><span>{t("Nombres de mesa", "Table names", "Nomes de mesa")}</span></button>
              <button onClick={() => setGuestRestrictionFilter(true)}><b>{confirmedRestrictions}</b><span>{t("Restricciones registradas", "Recorded restrictions", "Restrições registradas")}</span></button>
            </div>
          </details>
          {selectedGuestId && <div className="seat-selection-banner"><strong>{selectedGuest?.name}</strong><span>{suggestedGroupTable ? `${t("Sugerencia", "Suggestion", "Sugestão")}: ${suggestedGroupTable.name} · ${selectedSuggestion?.basis === "explicit" ? `${t("junto a", "next to", "junto a")} ${selectedSuggestion.reason}` : selectedSuggestion?.basis === "group" ? t("junto a su grupo de invitación", "next to their invitation group", "junto ao seu grupo do convite") : selectedSuggestion?.nearby ? t("mesa cercana a su círculo", "table near their circle", "mesa próxima ao seu círculo") : t("junto a su círculo", "next to their circle", "junto ao seu círculo")}` : t("Ahora elegí una silla libre", "Now choose a free seat", "Agora escolha um assento livre")}</span>{suggestedGroupTable && <button onClick={() => focusSpecificTable(suggestedGroupTable.id)}>↓ {t("Ver sugerencia", "View suggestion", "Ver sugestão")}</button>}<button onClick={() => setSelectedGuestId("")}>{t("Cancelar", "Cancel", "Cancelar")}</button></div>}
          {tableQuery && <div className="active-table-filter"><span>{t("Resultados para", "Results for", "Resultados para")} “{tableQuery}”</span><button onClick={() => setTableQuery("")}>× {t("Limpiar", "Clear", "Limpar")}</button></div>}
          <div className={`tables-grid ${compactTables ? "is-compact" : ""}`}>
            {!visibleTables.length && <div className="tables-empty-state"><strong>{t("No encontramos mesas", "No tables found", "Nenhuma mesa encontrada")}</strong><span>{t("Probá con otro nombre de mesa o invitado.", "Try another table or guest name.", "Tente outro nome de mesa ou convidado.")}</span><button onClick={() => setTableQuery("")}>{t("Ver todas las mesas", "View all tables", "Ver todas as mesas")}</button></div>}
            {visibleTables.map((table) => {
              const index = tables.findIndex((item) => item.id === table.id);
              const tableGuests = table.guests
                .map((id) => confirmedGuests.find((guest) => guest.id === id))
                .filter(Boolean) as Guest[];
              const occupied = tableGuests.reduce(
                (total, guest) => total + confirmedPeopleForGuest(guest, guests),
                0,
              );
              const isLiving = table.shape === "living";
              const remaining = table.capacity - occupied;
              const full = !isLiving && remaining === 0;
              const over = !isLiving && remaining < 0;
              const tableSocialConflicts = socialConflicts.filter((conflict) => conflict.tableId === table.id);
              const tableNeedsReview = over || tableSocialConflicts.length > 0;
              const tableStatusLabel = isLiving
                ? t("Zona flexible", "Flexible area", "Área flexível")
                : over
                  ? t("Sobrecapacidad", "Over capacity", "Acima da capacidade")
                  : tableSocialConflicts.length > 0
                    ? t("Conflicto de ubicación", "Seating conflict", "Conflito de localização")
                    : full
                      ? t("Mesa completa", "Table full", "Mesa completa")
                      : occupied === 0
                        ? t("Mesa vacía", "Empty table", "Mesa vazia")
                        : t("Con lugares disponibles", "Seats available", "Com lugares disponíveis");
              const draggedGuest = guests.find((guest) => guest.id === dragGuestId);
              const draggedPeople = draggedGuest
                ? confirmedPeopleForGuest(draggedGuest, guests)
                : 0;
              const alreadyHere = Boolean(
                dragGuestId && table.guests.includes(dragGuestId),
              );
              const canDrop = isLiving || alreadyHere || remaining >= draggedPeople;
              const seatGuests: Array<{ guest: Guest; label: string; personName: string } | undefined> = Array(isLiving ? 0 : table.capacity).fill(undefined);
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
              const selectedPeople = selectedGuest ? confirmedPeopleForGuest(selectedGuest, guests) : 0;
              const groupSeatIndexes = selectedGuest
                ? seatGuests.flatMap((slot, seatIndex) => slot && suggestedTargetIds.includes(slot.guest.id) ? [seatIndex] : [])
                : [];
              const suggestedSeatIndex = suggestedGroupTable?.id === table.id && groupSeatIndexes.length
                ? Array.from({ length: table.capacity }, (_, offset) => (Math.max(...groupSeatIndexes) + 1 + offset) % table.capacity).find((start) =>
                    start + selectedPeople <= table.capacity && Array.from({ length: selectedPeople }, (_, personIndex) => !seatGuests[start + personIndex]).every(Boolean),
                  ) ?? -1
                : -1;
              return (
                <article
                  id={`table-card-${table.id}`}
                  className={`table-card ${over ? "table-over" : full ? "table-full" : ""} ${dragGuestId ? (canDrop ? "drop-compatible" : "drop-blocked") : ""} ${selectedGuestId && table.guests.includes(selectedGuestId) ? "has-selected-guest" : ""} ${suggestedGroupTable?.id === table.id ? "is-group-suggestion" : ""} ${socialCircleFilter && tableGuests.some((guest) => normalizedReference(guest.socialCircle) === normalizedReference(socialCircleFilter)) ? "has-social-circle" : ""} ${assignmentSavingId && table.guests.includes(assignmentSavingId) ? "is-saving" : ""}`}
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
                      <button className="table-name-edit" type="button" onClick={() => openEdit(table)} title={t("Editar nombre de la mesa", "Edit table name", "Editar nome da mesa")}><h3>{table.name}</h3><span className="admin-action-icon is-edit" aria-hidden="true" /></button>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openEdit(table)}
                        aria-label={`${t("Editar nombre, forma, capacidad y nota de", "Edit name, shape, capacity, and note for", "Editar nome, forma, capacidade e nota de")} ${table.name}`}
                        title={t("Editar mesa", "Edit table", "Editar mesa")}
                      >
                        ⋯
                      </button>
                    )}
                  </div>
                  <div className={`table-health is-${over ? "over" : tableNeedsReview ? "review" : full ? "full" : isLiving ? "living" : "available"}`}>
                    <span><i />{tableStatusLabel}</span>
                  </div>
                  <div className="capacity-row">
                    <span>
                      {occupied} {isLiving ? t("personas ubicadas", "people assigned", "pessoas alocadas") : <>{t("de", "of", "de")} {table.capacity} {t("lugares", "seats", "lugares")}</>}
                    </span>
                    <strong>
                      {isLiving
                        ? t("Sin límite", "Unlimited", "Sem limite")
                        : over
                        ? `${Math.abs(remaining)} ${t("de más", "over", "a mais")}`
                        : full
                          ? t("Completa", "Full", "Completa")
                          : `${remaining} ${t("libres", "free", "livres")}`}
                    </strong>
                  </div>
                  {!isLiving && <div className="capacity-bar">
                    <i
                      style={{
                        width: `${Math.min(100, (occupied / table.capacity) * 100)}%`,
                      }}
                    />
                  </div>}
                  {!isLiving && <div className={`table-seat-map is-${table.shape || "round"}`}>
                    <div className="table-surface"><strong>{table.name}</strong></div>
                    {Array.from({ length: table.capacity }, (_, seatIndex) => {
                      const person = seatGuests[seatIndex];
                      const angle = (Math.PI * 2 * seatIndex) / table.capacity - Math.PI / 2;
                      const radiusX = table.shape === "rectangular" ? 43 : table.shape === "square" ? 37 : 42;
                      const radiusY = table.shape === "rectangular" ? 34 : table.shape === "square" ? 39 : 42;
                      return (
                        <span
                          className={`seat-marker ${person ? "is-occupied" : ""} ${person?.guest.guestType === "teen" ? "is-teen" : ""} ${person?.guest.guestType === "child" ? "is-child" : ""} ${person?.guest.id === selectedGuestId ? "is-selected" : ""} ${selectedGuestId && (!person || person.guest.id === selectedGuestId) ? "is-click-target" : ""} ${seatIndex === suggestedSeatIndex ? "is-suggested" : ""} ${person && guestHasRestriction(person.guest) ? "has-alert" : ""}`}
                          key={seatIndex}
                          style={{ left: `${50 + Math.cos(angle) * radiusX}%`, top: `${50 + Math.sin(angle) * radiusY}%` }}
                          title={seatIndex === suggestedSeatIndex ? `${t("Asiento sugerido junto al grupo", "Suggested seat next to group", "Assento sugerido junto ao grupo")} · ${t("Asiento", "Seat", "Assento")} ${seatIndex + 1}` : person ? undefined : `${t("Asiento", "Seat", "Assento")} ${seatIndex + 1}`}
                          onMouseEnter={(event) => person && setSeatHover({ name: person.personName, x: event.clientX, y: event.clientY })}
                          onMouseMove={(event) => person && setSeatHover({ name: person.personName, x: event.clientX, y: event.clientY })}
                          onMouseLeave={() => setSeatHover(null)}
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
                            if (!canEdit || assignmentSavingId) return;
                            if (selectedGuestId && (!person || person.guest.id === selectedGuestId)) {
                              void assignGuest(selectedGuestId, table.id, true, seatIndex + 1);
                              return;
                            }
                            if (person) selectGuestForSeat(person.guest.id);
                          }}
                        ><b className="seat-number">{seatIndex + 1}</b><em>{person?.label || "♧"}</em></span>
                      );
                    })}
                  </div>}
                  <div className="seated-guests">
                    {tableGuests.map((guest) => {
                      const people = confirmedPeopleForGuest(guest, guests);
                      const restrictionDetails = [
                        meaningfulGuestValue(guest.food) ? guest.food : "",
                        meaningfulGuestValue(guest.accessibilityNeeds) ? guest.accessibilityNeeds : "",
                        ...guest.companions
                          .filter((companion) => meaningfulGuestValue(companion.food))
                          .map((companion) => `${companion.name || t("Acompañante", "Companion", "Acompanhante")}: ${companion.food}`),
                      ].filter(Boolean).join(" · ");
                      const assignedSeat = effectiveSeatByGuest.get(guest.id) || 1;
                      const availableStarts = Array.from({ length: table.capacity }, (_, seatIndex) => seatIndex + 1).filter((start) =>
                        start + people - 1 <= table.capacity &&
                        Array.from({ length: people }, (_, offset) => seatGuests[start - 1 + offset]).every(
                          (slot) => !slot || slot.guest.id === guest.id,
                        ),
                      );
                      return <div className={`is-${guest.guestType || "adult"}`} key={guest.id}>
                        <GuestNameButton guest={guest} />
                        {guest.socialCircle && <span className="seated-circle-tag">{guest.socialCircle}</span>}
                        {guestHasRestriction(guest) && <span className="restriction-mark context-tip" data-help={`${t("Restricción", "Restriction", "Restrição")}: ${restrictionDetails}`} aria-label={`${t("Restricción de", "Restriction for", "Restrição de")} ${guest.name}`} role="img">⚠</span>}
                        {people > 1 && <small>{people} {t("lugares", "seats", "lugares")}</small>}
                        {canEdit && !isLiving && (
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
                  {over && !isLiving && (
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
          {seatHover && <div className="seat-hover-tooltip" role="tooltip" style={{ left: Math.min(window.innerWidth - 18, seatHover.x + 14), top: Math.max(12, seatHover.y - 12) }}>{seatHover.name}</div>}
        </section>
      </div></>}

      {showSocialCircleManager && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="social-circle-manager-title" onMouseDown={() => setShowSocialCircleManager(false)}>
        <div className="modal social-circle-manager" onMouseDown={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={() => setShowSocialCircleManager(false)}>×</button>
          <span className="eyebrow">{t("Organización social", "Social organization", "Organização social")}</span>
          <h2 id="social-circle-manager-title">{t("Administrar círculos", "Manage circles", "Administrar círculos")}</h2>
          <p>{t("Renombrá, unificá o vaciá círculos sin editar cada invitado por separado.", "Rename, merge, or clear circles without editing every guest.", "Renomeie, una ou esvazie círculos sem editar cada convidado.")}</p>
          <div className="social-circle-manager-list">
            {!socialCircleStats.length && <div className="social-circle-manager-empty">{t("Todavía no hay círculos asignados.", "No circles have been assigned yet.", "Ainda não há círculos atribuídos.")}</div>}
            {socialCircleStats.map(({ circle, invitations, people }) => <article key={circle}>
              <header><div><strong>{circle}</strong><small>{invitations} {t("invitaciones", "invitations", "convites")} · {people} {t("personas confirmadas", "confirmed people", "pessoas confirmadas")}</small></div></header>
              <form onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get("circleName"); if (typeof value === "string") void updateSocialCircleMembers(circle, value); }}>
                <input name="circleName" defaultValue={circle} maxLength={120} aria-label={`${t("Nuevo nombre para", "New name for", "Novo nome para")} ${circle}`} />
                <button type="submit" disabled={socialCircleSaving === circle}>{t("Renombrar", "Rename", "Renomear")}</button>
              </form>
              <form onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get("mergeCircle"); if (typeof value === "string" && value) void updateSocialCircleMembers(circle, value); }}>
                <select name="mergeCircle" defaultValue="" aria-label={`${t("Unificar", "Merge", "Unir")} ${circle}`}><option value="">{t("Unificar con…", "Merge into…", "Unir com…")}</option>{socialCircleOptions.filter((candidate) => normalizedReference(candidate) !== normalizedReference(circle)).map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}</select>
                <button type="submit" disabled={socialCircleSaving === circle}>{t("Unificar", "Merge", "Unir")}</button>
                <button className="clear-circle" type="button" disabled={socialCircleSaving === circle} onClick={() => { if (window.confirm(t(`¿Dejar sin círculo a ${invitations} invitaciones de “${circle}”?`, `Clear “${circle}” from ${invitations} invitations?`, `Remover “${circle}” de ${invitations} convites?`))) void updateSocialCircleMembers(circle, ""); }}>{t("Vaciar", "Clear", "Esvaziar")}</button>
              </form>
            </article>)}
          </div>
        </div>
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
                : tableShape === "living" ? "Nuevo Living" : t("Nueva mesa", "New table", "Nova mesa")}
            </span>
            <h2>
              {editing
                ? editing.shape === "living" ? "Editar Living" : t("Editar mesa", "Edit table", "Editar mesa")
                : tableShape === "living" ? "Agregar Living" : t("Agregar mesa", "Add table", "Adicionar mesa")}
            </h2>
            <div className="form-grid">
              {tableShape !== "living" && <label>
                {t("Nombre o número", "Name or number", "Nome ou número")}
                <input
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                  maxLength={120}
                  placeholder={t(
                    "Ej. Mesa Familia",
                    "E.g. Family table",
                    "Ex. Mesa Família",
                  )}
                />
              </label>}
              {tableShape === "living" && <div className="living-unlimited-note"><strong>{t("Zona sin límite", "Unlimited zone", "Zona sem limite")}</strong><span>{t("Podés ubicar todas las personas que necesites. No se asignan sillas numeradas.", "Assign as many people as needed. Numbered seats are not used.", "Aloque quantas pessoas precisar. Não há assentos numerados.")}</span></div>}
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
              <legend>{t("Tipo de ubicación", "Seating type", "Tipo de local")}</legend>
              {(["round", "rectangular", "square", "living"] as const).map((shape) => (
                <button type="button" key={shape} className={tableShape === shape ? "active" : ""} onClick={() => setTableShape(shape)}>
                  <i className={`shape-icon is-${shape}`} />
                  {shape === "round" ? t("Redonda", "Round", "Redonda") : shape === "rectangular" ? t("Rectangular", "Rectangular", "Retangular") : shape === "square" ? t("Cuadrada", "Square", "Quadrada") : "Living"}
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
                disabled={saving || !tableName.trim()}
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
  const [moduleNotice, setModuleNotice] = useState("");
  const [query, setQuery] = useState("");
  const [reminderMessage, setReminderMessage] = useState(
    "Te recordamos que se acerca nuestro evento. Si ya confirmaste, ¡muchas gracias! Si todavía no, nos encantaría recibir tu respuesta.",
  );
  const [giftText, setGiftText] = useState(order.giftDetails);
  const [confirmationTarget, setConfirmationTarget] = useState<"invitation" | "rsvp" | "custom">("invitation");
  const [invitationLink, setInvitationLink] = useState(order.invitationUrl);
  const [savingInvitation, setSavingInvitation] = useState(false);
  const [customConfirmationUrl, setCustomConfirmationUrl] = useState("");
  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([]);
  const [bulkReminderProgress, setBulkReminderProgress] = useState("");
  const [bulkReminderBusy, setBulkReminderBusy] = useState(false);
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
  const validateReminderSetup = () => {
    if (!reminderMessage.trim()) return t("Escribí el contenido del recordatorio.", "Write the reminder message.", "Escreva o conteúdo do lembrete.");
    const value = confirmationTarget === "invitation" ? invitationLink : confirmationTarget === "custom" ? customConfirmationUrl : "";
    if (confirmationTarget !== "rsvp") {
      try {
        const parsed = new URL(value);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return confirmationTarget === "invitation"
          ? t("Asociá un enlace válido para la invitación.", "Link a valid invitation URL.", "Associe um link válido para o convite.")
          : t("Ingresá un enlace alternativo válido.", "Enter a valid alternative URL.", "Insira um link alternativo válido.");
      }
    }
    return "";
  };

  const saveInvitationLink = async () => {
    if (!invitationLink.trim() || invitationLink === order.invitationUrl) return;
    setSavingInvitation(true);
    setModuleError("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invitation-url", invitationUrl: invitationLink }) });
      const result = await readApiJson<{ invitationUrl?: string; error?: string }>(response, t("El servicio de configuración no está disponible.", "The settings service is unavailable.", "O serviço de configuração não está disponível."));
      if (!response.ok || !result.invitationUrl) throw new Error(result.error || "No pudimos asociar la invitación.");
      setInvitationLink(result.invitationUrl);
      onOrderChange({ ...order, invitationUrl: result.invitationUrl });
      setModuleNotice(t("Enlace de la invitación asociado.", "Invitation link saved.", "Link do convite associado."));
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
        manual: [t("Preparado manualmente", "Prepared manually", "Preparado manualmente"), "pending"],
      }) as Record<string, [string, string]>
    )[value] || [t("Sin envío", "Not sent", "Não enviado"), "empty"];

  const remindGuest = async (guest: Guest) => {
    const setupError = validateReminderSetup();
    if (setupError) { setModuleError(setupError); return; }
    setRemindingId(guest.id);
    setModuleError("");
    setModuleNotice("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, action: "remind", message: reminderMessage, giftText, confirmationTarget, customConfirmationUrl, invitationUrlOverride: invitationLink }),
      });
      const result = await readApiJson<{
        guest?: Guest;
        mode?: "business" | "manual";
        url?: string;
        error?: string;
      }>(response, t("El servicio de recordatorios no está disponible.", "The reminder service is unavailable.", "O serviço de lembretes não está disponível."));
      if (!response.ok)
        throw new Error(result.error || "No pudimos enviar el recordatorio.");
      if (result.mode === "manual" && result.url) {
        const popup = window.open(result.url, "_blank", "noopener,noreferrer");
        if (!popup) throw new Error(t("El navegador bloqueó WhatsApp. Habilitá las ventanas emergentes e intentá nuevamente.", "The browser blocked WhatsApp. Allow pop-ups and try again.", "O navegador bloqueou o WhatsApp. Permita pop-ups e tente novamente."));
        popup.opener = null;
        if (result.guest)
          setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
        setModuleNotice(t("WhatsApp quedó preparado. Revisá el mensaje antes de enviarlo.", "WhatsApp is ready. Review the message before sending it.", "O WhatsApp está pronto. Revise a mensagem antes de enviá-la."));
        return;
      }
      if (!result.guest)
        throw new Error("No pudimos registrar el recordatorio.");
      setGuests((current) =>
        current.map((item) => (item.id === guest.id ? result.guest! : item)),
      );
      setModuleNotice(t("Recordatorio enviado correctamente.", "Reminder sent successfully.", "Lembrete enviado corretamente."));
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
    const setupError = validateReminderSetup();
    if (setupError) { setModuleError(setupError); return; }
    setRemindingId(guest.id);
    setModuleError("");
    setModuleNotice("");
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
      const result = await readApiJson<{
        guest?: Guest;
        error?: string;
      }>(response, t("El servicio de recordatorios no está disponible.", "The reminder service is unavailable.", "O serviço de lembretes não está disponível."));
      if (!response.ok || !result.guest)
        throw new Error(
          result.error || "No pudimos enviar el recordatorio por email.",
        );
      setGuests((current) =>
        current.map((item) => (item.id === guest.id ? result.guest! : item)),
      );
      setModuleNotice(t("Recordatorio enviado por email.", "Email reminder sent.", "Lembrete enviado por email."));
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

  const emailSelectedReminders = async () => {
    const setupError = validateReminderSetup();
    if (setupError) { setModuleError(setupError); return; }
    const recipients = pending.filter((guest) => selectedReminderIds.includes(guest.id) && guest.email);
    if (!recipients.length) return;
    if (!window.confirm(t(
      `¿Enviar ${recipients.length} recordatorios por email?`,
      `Send ${recipients.length} email reminders?`,
      `Enviar ${recipients.length} lembretes por email?`,
    ))) return;
    setModuleError("");
    setModuleNotice("");
    setBulkReminderBusy(true);
    let sent = 0;
    try {
      for (const guest of recipients) {
        setBulkReminderProgress(t(
          `Enviando ${sent + 1} de ${recipients.length}…`,
          `Sending ${sent + 1} of ${recipients.length}…`,
          `Enviando ${sent + 1} de ${recipients.length}…`,
        ));
        const response = await fetch("/api/admin/guests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: guest.id, action: "remind-email", template: "message", message: reminderMessage, giftText, confirmationTarget, customConfirmationUrl, invitationUrlOverride: invitationLink }),
        });
        const result = await readApiJson<{ guest?: Guest; error?: string }>(response, t("El servicio de recordatorios no está disponible.", "The reminder service is unavailable.", "O serviço de lembretes não está disponível."));
        if (!response.ok || !result.guest) throw new Error(result.error || t("Revisá los datos y volvé a intentar.", "Check the details and try again.", "Revise os dados e tente novamente."));
        sent += 1;
        setGuests((current) => current.map((item) => item.id === guest.id ? result.guest! : item));
      }
      setSelectedReminderIds([]);
      setBulkReminderProgress(t(
        `${sent} recordatorios enviados correctamente.`,
        `${sent} reminders sent successfully.`,
        `${sent} lembretes enviados com sucesso.`,
      ));
      setModuleNotice(t("El lote terminó correctamente.", "The batch completed successfully.", "O lote foi concluído corretamente."));
    } catch (sendError) {
      const detail = sendError instanceof Error ? sendError.message : t("Revisá los datos y volvé a intentar.", "Check the details and try again.", "Revise os dados e tente novamente.");
      setModuleError(t(
        `Se enviaron ${sent} de ${recipients.length}. ${detail}`,
        `${sent} of ${recipients.length} were sent. ${detail}`,
        `${sent} de ${recipients.length} foram enviados. ${detail}`,
      ));
      setBulkReminderProgress("");
    } finally {
      setBulkReminderBusy(false);
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
        {moduleNotice && <p className="import-success" role="status">{moduleNotice}</p>}
        <div className="table-tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar invitado o grupo…", "Search guest or group…", "Buscar convidado ou grupo…")} /></label>
          {view === "Recordatorios" && canEdit && selectedReminderIds.length > 0 && <div className="reminder-bulk-bar"><strong>{selectedReminderIds.length} {t("seleccionados", "selected", "selecionados")}</strong><button className="primary-button small" type="button" disabled={bulkReminderBusy} onClick={() => void emailSelectedReminders()}>{bulkReminderBusy ? bulkReminderProgress : t("Enviar emails", "Send emails", "Enviar emails")}</button><button className="outline-button compact" type="button" disabled={bulkReminderBusy} onClick={() => setSelectedReminderIds([])}>{t("Cancelar", "Cancel", "Cancelar")}</button></div>}
        </div>
        {view === "Recordatorios" && bulkReminderProgress && !moduleError && <p className="import-success" role="status">{bulkReminderProgress}</p>}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {view === "Recordatorios" && canEdit && <th className="checkbox-cell"><input type="checkbox" aria-label={t("Seleccionar pendientes con email", "Select pending guests with email", "Selecionar pendentes com email")} checked={content.rows.filter((guest) => guest.email).length > 0 && content.rows.filter((guest) => guest.email).every((guest) => selectedReminderIds.includes(guest.id))} onChange={(event) => setSelectedReminderIds(event.target.checked ? content.rows.filter((guest) => guest.email).map((guest) => guest.id) : [])} /></th>}
                {content.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((guest, index) => (
                <tr key={guest.id}>
                  {view === "Recordatorios" && canEdit && <td className="checkbox-cell"><input type="checkbox" disabled={!guest.email} checked={selectedReminderIds.includes(guest.id)} aria-label={`${t("Seleccionar", "Select", "Selecionar")} ${guest.name}`} onChange={(event) => setSelectedReminderIds((current) => event.target.checked ? [...new Set([...current, guest.id])] : current.filter((id) => id !== guest.id))} /></td>}
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
  onModulesChange,
}: {
  code: string;
  onChange: (value: string) => void;
  orderNumber: string;
  order: AdminOrder;
  onEventChange: (details: { eventName: string; eventDate: string }) => void;
  onModulesChange: (modules: AdminOrder["enabledModules"]) => void;
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
  const [accountModules, setAccountModules] = useState<Array<{ module: AdminOrder["enabledModules"][number]; source: string; enabled: boolean }>>([]);
  const [testingReminder, setTestingReminder] = useState(false);
  const [healthBusy, setHealthBusy] = useState(true);
  const [health, setHealth] = useState<{
    checkedAt: string;
    services: Record<
      "database" | "email" | "scheduler" | "whatsapp",
      { status: "ok" | "warning" | "error"; detail: string }
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
  }, [order.customerName, order.eventDate]);

  useEffect(() => {
    fetch('/api/admin/modules', { cache: 'no-store' }).then(async (response) => {
      if (response.ok) setAccountModules(((await response.json()) as { modules: typeof accountModules }).modules);
    }).catch(() => undefined);
  }, []);

  const toggleAccountModule = async (module: AdminOrder["enabledModules"][number], enabled: boolean) => {
    const response = await fetch('/api/admin/modules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ module, enabled }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setMessage(result.error || 'No pudimos actualizar el módulo.'); return; }
    const next = accountModules.map((item) => item.module === module ? { ...item, enabled } : item);
    setAccountModules(next);
    onModulesChange(next.filter((item) => item.enabled).map((item) => item.module));
    setMessage('Accesos de la cuenta actualizados.');
  };

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
        <div className="panel-title"><div><h2>Módulos de la cuenta</h2><p>Podés apagar o volver a prender los módulos incluidos en el plan. Los adicionales se contratan por separado.</p></div></div>
        <div className="settings-module-grid">{accountModules.map((item) => <label key={item.module}><input type="checkbox" checked={item.enabled} disabled={!['owner', 'admin'].includes(order.accessRole)} onChange={(event) => toggleAccountModule(item.module, event.target.checked)} /><span>{({ invitation: 'Invitación', guests_rsvp: 'Invitados y RSVP', tables: 'Mesas', check_in: 'Check-in', messaging: 'Mensajería', collaborative_album: 'Álbum colaborativo', suppliers: 'Proveedores' } as Record<string, string>)[item.module]}</span><small>Incluido por {item.source === 'plan' ? 'plan' : item.source === 'addon' ? 'adicional' : item.source === 'role' ? 'rol' : 'configuración manual'}</small></label>)}</div>
      </section>
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
                "whatsapp",
                "WhatsApp",
                t(
                  "Envío y seguimiento de mensajes",
                  "Message delivery and tracking",
                  "Envio e acompanhamento de mensagens",
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
                  className={`health-indicator ${service?.status === "ok" ? "is-ok" : service?.status === "warning" ? "is-warning" : service ? "is-error" : "is-pending"}`}
                  aria-hidden="true"
                />
                <div>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </div>
                <span
                  className={`health-status ${service?.status === "ok" ? "is-ok" : service?.status === "warning" ? "is-warning" : "is-error"}`}
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
  role: "admin" | "editor" | "viewer";
  created_at: string;
};
type AdminActivity = {
  id: string;
  actor_email: string;
  actor_role: "owner" | "admin" | "editor" | "viewer";
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

function Accesses({ order }: { order: AdminOrder }) {
  const { text: t, locale, language } = useAdminI18n();
  const [accesses, setAccesses] = useState<AdminAccess[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingAccesses, setLoadingAccesses] = useState(true);

  const load = useCallback(() => {
    setLoadingAccesses(true);
    fetch("/api/admin/access")
      .then(async (response) => {
        const result = await readApiJson<{ accesses?: AdminAccess[]; error?: string }>(response, adminText(language, "El servicio de accesos no está disponible.", "The access service is unavailable.", "O serviço de acessos não está disponível."));
        if (!response.ok || !result.accesses) throw new Error(result.error || adminText(language, "No pudimos cargar los colaboradores.", "Could not load collaborators.", "Não foi possível carregar os colaboradores."));
        setAccesses(result.accesses);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : adminText(language, "No pudimos cargar los colaboradores.", "Could not load collaborators.", "Não foi possível carregar os colaboradores.")))
      .finally(() => setLoadingAccesses(false));
  }, [language]);
  useEffect(load, [load]);
  const loadActivities = useCallback(() => {
    if (order.accessRole !== "owner") return;
    fetch("/api/admin/activity", { cache: "no-store" })
      .then(async (response) => {
        const result = await readApiJson<{ activities?: AdminActivity[]; error?: string }>(response, adminText(language, "El historial no está disponible.", "The activity log is unavailable.", "O histórico não está disponível."));
        if (!response.ok || !result.activities) throw new Error(result.error || adminText(language, "No pudimos cargar el historial.", "Could not load activity.", "Não foi possível carregar o histórico."));
        setActivities(result.activities);
      })
      .catch((activityError) => setError(activityError instanceof Error ? activityError.message : adminText(language, "No pudimos cargar el historial.", "Could not load activity.", "Não foi possível carregar o histórico.")));
  }, [order.accessRole, language]);
  useEffect(loadActivities, [loadActivities]);

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
      const result = await readApiJson<{
        access?: AdminAccess;
        error?: string;
      }>(response, t("El servicio de accesos no está disponible.", "The access service is unavailable.", "O serviço de acessos não está disponível."));
      if (!response.ok || !result.access)
        throw new Error(result.error || "No pudimos invitar al colaborador.");
      setAccesses((current) => [...current, result.access!]);
      setShowModal(false);
      setNotice(t("Colaborador invitado correctamente.", "Collaborator invited successfully.", "Colaborador convidado com sucesso."));
      loadActivities();
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
      const result = await readApiJson<{ error?: string }>(response, t("El servicio de accesos no está disponible.", "The access service is unavailable.", "O serviço de acessos não está disponível."));
      if (!response.ok)
        throw new Error(result.error || "No pudimos revocar el acceso.");
      setAccesses((current) => current.filter((access) => access.id !== id));
      setNotice(t("Acceso revocado.", "Access revoked.", "Acesso revogado."));
      loadActivities();
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
      const result = await readApiJson<{
        access?: AdminAccess;
        error?: string;
      }>(response, t("El servicio de accesos no está disponible.", "The access service is unavailable.", "O serviço de acessos não está disponível."));
      if (!response.ok || !result.access)
        throw new Error(result.error || "No pudimos cambiar el rol.");
      setAccesses((current) =>
        current.map((item) => (item.id === access.id ? result.access! : item)),
      );
      setNotice(t("Rol actualizado. La sesión anterior fue cerrada por seguridad.", "Role updated. The previous session was closed for security.", "Função atualizada. A sessão anterior foi encerrada por segurança."));
      loadActivities();
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
        {["owner", "admin"].includes(order.accessRole) && (
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
          "Los administradores gestionan el evento y sus colaboradores. Los editores modifican contenido y los usuarios de solo lectura sólo consultan.",
          "Administrators manage the event and collaborators. Editors change content, while view-only users can only consult it.",
          "Administradores gerenciam o evento e colaboradores. Editores alteram conteúdo e usuários de leitura apenas consultam.",
        )}
      </ContextHelp>
      <section className="access-role-guide" aria-label={t("Permisos por rol", "Permissions by role", "Permissões por função")}>
        <article><span>◆</span><div><strong>{t("Administrador", "Administrator", "Administrador")}</strong><small>{t("Gestiona invitados, contenido, colaboradores y configuración.", "Manages guests, content, collaborators and settings.", "Gerencia convidados, conteúdo, colaboradores e configurações.")}</small></div></article>
        <article><span>✎</span><div><strong>Editor</strong><small>{t("Modifica el evento, pero no administra accesos ni configuración sensible.", "Edits the event but cannot manage access or sensitive settings.", "Edita o evento, mas não gerencia acessos nem configurações sensíveis.")}</small></div></article>
        <article><span>◉</span><div><strong>{t("Solo lectura", "View only", "Somente leitura")}</strong><small>{t("Puede consultar la información sin realizar cambios.", "Can view information without making changes.", "Pode consultar informações sem fazer alterações.")}</small></div></article>
      </section>
      {notice && <p className="import-success" role="status">{notice}</p>}
      <section className="metrics-grid mini">
        <Metric
          label={t("Administradores", "Administrators", "Administradores")}
          value={String(accesses.filter((access) => access.role === "admin").length)}
          note={t("gestionan accesos", "manage access", "gerenciam acessos")}
          tone="blue"
        />
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
        {loadingAccesses && <p className="module-notice" role="status">{t("Cargando colaboradores…", "Loading collaborators…", "Carregando colaboradores…")}</p>}
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
                    {["owner", "admin"].includes(order.accessRole) ? (
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
                        <option value="admin">{t("Administrador", "Administrator", "Administrador")}</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">
                          {t("Solo lectura", "View only", "Somente leitura")}
                        </option>
                      </select>
                    ) : access.role === "admin" ? (
                      t("Administrador", "Administrator", "Administrador")
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
                    {["owner", "admin"].includes(order.accessRole) && (
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
      {["owner", "admin"].includes(order.accessRole) && (
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
                  <option value="admin">{t("Administrador", "Administrator", "Administrador")}</option>
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
  const [customSocialCircle, setCustomSocialCircle] = useState(false);
  const defaultSocialCircles = ["Amigos", "Facultad", "Trabajo", "Colegio", "Familia", "Club"];
  const socialCircleOptions = [...new Set([...defaultSocialCircles, ...guests.map((item) => item.socialCircle).filter(Boolean)])];
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
          <label>{t("Grupo de invitación", "Invitation group", "Grupo do convite")}<small className="field-help">{t("Personas que comparten una misma invitación.", "People sharing one invitation.", "Pessoas que compartilham o mesmo convite.")}</small><input name="group" defaultValue={guest.group} /></label>
          <label>{t("Círculo social", "Social circle", "Círculo social")}<small className="field-help">{t("Se usa para sugerir la misma mesa o una mesa cercana.", "Used to suggest the same or a nearby table.", "Usado para sugerir a mesma mesa ou uma mesa próxima.")}</small><span className="social-circle-field"><select name={customSocialCircle ? undefined : "socialCircle"} defaultValue={guest.socialCircle || ""} onChange={(event) => setCustomSocialCircle(event.target.value === "__custom__")}><option value="">{t("Sin círculo social", "No social circle", "Sem círculo social")}</option>{socialCircleOptions.map((circle) => <option key={circle} value={circle}>{circle}</option>)}<option value="__custom__">＋ {t("Agregar otro círculo…", "Add another circle…", "Adicionar outro círculo…")}</option></select>{customSocialCircle && <input name="socialCircle" autoFocus placeholder={t("Ej. Amigos de los padres", "E.g. Parents' friends", "Ex. Amigos dos pais")} />}</span></label>
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
          <label>{t("Sentar junto a", "Seat together with", "Sentar junto com")}<small className="field-help">{t("Elegí una persona o grupo; aparecerá como sugerencia en Mesas.", "Choose a person or group; it will appear as a seating suggestion.", "Escolha uma pessoa ou grupo; aparecerá como sugestão nas mesas.")}</small><input name="socialTogetherWith" list="global-social-references" defaultValue={guest.socialTogetherWith} placeholder={t("Nombre o grupo", "Name or group", "Nome ou grupo")} /></label>
          <label>{t("Mantener separado de", "Keep separate from", "Manter separado de")}<input name="socialSeparateFrom" list="global-social-references" defaultValue={guest.socialSeparateFrom} placeholder={t("Nombre o grupo", "Name or group", "Nome ou grupo")} /></label>
          <datalist id="global-social-references">{[...new Set(guests.flatMap((item) => [item.name, item.group, item.socialCircle]).filter(Boolean))].map((value) => <option key={value} value={value} />)}</datalist>
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

function CheckInModule({ guests, setGuests, canEdit }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; canEdit: boolean }) {
  const { text: t, locale } = useAdminI18n();
  const [tables, setTables] = useState<EventTable[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "arrived">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/admin/tables").then(async (response) => { const result = await response.json() as { tables?: EventTable[] }; if (response.ok) setTables(result.tables || []); }).catch(() => undefined); }, []);
  const confirmed = guests.filter((guest) => guest.status === "Confirmado");
  const normalized = query.trim().toLocaleLowerCase();
  const visible = confirmed.filter((guest) => {
    const matches = !normalized || [guest.name, guest.group, guest.phone, guest.identificationNumber].some((value) => value?.toLocaleLowerCase().includes(normalized));
    return matches && (filter === "all" || (filter === "arrived" ? Boolean(guest.checkedInAt) : !guest.checkedInAt));
  });
  const expected = confirmedPeopleTotal(confirmed);
  const arrived = confirmed.filter((guest) => guest.checkedInAt).reduce((total, guest) => total + confirmedPeopleForGuest(guest, guests), 0);
  const tableFor = (guest: Guest) => tables.find((table) => table.guests.includes(guest.id));
  const update = async (ids: string[], checked: boolean) => {
    if (!ids.length || saving) return;
    setSaving(true); setError("");
    try {
      const bulk = ids.length > 1;
      const response = await fetch("/api/admin/guests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: `${bulk ? "bulk-" : ""}${checked ? "check-in" : "undo-check-in"}`, ...(bulk ? { ids } : { id: ids[0] }) }) });
      const result = await response.json() as { guest?: Guest; guests?: Guest[]; error?: string };
      if (!response.ok) throw new Error(result.error || t("No pudimos registrar la llegada.", "We could not record arrival.", "Não foi possível registrar a chegada."));
      const changed = new Map((result.guests || (result.guest ? [result.guest] : [])).map((guest) => [guest.id, guest]));
      setGuests((current) => current.map((guest) => changed.get(guest.id) || guest)); setSelected([]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setSaving(false); }
  };
  const allVisibleSelected = visible.length > 0 && visible.every((guest) => selected.includes(guest.id));
  return <>
    <div className="page-heading"><div><span className="eyebrow">{t("Recepción del evento", "Event reception", "Recepção do evento")}</span><h1>{t("Check-in de invitados", "Guest check-in", "Check-in de convidados")}</h1><p>{t("Buscá, verificá mesa y registrá llegadas en segundos.", "Search, check the table and record arrivals in seconds.", "Pesquise, confira a mesa e registre chegadas em segundos.")}</p></div></div>
    <section className="metrics-grid checkin-metrics"><Metric label={t("Esperados", "Expected", "Esperados")} value={String(expected)} note={t("personas confirmadas", "confirmed people", "pessoas confirmadas")} tone="blue" /><Metric label={t("Presentes", "Arrived", "Presentes")} value={String(arrived)} note={`${expected ? Math.round(arrived / expected * 100) : 0}% ${t("del total", "of total", "do total")}`} tone="green" /><Metric label={t("Por llegar", "Not arrived", "Por chegar")} value={String(Math.max(0, expected - arrived))} note={t("personas pendientes", "people pending", "pessoas pendentes")} tone="amber" /></section>
    <section className="panel checkin-panel">
      <div className="checkin-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar por nombre, grupo, teléfono o documento…", "Search name, group, phone or ID…", "Buscar nome, grupo, telefone ou documento…")} /><div>{(["all", "pending", "arrived"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? t("Todos", "All", "Todos") : value === "pending" ? t("Por llegar", "Not arrived", "Por chegar") : t("Presentes", "Arrived", "Presentes")}</button>)}</div></div>
      {selected.length > 0 && canEdit && <div className="checkin-bulk"><strong>{selected.length} {t("seleccionados", "selected", "selecionados")}</strong><button disabled={saving} onClick={() => update(selected, true)}>{t("Marcar presentes", "Mark arrived", "Marcar presentes")}</button><button disabled={saving} onClick={() => update(selected, false)}>{t("Deshacer llegada", "Undo arrival", "Desfazer chegada")}</button></div>}
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap"><table className="checkin-table"><thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? selected.filter((id) => !visible.some((guest) => guest.id === id)) : [...new Set([...selected, ...visible.map((guest) => guest.id)])])} /></th><th>{t("Invitado", "Guest", "Convidado")}</th><th>{t("Grupo", "Group", "Grupo")}</th><th>{t("Mesa / asiento", "Table / seat", "Mesa / assento")}</th><th>{t("Restricciones", "Restrictions", "Restrições")}</th><th>{t("Llegada", "Arrival", "Chegada")}</th><th>{t("Acción", "Action", "Ação")}</th></tr></thead><tbody>{visible.map((guest) => { const table = tableFor(guest); const seat = table?.seatAssignments?.[guest.id]; return <tr key={guest.id} className={guest.checkedInAt ? "checked-in" : ""}><td><input type="checkbox" checked={selected.includes(guest.id)} onChange={() => setSelected((current) => current.includes(guest.id) ? current.filter((id) => id !== guest.id) : [...current, guest.id])} /></td><td><GuestNameButton guest={guest} /><small>{guest.phone || guest.identificationNumber || "—"}</small></td><td>{guest.group || "—"}</td><td><strong>{table?.name || t("Sin mesa", "No table", "Sem mesa")}</strong><small>{seat ? `${t("Asiento", "Seat", "Assento")} ${seat}` : table ? t("Sin asiento fijo", "No fixed seat", "Sem assento fixo") : ""}</small></td><td>{guestHasRestriction(guest) ? <span className="restriction-chip">{guest.food !== "—" ? guest.food : guest.accessibilityNeeds}</span> : "—"}</td><td>{guest.checkedInAt ? <><strong className="arrival-ok">✓ {t("Presente", "Arrived", "Presente")}</strong><small>{reportDate(guest.checkedInAt, locale)}</small></> : <span className="muted">{t("Por llegar", "Not arrived", "Por chegar")}</span>}</td><td>{canEdit ? <button className={guest.checkedInAt ? "outline-button" : "primary-button"} disabled={saving} onClick={() => update([guest.id], !guest.checkedInAt)}>{guest.checkedInAt ? t("Deshacer", "Undo", "Desfazer") : t("Registrar", "Check in", "Registrar")}</button> : "—"}</td></tr>; })}</tbody></table></div>
      {!visible.length && <div className="empty-state">{t("No encontramos invitados con esos filtros.", "No guests match those filters.", "Nenhum convidado corresponde aos filtros.")}</div>}
    </section>
  </>;
}

function InvitationModule({ order }: { order: AdminOrder }) {
  const { text: t } = useAdminI18n();
  const templateId = builderTemplateIdForOrder(order.modelName);
  const builderUrl = `/?builder=${encodeURIComponent(templateId)}&pedido=${encodeURIComponent(order.orderNumber)}`;
  return <>
    <div className="page-heading invitation-module-heading">
      <div>
        <span className="eyebrow">{t("Diseño y contenido", "Design and content", "Design e conteúdo")}</span>
        <h1>{t("Invitación", "Invitation", "Convite")}</h1>
        <p>{t("Editá el diseño, los textos, las fotos y las secciones de tu invitación.", "Edit your invitation design, copy, photos and sections.", "Edite o design, os textos, as fotos e as seções do convite.")}</p>
      </div>
    </div>
    <section className="panel invitation-builder-access">
      <div className="invitation-builder-icon">✦</div>
      <div className="invitation-builder-copy">
        <span>{t("Tu invitación digital", "Your digital invitation", "Seu convite digital")}</span>
        <h2>{t("Creá tu invitación paso a paso", "Create your invitation step by step", "Crie seu convite passo a passo")}</h2>
        <p>{t("Abrila con el pedido actual y el modelo que elegiste. Podés guardar un borrador y continuar cuando quieras.", "Open it with the current order and your chosen template. Save a draft and continue whenever you like.", "Abra com o pedido atual e o modelo escolhido. Salve um rascunho e continue quando quiser.")}</p>
        <dl>
          <div><dt>{t("Pedido", "Order", "Pedido")}</dt><dd>{order.orderNumber}</dd></div>
          <div><dt>{t("Modelo", "Template", "Modelo")}</dt><dd>{order.modelName || templateId}</dd></div>
        </dl>
      </div>
      <a className="primary-button invitation-builder-button" href={builderUrl} target="_blank" rel="noreferrer">✨ {t("Crear mi invitación", "Create my invitation", "Criar meu convite")}</a>
    </section>
  </>;
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
  const [eventPortfolio, setEventPortfolio] = useState<Array<{ id: string; orderNumber: string; name: string; eventDate: string }>>([]);
  const [switchingEvent, setSwitchingEvent] = useState(false);
  const [comfortableText, setComfortableText] = useState(
    () =>
      window.sessionStorage.getItem("syd-admin-font-size") === "comfortable-v2",
  );
  const hasViewAccess = useCallback((item: string) => {
    const requiredModule = moduleForView[item];
    return !requiredModule || order.enabledModules.includes(requiredModule);
  }, [order.enabledModules]);
  useEffect(() => {
    fetch("/api/admin/events", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setEventPortfolio(((await response.json()) as { events: typeof eventPortfolio }).events);
    }).catch(() => undefined);
  }, []);
  const switchEvent = async (orderNumber: string) => {
    if (!orderNumber || orderNumber === order.orderNumber) return;
    setSwitchingEvent(true);
    const response = await fetch("/api/admin/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber }) });
    if (response.ok) window.location.reload();
    else setSwitchingEvent(false);
  };
  const navLabel = useCallback(
    (item: string) =>
      (
        ({
          Resumen: t("Resumen", "Overview", "Resumo"),
          Invitación: t("Invitación", "Invitation", "Convite"),
          Invitados: t("Invitados", "Guests", "Convidados"),
          Confirmaciones: t("Confirmaciones", "Confirmations", "Confirmações"),
          Mesas: t("Mesas", "Tables", "Mesas"),
          "Check-in": t("Check-in", "Check-in", "Check-in"),
          "Álbum colaborativo": t("Álbum colaborativo", "Collaborative album", "Álbum colaborativo"),
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
    if (!hasViewAccess(item)) return;
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
            {eventPortfolio.length > 1 && <select aria-label={t("Cambiar evento", "Switch event", "Trocar evento")} value={order.orderNumber} disabled={switchingEvent} onChange={(event) => void switchEvent(event.target.value)}>
              {eventPortfolio.map((item) => <option key={item.id} value={item.orderNumber}>{item.name}</option>)}
            </select>}
          </div>
        </div>
        <nav>
          {nav
            .filter(
              ([item]) =>
                (upcomingViews.has(item) || hasViewAccess(item)) && (item !== "Configuración" || ["owner", "admin"].includes(order.accessRole)),
            )
            .map(([item, icon]) => (
              <button
                key={item}
                className={`${view === item ? "active" : ""}${upcomingViews.has(item) ? " upcoming" : ""}`}
                onClick={() => { if (!upcomingViews.has(item)) navigate(item); }}
                disabled={upcomingViews.has(item)}
                title={upcomingViews.has(item) ? t("Próximamente", "Coming soon", "Em breve") : undefined}
              >
                <span>{icon}</span>
                {navLabel(item)}
                {upcomingViews.has(item) && <em>{t("Próximamente", "Coming soon", "Em breve")}</em>}
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
          <span className="admin-action-icon is-logout" aria-hidden="true" />
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
                    : order.accessRole === "admin"
                      ? t("Administrador", "Administrator", "Administrador")
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
          {view === "Invitación" && <InvitationModule order={order} />}
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
            <Seating guests={activeGuests} setGuests={setGuests} canEdit={order.accessRole !== "viewer"} />
          )}
          {view === "Check-in" && <CheckInModule guests={activeGuests} setGuests={setGuests} canEdit={order.accessRole !== "viewer"} />}
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
              onModulesChange={(enabledModules) => onOrderChange({ ...order, enabledModules })}
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
        if (!response.headers.get("content-type")?.includes("application/json"))
          return;
        const result = (await response.json()) as { order: AdminOrder };
        if (!result.order) return;
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
      .catch(() => undefined)
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
