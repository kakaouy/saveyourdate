# Plantillas de WhatsApp para comunicaciones

Estas cuatro plantillas deben crearse y aprobarse en WhatsApp Manager antes de
activar el envío automático. Los nombres son sugeridos; si Meta aprueba otros,
hay que colocar esos nombres exactos en Vercel.

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

## Variables privadas de Vercel

```dotenv
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_INVITE_TEMPLATE_NAME=syd_event_invitation_v1
WHATSAPP_REMINDER_TEMPLATE_NAME=syd_rsvp_reminder_v1
WHATSAPP_NOTICE_TEMPLATE_NAME=syd_event_notice_v1
WHATSAPP_THANKS_TEMPLATE_NAME=syd_event_thanks_v1
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

No se deben guardar tokens o secretos en Git. Las imágenes opcionales necesitan
una variante de plantilla con cabecera `IMAGE` aprobada por Meta; no deben
añadirse dinámicamente a una plantilla aprobada sin cabecera.
