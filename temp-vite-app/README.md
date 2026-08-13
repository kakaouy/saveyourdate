# Save Your Date

Sitio React/Vite desplegado en Vercel.

## Pedidos persistentes

El flujo guarda cada pedido en Supabase, envía un enlace privado de consulta al
cliente y un enlace privado de aprobación al correo administrativo. La
aprobación requiere revisar el resumen y presionar un botón; abrir el email no
cambia el estado.

### 1. Crear la tabla

En Supabase, abrir **SQL Editor**, pegar el contenido de
`supabase/orders.sql` y ejecutarlo una sola vez.

### 2. Variables de Vercel

Configurar en Production, Preview y Development:

```text
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
RESEND_API_KEY=re_...
ORDER_ADMIN_EMAIL=saveyourdate.invite@gmail.com
ORDER_EMAIL_FROM=Save Your Date <hello@saveyourdate.site>
PUBLIC_APP_URL=https://www.saveyourdate.site
ORDER_APPROVAL_SECRET=una-cadena-aleatoria-larga-de-al-menos-32-caracteres
ADMIN_AUTH_SECRET=otra-cadena-aleatoria-larga-de-al-menos-32-caracteres
CRON_SECRET=otra-cadena-aleatoria-larga
WHATSAPP_ACCESS_TOKEN=token-permanente-de-meta
WHATSAPP_PHONE_NUMBER_ID=id-del-numero
WHATSAPP_TEMPLATE_NAME=nombre-de-la-plantilla-aprobada
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_GRAPH_VERSION=vXX.X
WHATSAPP_APP_SECRET=secreto-de-la-aplicacion-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=token-propio-para-verificar-el-webhook
```

En proyectos nuevos, usar la **Secret key** con prefijo `sb_secret_`. El nombre
de la variable se conserva por compatibilidad con proyectos anteriores.

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ORDER_APPROVAL_SECRET` y
`ADMIN_AUTH_SECRET` son
secretos: nunca deben usar el prefijo `VITE_` ni incorporarse al frontend.

`ADMIN_AUTH_SECRET` firma las sesiones privadas del panel y debe tener al menos
32 caracteres. Cambiarlo cierra las sesiones administrativas existentes.

Las variables `WHATSAPP_*` también son privadas. El token, el identificador del
número, la plantilla y la versión de Graph habilitan el envío mediante WhatsApp
Business; el idioma de plantilla es opcional y usa `es` por defecto.
`WHATSAPP_APP_SECRET` y
`WHATSAPP_WEBHOOK_VERIFY_TOKEN` habilitan la validación del webhook y permiten
mostrar si cada mensaje fue enviado, entregado, leído o rechazado. Sin la
configuración Business, el panel abre WhatsApp manualmente y lo identifica como
un envío preparado, no como una entrega confirmada.

`CRON_SECRET` protege la ejecución de los recordatorios automáticos. El panel
privado muestra el estado de base de datos, correo, WhatsApp y automatización
sin revelar el contenido de estas variables.

En Resend debe verificarse `saveyourdate.site` antes de enviar desde
`hello@saveyourdate.site`. Las respuestas se dirigen a `ORDER_ADMIN_EMAIL`.

### 3. Flujo

1. El cliente puede completar el pedido y pagar, o pagar y luego completar el
   pedido. Ambas opciones forman parte del mismo recorrido.
2. Recibe el número y el enlace privado `/estado?token=...`.
3. También puede buscarlo desde `/consultar` usando email o WhatsApp junto con
   el número de pedido o de pago.
4. El administrador recibe `/validar-pago?token=...`, verifica Mercado Pago y
   confirma.
5. El pedido cambia a `payment_validated`; el cliente recibe un email y puede
   abrir `/preparando?token=...` para ver el modelo elegido con marca de agua.
6. El administrador puede enviar los avisos de pedido revisado y
   modificaciones realizadas desde el mismo panel.
7. Desde el enlace administrativo se cargan la URL final de la
   invitación y, opcionalmente, la planilla de Google Sheets.
8. El sistema guarda ambos enlaces, cambia el estado a `published` y envía el
   email final con accesos e instrucciones para compartir.

El Plan Básico conserva las secciones originales del modelo y admite hasta
cinco fotos cuando existe galería. El Plan Premium permite eliminar secciones,
agregar hasta tres nuevas y usar hasta ocho fotos.

El idioma elegido al enviar el pedido (`es`, `en` o `pt`) se conserva en la
tabla y se usa en los correos y en la página privada del cliente. Los avisos
administrativos permanecen en español.

Los archivos adjuntos siguen enviándose al correo mediante FormSubmit; los
datos principales y el estado quedan persistidos en Supabase.

## Publicación

Antes de desplegar cambios del panel, seguir
[`PRODUCTION_CHECKLIST.md`](./PRODUCTION_CHECKLIST.md). Las ramas `agent/*` no
generan despliegues automáticos en Vercel; deben integrarse en una rama con
deploy habilitado.
