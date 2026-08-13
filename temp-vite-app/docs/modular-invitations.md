# Invitaciones modulares

## Decisiones de producto

- Los tipos de cuenta iniciales son anfitrión, organizador, espacio para eventos, proveedor y administrador de plataforma.
- Una cuenta puede combinar roles y puede reutilizar recursos entre varios eventos cuando tiene esa capacidad habilitada.
- El acceso efectivo surge de los roles de cuenta, el plan, los adicionales contratados y la participación en cada evento.
- Los módulos iniciales son invitación, invitados/RSVP, mesas, check-in, mensajería, álbum colaborativo y proveedores.
- Organizadores y espacios pueden autoaprobar. Save Your Date puede exigir revisión adicional por cuenta o plan.
- El evento puede nacer desde el anfitrión o desde el organizador/espacio y luego incorporar a las demás partes.

## Separación de permisos

Los roles de cuenta describen el negocio y no deben confundirse con los permisos dentro de un evento. Cada cuenta participante recibe `owner`, `admin`, `editor` o `viewer`. Los proveedores, además, reciben una lista explícita de módulos visibles para ese evento.

## Documento de invitación

Cada invitación se guarda como un documento versionado, independiente del componente React que la renderiza. Contiene plantilla, paleta, idioma, orden y visibilidad de secciones, contenido editable y estado de publicación.

El editor y la invitación publicada deben usar el mismo documento. La vista previa no mantiene un modelo paralelo.

## Composición

1. Se eliminan secciones desconocidas, duplicadas o no disponibles para la plantilla/plan.
2. Se incorporan secciones faltantes y se fuerzan las obligatorias.
3. Se respetan posiciones bloqueadas, como portada al inicio y RSVP al final.
4. Se filtran las secciones desactivadas.
5. Se recalculan los tonos sobre la secuencia visible.
6. Se inserta un ornamento entre bloques visibles, excepto entre foto destacada y galería consecutivas.

## Migración de plantillas

Aurora es la plantilla piloto. Después de validar edición, responsive y publicación se migran Verona, Varezzia, Rivendell, Rosewood, Astraea y Coruscant. Las plantillas heredadas continúan en modo tradicional hasta adoptar el contrato común.

Una plantilla sólo puede anunciar compatibilidad con el constructor cuando declara:

- catálogo de secciones y restricciones;
- adaptador entre el documento común y su configuración visual;
- campos editables por sección;
- paletas disponibles;
- ornamentos y reglas de separación;
- pruebas de orden, visibilidad y contenido.

## Compatibilidad de pedidos existentes

Los pedidos anteriores reciben todos los módulos que ya estaban disponibles en el panel al convertirse por primera vez. Después de la conversión, `account_modules` pasa a ser la fuente de verdad y permite ajustar el acceso por rol, plan, adicional o decisión manual sin perder funcionalidades históricas.
