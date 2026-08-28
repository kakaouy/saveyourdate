# Plantillas de WhatsApp para comunicaciones

> Estado actual: integración preparada, pero activación pospuesta hasta contar
> con WhatsApp Business. Mientras tanto, Save Your Date prepara cada mensaje y
> lo abre en el WhatsApp de la persona anfitriona para su revisión y envío
> manual. Este flujo no necesita ninguna variable de Meta.

Estas cuatro plantillas deberán crearse y aprobarse en WhatsApp Manager antes
de activar el envío automático para un evento. Los nombres son sugeridos; si
Meta aprueba otros, hay que colocar esos nombres exactos en Vercel.

Todas usan idioma `es` y cinco variables de cuerpo, siempre en este orden:

1. nombre del invitado;
2. nombre del evento;
3. mensaje editable;
4. despedida editable;
5. enlace del evento o de confirmación.

## Invitación — `syd_event_invitation_v1`

Categoría sugerida: Marketing.

```text
Hola {{1}}. Te invitamos a {{2}}.

{{3}}

{{4}}

Confirmá y consultá todos los detalles en {{5}}
```

## Recordatorio — `syd_rsvp_reminder_v1`

Categoría sugerida: Marketing. Meta puede reclasificarla durante la revisión.

```text
Hola {{1}}. Queríamos recordarte la invitación a {{2}}.

{{3}}

{{4}}

Podés responder en {{5}}
```

## Aviso — `syd_event_notice_v1`

Categoría sugerida: Utility cuando comunica una actualización operativa de un
evento ya aceptado; Meta puede reclasificarla según el texto enviado.

```text
Hola {{1}}. Tenemos una novedad sobre {{2}}.

{{3}}

{{4}}

Consultá la información actualizada en {{5}}
```

## Agradecimiento — `syd_event_thanks_v1`

Categoría sugerida: Marketing.

```text
Hola {{1}}. Gracias por acompañarnos en {{2}}.

{{3}}

{{4}}

Podés volver a ver el evento en {{5}}
```

## Variables privadas para una activación futura

```dotenv
META_APP_ID=
META_APP_SECRET=
META_EMBEDDED_SIGNUP_CONFIG_ID=
META_GRAPH_VERSION=v23.0
WHATSAPP_CONNECTION_ENCRYPTION_KEY=
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_INVITE_TEMPLATE_NAME=syd_event_invitation_v1
WHATSAPP_REMINDER_TEMPLATE_NAME=syd_rsvp_reminder_v1
WHATSAPP_NOTICE_TEMPLATE_NAME=syd_event_notice_v1
WHATSAPP_THANKS_TEMPLATE_NAME=syd_event_thanks_v1
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

`WHATSAPP_CONNECTION_ENCRYPTION_KEY` debe ser una clave aleatoria de 32 bytes
(codificada en base64 o hexadecimal). El token y el identificador del número se
obtienen mediante Embedded Signup y se guardan cifrados por evento; no se usa un
número central ni se cargan tokens de eventos como variables globales.

No se deben guardar tokens o secretos en Git. Las imágenes opcionales necesitan
una variante de plantilla con cabecera `IMAGE` aprobada por Meta; no deben
añadirse dinámicamente a una plantilla aprobada sin cabecera.

## Cómo activarlo más adelante

1. Aplicar `20260828010000_event_whatsapp_connections.sql` en Supabase.
2. Configurar Embedded Signup y las variables anteriores.
3. Aprobar las cuatro plantillas en la cuenta Business correspondiente.
4. Conectar el número desde Configuración del evento.
5. Hacer un primer envío programado únicamente a la persona organizadora.
6. Verificar en el historial los estados enviado, entregado y leído antes de
   habilitar programaciones para más destinatarios.
