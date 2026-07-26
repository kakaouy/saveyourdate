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
```

En proyectos nuevos, usar la **Secret key** con prefijo `sb_secret_`. El nombre
de la variable se conserva por compatibilidad con proyectos anteriores.

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` y `ORDER_APPROVAL_SECRET` son
secretos: nunca deben usar el prefijo `VITE_` ni incorporarse al frontend.

En Resend debe verificarse `saveyourdate.site` antes de enviar desde
`hello@saveyourdate.site`. Las respuestas se dirigen a `ORDER_ADMIN_EMAIL`.

### 3. Flujo

1. El cliente envía el pedido.
2. Recibe el número y el enlace privado `/estado?token=...`.
3. El administrador recibe `/validar-pago?token=...`.
4. El administrador verifica Mercado Pago y confirma.
5. El pedido cambia a `payment_validated` y el cliente recibe un email.

El idioma elegido al enviar el pedido (`es`, `en` o `pt`) se conserva en la
tabla y se usa en los correos y en la página privada del cliente. Los avisos
administrativos permanecen en español.

Los archivos adjuntos siguen enviándose al correo mediante FormSubmit; los
datos principales y el estado quedan persistidos en Supabase.
