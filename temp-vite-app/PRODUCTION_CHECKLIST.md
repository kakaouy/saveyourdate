# Checklist de publicación

## 1. Base de datos

- Crear un respaldo del evento antes de aplicar cambios de esquema.
- En una base existente, aplicar en orden las migraciones pendientes de
  `supabase/migrations`.
- Para habilitar ubicaciones Living, aplicar
  `20260813030000_living_seating_areas.sql`.
- No eliminar ni recrear `event_tables` o `event_guests`: esas tablas contienen
  la distribución actual de invitados.
- Confirmar que una mesa existente mantiene sus invitados, asientos, posición y
  bloqueo después de la migración.

En una instalación nueva se puede ejecutar `supabase/orders.sql`; en una base
con datos se deben usar las migraciones incrementales.

## 2. Variables privadas

Verificar en Vercel para Production, Preview y Development:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ORDER_ADMIN_EMAIL`
- `ORDER_EMAIL_FROM`
- `PUBLIC_APP_URL`
- `ORDER_APPROVAL_SECRET` (mínimo 32 caracteres)
- `ADMIN_AUTH_SECRET` (mínimo 32 caracteres)
- `CRON_SECRET`

WhatsApp Business requiere además las variables `WHATSAPP_*` documentadas en
el README. Sin ellas, el panel funciona en modo manual y no debe mostrar una
entrega como confirmada.

## 3. Verificación previa

Ejecutar:

```bash
npm test
npm run build
npm run lint
```

Luego usar un pedido de prueba, sin contactos reales, para comprobar:

1. Acceso al panel y cambio de rol de un colaborador de prueba.
2. Alta, edición, archivado y restauración de un invitado de prueba.
3. Confirmación y rechazo desde un enlace RSVP de prueba.
4. Búsqueda por nombre de grupo y asignación completa a una mesa.
5. Creación de un Living y asignación del grupo de prueba.
6. Vista móvil en los pasos “Buscar invitados” y “Elegir ubicación”.
7. Recordatorio por email únicamente a una casilla controlada.
8. WhatsApp manual sin presionar el envío final.

Check-in queda fuera de esta etapa y no es requisito para publicar estos
módulos.

## 4. Despliegue y control posterior

- La configuración de Vercel desactiva deploys automáticos para ramas
  `agent/*`; integrar el commit en una rama habilitada antes de publicar.
- Abrir `/admin` y revisar el diagnóstico de base, email, WhatsApp y cron.
- Confirmar que `/confirmar` muestra un error claro sin token y carga con un
  token válido.
- Verificar que la distribución real de Mesas no cambió.
- Conservar el respaldo previo hasta finalizar la validación.
