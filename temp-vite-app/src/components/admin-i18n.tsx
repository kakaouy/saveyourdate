import React, { createContext, useContext } from "react";

export type AdminLanguage = "es" | "en" | "pt";

type AdminI18nValue = {
  language: AdminLanguage;
  text: (es: string, en: string, pt: string) => string;
  locale: string;
};

const AdminI18nContext = createContext<AdminI18nValue>({
  language: "es",
  text: (es) => es,
  locale: "es-UY"
});

export function AdminI18nProvider({ language, children }: { language: AdminLanguage; children: React.ReactNode }) {
  const value: AdminI18nValue = {
    language,
    text: (es, en, pt) => language === "en" ? en : language === "pt" ? pt : es,
    locale: language === "en" ? "en-US" : language === "pt" ? "pt-BR" : "es-UY"
  };
  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export const useAdminI18n = () => useContext(AdminI18nContext);

export const adminText = (language: AdminLanguage, es: string, en: string, pt: string) =>
  language === "en" ? en : language === "pt" ? pt : es;

export const adminStatus = (language: AdminLanguage, value: string) => {
  const labels: Record<string, [string, string, string]> = {
    Confirmado: ["Confirmado", "Confirmed", "Confirmado"],
    Pendiente: ["Pendiente", "Pending", "Pendente"],
    "No asiste": ["No asiste", "Not attending", "Não comparece"],
    accepted: ["Aceptado", "Accepted", "Aceito"],
    sent: ["Enviado", "Sent", "Enviado"],
    delivered: ["Entregado", "Delivered", "Entregue"],
    read: ["Leído", "Read", "Lido"],
    failed: ["Error", "Error", "Erro"]
  };
  const label = labels[value];
  return label ? adminText(language, ...label) : value;
};

