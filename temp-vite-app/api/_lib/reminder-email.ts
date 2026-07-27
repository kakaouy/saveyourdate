import { emailShell, escapeHtml } from './orders.js';

export const reminderEmailHtml = ({
  recipientName,
  eventTitle,
  actionUrl,
  isTest = false
}: {
  recipientName: string;
  eventTitle: string;
  actionUrl: string;
  isTest?: boolean;
}) => emailShell(
  isTest ? 'Prueba de recordatorio' : '¿Nos acompañás?',
  `<p>Hola <strong>${escapeHtml(recipientName)}</strong>, ${isTest ? 'este es un ejemplo del recordatorio para' : 'falta poco para'} <strong>${escapeHtml(eventTitle)}</strong>.</p>
   <p>${isTest ? 'El envío automático está correctamente configurado. Los invitados pendientes recibirán un mensaje con este formato y su enlace personal.' : 'Tu respuesta todavía está pendiente. Podés confirmar asistencia, acompañantes y preferencias desde este enlace:'}</p>
   <p style="text-align:center;margin:28px 0"><a href="${actionUrl}" style="display:inline-block;padding:13px 22px;border-radius:9px;background:#0aabb0;color:#fff;text-decoration:none;font-weight:800">${isTest ? 'Volver al panel' : 'Confirmar asistencia'}</a></p>
   <p style="font-size:13px;color:#765f69">${isTest ? 'Este correo fue solicitado por el propietario desde Configuración y no se envió a ningún invitado.' : 'Si ya respondiste por otro medio, podés ignorar este mensaje.'}</p>`
);
