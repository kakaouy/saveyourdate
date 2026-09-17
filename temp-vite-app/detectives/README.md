# Los Archivos F

Juego familiar en https://www.saveyourdate.site/los-archivos-f/.
Entrada Vite independiente: `los-archivos-f/index.html`. Recursos bajo `public/los-archivos-f/`.
Los módulos `api/_lib/detectives`, servidos por el enrutador existente `api/admin/[action].ts`, validan códigos, deducciones y desbloqueos. Las partidas viven en la tabla aislada `detective_games` de Supabase, con acceso exclusivo del servidor; se reutilizan las variables privadas existentes del proyecto. Aplicar la migración `20260917010000_detective_games.sql` antes de publicar.

Los 20 códigos privados y sus tarjetas QR no se guardan en GitHub. El servidor sólo contiene hashes SHA-256. El mismo código recupera la partida desde otro dispositivo. El diploma se genera únicamente al cerrar el caso. La cookie está limitada a `/los-archivos-f`.

Origen: prototipo Sites de Los Archivos F. Al migrar el 17 de septiembre de 2026, su base no contenía partidas.
