import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(
  path.join(appRoot, 'src', 'components', 'AdminPrototype.tsx'),
  'utf8',
);
const styles = readFileSync(path.join(appRoot, 'src', 'admin-prototype.css'), 'utf8');
const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');

test('Invitados concentra confirmaciones y seguimiento operativo', () => {
  const navBlock = source.match(/const nav = \[[\s\S]*?\n\];/)?.[0] || '';

  assert.doesNotMatch(navBlock, /\["Confirmaciones"/);
  assert.match(source, /className="guest-operation-summary"/);
  assert.match(source, /filter === "Respondieron"/);
  assert.match(source, /filter === "Restricciones"/);
  assert.match(source, /const exportGuestReport =/);
  assert.match(source, /filter === "Sin enviar"/);
  assert.match(source, /filter === "Enviadas pendientes"/);
  assert.match(source, /className=\{`delivery-status/);
});

test('el ciclo de invitación registra preparación, apertura y respuesta', () => {
  const rsvp = readFileSync(path.join(appRoot, 'api', 'rsvp.ts'), 'utf8');
  const migration = readFileSync(
    path.join(appRoot, 'supabase', 'migrations', '20260812010000_guest_invitation_lifecycle.sql'),
    'utf8',
  );

  assert.match(guestsApi, /mark-whatsapp-prepared/);
  assert.match(guestsApi, /mark-invitation-sent/);
  assert.match(guestsApi, /invitation_sent_at: preparedAt/);
  assert.match(guestsApi, /isReminder \? \{ reminded_at: preparedAt \}/);
  assert.match(guestsApi, /updated_at: preparedAt/);
  assert.match(rsvp, /invitation_opened_at: openedAt, updated_at: openedAt/);
  assert.match(rsvp, /responded_at: respondedAt,[\s\S]*updated_at: respondedAt/);
  assert.match(migration, /invitation_sent_at/);
  assert.match(migration, /invitation_opened_at/);
  assert.match(migration, /responded_at/);
});

test('el seguimiento RSVP distingue el recorrido y recomienda la próxima acción', () => {
  assert.match(source, /filter === "Vistas pendientes"/);
  assert.match(source, /abrieron y aún no respondieron/);
  assert.match(source, /className="guest-follow-up"/);
  assert.match(source, /Recordar respuesta/);
  assert.match(source, /Reenviar invitación/);
  assert.match(source, /Falta WhatsApp/);
  assert.match(styles, /\.guest-follow-up/);
});

test('el seguimiento separa el estado de la fecha y evita texto operativo diminuto', () => {
  assert.match(source, /className=\{`delivery-status guest-delivery-status/);
  assert.match(source, /<strong>\{guest\.whatsappStatus/);
  assert.match(source, /<small>\{reportDate/);
  assert.match(styles, /\.guest-delivery-status small \{[^}]*font-size: 10px/);
  assert.match(styles, /\.status-select \{[^}]*font-size: 11px/);
  assert.match(styles, /\.seat-progress small \{[^}]*font-size: 10px/);
  assert.match(styles, /\.guest-group-cell strong, \.guest-group-cell small \{[^}]*white-space: normal/);
});

test('el seguimiento usa mensajes por etapa y muestra el historial de contacto', () => {
  assert.match(source, /guest\.invitationOpenedAt\s*\?\s*t\(/);
  assert.match(source, /Te reenviamos la invitación/);
  assert.match(source, /className="guest-contact-history"/);
  assert.match(source, /Preparado para WhatsApp/);
  assert.match(source, /Abrió el enlace/);
  assert.match(source, /Respuesta recibida/);
  assert.match(styles, /\.guest-contact-history ol/);
  assert.match(source, /whatsAppReviewGuest/);
  assert.match(source, /className="modal whatsapp-review-modal"/);
  assert.match(source, /Continuar en WhatsApp/);
  assert.match(source, /Podrás editarlo antes de enviarlo/);
  assert.match(styles, /\.whatsapp-message-preview/);
  assert.match(source, /no significa que WhatsApp haya marcado el mensaje como leído/);
  assert.match(source, /WhatsApp registrado como preparado/);
  assert.match(source, /action: "mark-whatsapp-prepared"/);
  assert.match(source, /kind: guest\.invitationSentAt \? "reminder" : "invitation"/);
  assert.match(guestsApi, /reminded: row\.reminded_at \|\| ""/);
  assert.match(styles, /\.delivery-verification-note/);
});

test('los recordatorios por lote excluyen respuestas y requieren una revisión previa', () => {
  assert.match(source, /showBulkReminderReview/);
  assert.match(source, /bulkReminderRecipients/);
  assert.match(source, /guest\.status === "Pendiente" && !guest\.respondedAt/);
  assert.match(source, /Revisá antes de recordar/);
  assert.match(source, /Abrir siguiente mensaje/);
  assert.match(source, /Cada mensaje se abre por separado/);
  assert.match(styles, /\.bulk-reminder-summary/);
});

test('Invitados integra seguimiento, selección operativa e historial sin un módulo separado', () => {
  const navBlock = source.match(/const nav = \[[\s\S]*?\n\];/)?.[0] || '';

  assert.doesNotMatch(navBlock, /\["Recordatorios"/);
  assert.match(source, /view: "Invitados"/);
  assert.match(source, /className="guest-selection-shortcuts"/);
  assert.match(source, /Vistas sin respuesta/);
  assert.match(source, /guest\.socialCircle/);
  assert.match(source, /guest-last-reminder/);
  assert.match(source, /Ver historial y datos/);
  assert.match(styles, /\.guest-selection-shortcuts/);
  assert.match(styles, /\.guest-last-reminder/);
});

test('los cambios operativos se persisten en Supabase y vuelven a consultarse al recargar', () => {
  assert.match(source, /fetch\("\/api\/admin\/guests", \{ cache: "no-store" \}\)/);
  assert.match(source, /action: "bulk-update"/);
  assert.match(source, /action: "bulk-archive"/);
  assert.match(source, /action: "mark-whatsapp-prepared"/);
  assert.match(guestsApi, /Prefer: "return=representation"/);
  assert.match(guestsApi, /updated_at: preparedAt/);
  assert.match(guestsApi, /updated_at: new Date\(\)\.toISOString\(\)/);
});

test('la importación exige revisar duplicados y errores antes de guardar', () => {
  assert.match(source, /type GuestImportPreview =/);
  assert.match(source, /setImportPreview\(\{ fileName, rows: previewRows \}\)/);
  assert.match(source, /const confirmGuestImport = async/);
  assert.match(source, /className="modal import-preview-modal"/);
  assert.match(source, /!row\.duplicate && row\.errors\.length === 0/);
  const api = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  assert.match(api, /La lista cambió o contiene duplicados/);
});

test('Agregar invitados reúne los métodos y recomienda pegar una lista', () => {
  assert.match(source, /className="modal add-guests-modal"/);
  assert.match(source, /Agregar manualmente/);
  assert.match(source, /Pegar una lista/);
  assert.match(source, /Recomendado/);
  assert.match(source, /Importar un archivo/);
  assert.match(source, /Descargar planilla tipo/);
  assert.match(source, /guest-template-option/);
  assert.match(source, /const previewPastedGuests = async/);
  assert.match(source, /Paso 1 de 3 · Pegar lista/);
  assert.match(source, /Paso 3 de 3 · Revisión/);
  assert.match(styles, /\.guest-add-options/);
  assert.match(styles, /\.paste-guests-input/);
});

test('la revisión de importación permite corregir filas y muestra un resultado final', () => {
  assert.match(source, /const updateImportPreviewGuest =/);
  assert.match(source, /onChange=\{\(event\) => updateImportPreviewGuest\(index, "name"/);
  assert.match(source, /onChange=\{\(event\) => updateImportPreviewGuest\(index, "seats"/);
  assert.match(source, /type GuestImportResult =/);
  assert.match(source, /Importación terminada/);
  assert.match(source, /duplicados omitidos/);
  assert.match(styles, /\.import-result-summary/);
  assert.match(source, /syd-guest-import-mapping-v1/);
  assert.match(source, /const undoLastGuestImport = async/);
  assert.match(source, /action: "bulk-archive"/);
  assert.match(source, /Deshacer importación/);
});

test('la importación de archivos permite asociar columnas antes de revisar', () => {
  assert.match(source, /type GuestImportMapping =/);
  assert.match(source, /Paso 2 de 3 · Asociar columnas/);
  assert.match(source, /Decinos qué contiene cada columna/);
  assert.match(source, /guestImportFields\.map/);
  assert.match(styles, /\.import-mapping-grid/);
});

test('la lista conserva las acciones completas y expone los datos solicitados', () => {
  assert.match(source, /className="guests-table"/);
  assert.match(source, /Ver historial y datos/);
  assert.match(source, /className="modal guest-details-modal"/);
  assert.match(source, /inspectingGuest\.identificationNumber/);
  assert.match(styles, /\.guests-table th:nth-last-child\(1\)/);
  assert.match(styles, /\.guest-details-grid/);
});

test('Invitados usa ayuda contextual y estados vacíos accionables', () => {
  assert.match(source, /aria-label=\{t\("Ayuda sobre invitados"/);
  assert.match(source, /className="help-circle context-tip"/);
  assert.match(source, /className="guest-empty-row"/);
  assert.match(source, /Todavía no agregaste invitados/);
  assert.match(source, /No encontramos invitados con estos filtros/);
  assert.match(source, /setQuery\(""\); setFilter\("Todos"\)/);
  assert.match(styles, /\.guest-empty-state/);
  assert.match(styles, /\.heading-actions \.context-tip::after/);
});

test('WhatsApp queda visible y copiar, editar y archivar pasan a Más opciones', () => {
  assert.match(source, /className="whatsapp-button"/);
  assert.match(source, /className="guest-more-menu"/);
  assert.match(source, /Copiar enlace/);
  assert.match(source, /Editar invitado/);
  assert.match(source, /Archivar invitado/);
  assert.doesNotMatch(source, /className="icon-button danger"/);
  assert.match(styles, /\.guest-more-menu>div/);
});

test('archivar es recuperable y excluye al invitado de la operación', () => {
  const api = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  const rsvp = readFileSync(path.join(appRoot, 'api', 'rsvp.ts'), 'utf8');
  const cron = readFileSync(path.join(appRoot, 'api', 'cron-reminders.ts'), 'utf8');

  assert.match(source, /filter === "Archivados"/);
  assert.match(source, /action: archived \? "archive" : "restore"/);
  assert.match(api, /guests\.bulk_archived/);
  assert.match(api, /guests\.bulk_restored/);
  assert.match(rsvp, /archived_at=is\.null/);
  assert.match(cron, /archived_at=is\.null/);
  assert.match(api, /archivedAt \? \{ table_id: null, seat_number: null \} : \{\}/);
});

test('los cambios de invitados y mesas no dejan nombres o asientos obsoletos', () => {
  const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const rsvpApi = readFileSync(path.join(appRoot, 'api', 'rsvp.ts'), 'utf8');

  assert.match(tablesApi, /status=eq\.Confirmado&archived_at=is\.null&select=id,table_id,seat_number/);
  assert.match(tablesApi, /preferred_table_name: rows\[0\]\.name/);
  assert.match(tablesApi, /body: JSON\.stringify\(\{ table_id: null, seat_number: null/);
  assert.match(guestsApi, /changes\.table_id = null/);
  assert.match(guestsApi, /changes\.seat_number = null/);
  assert.match(rsvpApi, /status !== 'Confirmado' \? \{ table_id: null, seat_number: null \}/);
  assert.match(source, /const normalizedTableName = tableName\.trim\(\)/);
  assert.match(source, /const onlyRenaming = Boolean/);
  assert.match(source, /onlyRenaming\s*\? \{ action: "rename"/);
  assert.match(source, /confirmedGuests\.find\(\(guest\) => guest\.id === id\)/);
});

test('el RSVP y el admin comparten los datos de logística', () => {
  const rsvpPage = readFileSync(path.join(appRoot, 'src', 'components', 'GuestRsvpPage.tsx'), 'utf8');
  const rsvpApi = readFileSync(path.join(appRoot, 'api', 'rsvp.ts'), 'utf8');

  for (const field of ['transportOption', 'transportStop', 'menuChoice', 'accessibilityNeeds', 'guestNotes']) {
    assert.match(rsvpPage, new RegExp(field));
    assert.match(source, new RegExp(field));
  }
  assert.match(rsvpApi, /transport_option/);
  assert.match(rsvpApi, /menu_choice/);
  assert.match(rsvpApi, /accessibility_needs/);
  assert.match(source, /filter === "Logística"/);
});

test('los accesos del resumen llevan al centro de invitados', () => {
  assert.doesNotMatch(source, /onNavigate\("Confirmaciones"\)/);
  assert.match(source, /onNavigate\("Invitados"\)/);
});

test('las mesas aceptan grupos por arrastre, validan capacidad y permiten deshacer', () => {
  assert.match(source, /event\.dataTransfer\.setData\("text\/guest-id", guest\.id\)/);
  assert.match(source, /remaining >= draggedPeople/);
  assert.match(source, /drop-compatible/);
  assert.match(source, /drop-blocked/);
  assert.match(source, /const undoLastAssignment = async/);
  assert.match(source, /Deshacer movimiento/);
});

test('la interfaz evita sugerencias automáticas y conserva filtros manuales', () => {
  assert.doesNotMatch(source, /Sugerir distribución/);
  assert.doesNotMatch(source, /className="modal assignment-preview-modal"/);
  assert.match(source, /assignmentFilter === "assigned"/);
});

test('la asignación asistida se aplica como una única transacción', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const migration = readFileSync(
    path.join(appRoot, 'supabase', 'migrations', '20260812020000_atomic_table_assignments.sql'),
    'utf8',
  );
  assert.match(tablesApi, /rpc\/assign_event_guests_batch/);
  assert.match(tablesApi, /table\.guests_batch_assigned/);
  assert.match(migration, /create or replace function public\.assign_event_guests_batch/);
  assert.match(migration, /if over_capacity_count > 0/);
  assert.match(migration, /update event_guests guest/);
});

test('el inspector concentra menús y alertas operativas y el reporte los conserva', () => {
  assert.match(source, /const selectedMenuSummary = new Map<string, number>/);
  assert.match(source, /className="floor-inspector-operations"/);
  assert.match(source, /selectedDietaryAlerts/);
  assert.match(source, /selectedAccessibilityAlerts/);
  assert.match(source, /class="ops"/);
  assert.match(source, /guest\.companions/);
});

test('las tarjetas de mesa priorizan identidad, ocupación e invitados', () => {
  const card = source.match(/<article\s+id=\{`table-card-[\s\S]*?<div className="seated-guests">/)?.[0] || '';
  assert.match(card, /<h3>\{table\.name\}<\/h3>/);
  assert.match(card, /className="capacity-row"/);
  assert.match(card, /className=\{`table-health/);
  assert.doesNotMatch(card, /table\.note/);
  assert.doesNotMatch(card, /table-social-conflicts/);
  assert.doesNotMatch(card, /table-operations/);
  assert.match(source, /className="table-name-edit"/);
  assert.doesNotMatch(card, /dietaryAlerts/);
  assert.match(source, /className="restriction-mark context-tip"/);
  assert.match(source, /people > 1 && <small>/);
});

test('el nombre guardado se impone en la tarjeta y no puede volver al valor anterior', () => {
  assert.match(source, /table\.id === editingId \? \{ \.\.\.table, name: normalizedTableName \} : table/);
  assert.match(source, /\.\.\.result\.table!, name: normalizedTableName, guests: table\.guests/);
  assert.match(source, /\.\.\.result\.table!, name, guests: item\.guests/);
  assert.match(source, /table\.id === previousTable\.id \? previousTable : table/);
  assert.match(styles, /\.tables-workspace \.table-card-top \.table-name-edit/);
  assert.match(styles, /\.table-seat-map\.is-round \.table-surface \{ inset: auto; top: 50%; left: 50%; width: 92px; height: 92px/);
  assert.match(styles, /\.table-seat-map \{ height: auto; margin-block: 10px 3px; \}/);
});

test('la leyenda de mesas pasa a una ayuda contextual compacta', () => {
  assert.match(source, /className="table-layout-title"/);
  assert.match(source, /aria-label=\{t\("Cómo leer las mesas"/);
  assert.match(source, /Verde: tiene lugares/);
  assert.doesNotMatch(source, /className="table-status-legend"/);
  assert.match(styles, /\.table-layout-title \.context-tip::after/);
  assert.doesNotMatch(styles, /\.table-status-legend \{/);
});

test('la navegación y densidad se agrupan en Vista con controles más compactos', () => {
  assert.match(source, /className="workspace-view-menu"/);
  assert.match(source, /<summary>\{t\("Vista"/);
  assert.match(source, /className="table-navigation"/);
  assert.match(source, /className=\{`view-density-toggle/);
  assert.match(styles, /\.workspace-actions>\.outline-button\.compact \{ min-height: 30px/);
  assert.match(styles, /\.workspace-view-menu>summary \{ min-height: 30px/);
  assert.match(styles, /\.add-table-menu>summary \{[^}]*min-height: 31px/);
  assert.match(styles, /\.floor-inspector-actions button \{ min-height: 30px/);
});

test('las formas de mesa se conservan dentro de Añadir mesa', () => {
  assert.match(source, /className="add-table-menu"/);
  assert.match(source, /Elegir forma de mesa/);
  for (const shape of ['round', 'rectangular', 'square', 'living']) {
    assert.match(source, new RegExp(`openNew\\("${shape}"\\)`));
  }
  assert.match(styles, /\.table-shape-tools \{ position: absolute/);
});

test('el inspector deja lo cotidiano visible y agrupa lo avanzado', () => {
  assert.match(source, /className="floor-inspector-advanced"/);
  assert.match(source, /Opciones avanzadas/);
  assert.match(source, /Edición completa/);
  assert.match(source, /className="floor-inspector-delete"/);
  const advanced = source.match(/<details className="floor-inspector-advanced">[\s\S]*?<\/details>/)?.[0] || '';
  assert.match(advanced, /floor-inspector-note/);
  assert.match(advanced, /floor-inspector-operations/);
  assert.match(advanced, /floor-inspector-actions/);
  assert.doesNotMatch(advanced, /floor-inspector-delete/);
  assert.match(styles, /\.floor-inspector-advanced>summary/);
});

test('el plano admite mesas y Living con lugares visibles', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260813030000_living_seating_areas.sql'), 'utf8');
  assert.match(source, /type EventTable =/);
  assert.match(source, /shape: "round" \| "rectangular" \| "square" \| "living"/);
  assert.match(source, /className=\{`table-seat-map is-/);
  assert.match(source, /className=\{`seat-marker/);
  assert.match(source, /table-shape-picker/);
  assert.match(tablesApi, /table_shape/);
  assert.match(migration, /check \(table_shape in \('round', 'rectangular', 'square', 'living'\)\)/);
});

test('Living funciona como una zona sin límite ni sillas numeradas', () => {
  const source = readFileSync(path.join(appRoot, 'src', 'components', 'AdminPrototype.tsx'), 'utf8');
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260813040000_unlimited_living_areas.sql'), 'utf8');
  assert.match(source, /table\.shape === "living"/);
  assert.match(source, /"Sin límite", "Unlimited", "Sem limite"/);
  assert.match(source, /!isLiving && <div className={`table-seat-map/);
  assert.match(tablesApi, /!isLiving && !canAssignGuest/);
  assert.match(tablesApi, /seatNumber && !targetIsLiving/);
  assert.match(migration, /event_table\.table_shape <> 'living'/);
});

test('la búsqueda permite ubicar juntos un grupo o círculo de forma atómica', () => {
  assert.match(source, /const matchingInvitationGroups = query\.trim/);
  assert.match(source, /const matchingSocialCircles = socialCircleFilter/);
  assert.match(source, /const matchingSeatingCollections =/);
  assert.match(source, /const assignCollection = async/);
  assert.match(source, /action: "assign-batch"/);
  assert.match(source, /className="group-search-results"/);
  assert.match(source, /Ubicar juntos/);
  assert.match(source, /Buscar invitado, grupo o círculo…/);
});

test('el panel mantiene textos auxiliares legibles y separa ubicar juntos del borde', () => {
  assert.match(styles, /\.group-search-results \{ gap: 9px; padding: 15px 12px 12px; \}/);
  assert.match(styles, /\.group-search-results > strong \{ display: block; margin: 0; line-height: 1\.35; \}/);
  assert.match(styles, /\.admin-shell :is\([\s\S]*\.guest-assign-list small[\s\S]*\) \{ font-size: 11px; \}/);
});

test('Mesas ofrece un recorrido móvil simple de dos pasos', () => {
  assert.match(source, /const \[mobileSeatingStep, setMobileSeatingStep\]/);
  assert.match(source, /className="mobile-seating-switch"/);
  assert.match(source, /Buscar invitados/);
  assert.match(source, /Elegir ubicación/);
  assert.match(styles, /\.mobile-seating-switch/);
  assert.match(styles, /\.seating-mobile-hidden/);
});

test('el respaldo conserva Living, el plano y los asientos asignados', () => {
  const backupApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'backup.ts'), 'utf8');
  const restoreApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'restore.ts'), 'utf8');
  assert.match(backupApi, /table_shape/);
  assert.match(backupApi, /seat_number/);
  assert.match(backupApi, /group_name.*guest_type.*social_together_with.*preferred_table_name/);
  assert.match(backupApi, /event_layout_elements/);
  assert.match(backupApi, /event_layout_spaces/);
  assert.match(restoreApi, /'living'/);
  assert.match(restoreApi, /seat_number: guest\.seat_number/);
  assert.match(restoreApi, /social_together_with: String\(guest\.social_together_with/);
  assert.match(restoreApi, /companion_of_id: guest\.companion_of_id/);
  assert.match(restoreApi, /validation\.layoutElements/);
  assert.match(restoreApi, /validation\.layoutSpaces/);
});

test('los grupos pueden ubicarse en un asiento concreto sin solaparse', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812040000_guest_seat_positions.sql'), 'utf8');
  assert.match(source, /seatAssignments: Record<string, number>/);
  assert.match(source, /void assignGuest\(guestId, table\.id, true, seatIndex \+ 1\)/);
  assert.match(source, /const placeGuest =/);
  assert.match(tablesApi, /Uno o más asientos seleccionados ya están ocupados/);
  assert.match(tablesApi, /seat_number: tableId && seatNumber/);
  assert.match(migration, /event_guests_seat_number_check/);
});

test('el admin distingue adultos y niños en la lista y los asientos', () => {
  const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812050000_guest_age_category.sql'), 'utf8');
  assert.match(source, /guestType: "adult" \| "teen" \| "child"/);
  assert.match(source, /name="guestType"/);
  assert.match(source, /person\?\.guest\.guestType === "child"/);
  assert.match(source, /seat-category-legend/);
  assert.match(guestsApi, /guest_type/);
  assert.match(migration, /guest_type/);
});

test('el plano permite girar, bloquear y ampliar la sala', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812060000_table_rotation_lock.sql'), 'utf8');
  assert.match(source, /const \[floorZoom, setFloorZoom\]/);
  assert.match(source, /rotation: \(\(selectedTable\.rotation \|\| 0\) \+ 45\) % 360/);
  assert.match(source, /locked: !selectedTable\.locked/);
  assert.match(source, /draggable=\{canEdit && !table\.locked\}/);
  assert.match(tablesApi, /rotation_degrees/);
  assert.match(tablesApi, /is_locked/);
  assert.match(migration, /is_locked boolean/);
});

test('las mesas redondas y cuadradas conservan su proporción al redimensionarlas', () => {
  assert.match(source, /table\.shape === "round" \|\| table\.shape === "square"/);
  assert.match(source, /width: surfaceSize \* 2, height: surfaceSize/);
});

test('el inspector del plano edita mesas sin dejar asignaciones inconsistentes', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  assert.match(source, /const renameTableInline = async/);
  assert.match(source, /const updateTableCapacityInline = async/);
  assert.match(source, /className="capacity-stepper"/);
  assert.match(source, /const minimumCapacity = Math\.max\(1, occupied, lastAssignedSeat\)/);
  assert.match(source, /Agregar invitado/);
  assert.match(source, /floor-inspector-guests/);
  assert.match(tablesApi, /select=confirmed,seat_number/);
  assert.match(tablesApi, /El asiento \$\{lastAssignedSeat\} está ocupado/);
  assert.match(source, /action: "rename"/);
  assert.match(source, /onBlur=\{\(\) => \{ if \(layoutTableNameDraft\.trim\(\)/);
  assert.match(tablesApi, /body\.action === 'rename'/);
});

test('las sillas ocupadas muestran el nombre junto al cursor', () => {
  assert.match(source, /const \[seatHover, setSeatHover\]/);
  assert.match(source, /onMouseMove=\{\(event\) => person && setSeatHover/);
  assert.match(source, /className="seat-hover-tooltip" role="tooltip"/);
  assert.match(styles, /\.seat-hover-tooltip \{ position: fixed/);
});

test('el plano admite los nuevos elementos y muestra ayuda sólo en contexto', () => {
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260827020000_expand_floor_plan_element_types.sql'), 'utf8');
  for (const element of ['wall', 'fountain', 'stage', 'restroom', 'photo-booth', 'divider']) {
    assert.match(migration, new RegExp(`'${element}'`));
  }
  assert.doesNotMatch(source, /className="seating-quick-status"/);
  assert.match(source, /className="context-tip" data-help=/);
  assert.doesNotMatch(source, /className="floor-plan-guide"/);
  assert.match(source, /className="table-name-save"/);
  assert.match(styles, /\.context-tip:hover::after/);
});

test('los elementos del plano muestran controles sólo al seleccionarlos', () => {
  assert.match(source, /const \[selectedFloorElementId, setSelectedFloorElementId\]/);
  assert.match(source, /selectedFloorElementId === element\.id \? "is-selected"/);
  assert.match(source, /canEdit && selectedFloorElementId === element\.id/);
  assert.match(source, /className="floor-table-inspector floor-element-inspector"/);
  assert.match(source, /const duplicateFloorElement = async/);
  assert.match(source, /Posición X/);
  assert.match(source, /Posición Y/);
  assert.match(styles, /\.floor-element-position/);
  assert.match(styles, /\.floor-element\.is-selected/);
  assert.match(styles, /\.floor-element-actions/);
});

test('la biblioteca conserva el elemento durante el arrastre y confirma dónde soltarlo', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  assert.match(source, /const \[draggedNewFloorElement, setDraggedNewFloorElement\]/);
  assert.match(source, /event\.dataTransfer\.effectAllowed = "copy"/);
  assert.match(source, /draggedNewFloorElement\?\.kind/);
  assert.match(source, /defaultFloorElementSize\(newElementKind\)/);
  assert.match(source, /room\.width - element\.width/);
  assert.match(source, /room\.height - element\.height/);
  assert.match(source, /className="floor-drop-message"/);
  assert.match(styles, /\.floor-space\.is-drop-target/);
  assert.match(tablesApi, /event_layout_elements_element_type_check/);
  assert.match(tablesApi, /La base de datos todavía no admite este tipo de elemento/);
});

test('la navegación del plano permite concentrarse en el lienzo', () => {
  assert.match(source, /const centerFloorPlan =/);
  assert.match(source, /const toggleFloorFullscreen = async/);
  assert.match(source, /document\.exitFullscreen/);
  assert.match(source, /requestFullscreen/);
  assert.match(source, /showFloorLibrary/);
  assert.match(source, /showFloorInspector/);
  assert.match(styles, /\.floor-plan-panel:fullscreen/);
  assert.match(styles, /\.floor-editor\.library-hidden/);
  assert.match(source, /const changeFloorZoom =/);
  assert.match(source, /const fitFloorPlan =/);
  assert.match(source, /Ajustar al salón/);
});

test('el plano confirma el guardado, permite reintentar y revierte movimientos fallidos', () => {
  assert.match(source, /const \[floorSaveStatus, setFloorSaveStatus\]/);
  assert.match(source, /const \[failedFloorSave, setFailedFloorSave\]/);
  assert.match(source, /const retryFloorElementSave = async/);
  assert.match(source, /persistFloorElement\(next, element\)/);
  assert.match(source, /const mergeSavedTableLayout =/);
  assert.match(source, /mergeSavedTableLayout\(saved\)/);
  assert.match(source, /item\.id === table\.id \? table : item/);
  assert.match(source, /savedSpaceSizesRef/);
  assert.match(source, /const tablesToFit = tables\.filter/);
  assert.match(source, /const elementsToFit = floorElements\.filter/);
  assert.match(source, /elementos se ajustaron al nuevo tamaño/);
  assert.match(source, /item\.id === saved\.id \? \{ \.\.\.item, \.\.\.saved \}/);
  assert.match(source, /className=\{`floor-save-status is-\$\{floorSaveStatus\}`\}/);
  assert.match(styles, /\.floor-save-status\.is-error/);
});

test('los elementos usan formas reconocibles y rotación contextual', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const rotationMigration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260827030000_floor_plan_element_rotation.sql'), 'utf8');
  assert.match(source, /className="floor-element-rotation"/);
  assert.match(source, /const defaultFloorElementSize =/);
  assert.match(source, /const minimumFloorElementSize =/);
  assert.match(source, /return \{ width: 20, height: 20 \}/);
  assert.match(source, /const floorElementIcon =/);
  assert.match(source, /const floorElementNeedsIcon =/);
  assert.match(source, /const isCircularFloorElement =/);
  assert.match(source, /width: size, height: size/);
  assert.match(source, /floor-element-size is-proportional/);
  assert.match(source, /floor-element-icon is-\$\{element\.kind\}/);
  assert.match(source, /context\.rotate\(\(\(element\.rotation \|\| 0\) \* Math\.PI\) \/ 180\)/);
  assert.match(source, /element\.width < 44 \|\| element\.height < 44/);
  assert.match(styles, /\.floor-element\.is-icon-only/);
  assert.match(styles, /\.floor-element\.is-very-small \.element-delete/);
  assert.match(source, /kind === "wall" \|\| kind === "divider"/);
  assert.match(source, /room\.width - size\.width/);
  assert.match(source, /"door", "window"/);
  assert.match(source, /transform: `rotate\(\$\{element\.rotation \|\| 0\}deg\)`/);
  assert.match(tablesApi, /rotation_degrees: Math\.round/);
  assert.match(rotationMigration, /add column if not exists rotation_degrees/);
  assert.match(styles, /\.floor-element:is\(\.is-wall,\.is-divider\)/);
  assert.match(styles, /\.floor-element:is\(\.is-cake,\.is-fountain,\.is-plant,\.is-column\)/);
});

test('el plano usa los iconos entregados para sus elementos principales', () => {
  const expectedIcons = ['kitchen.png', 'bar.png', 'restroom.png', 'dance-floor.png', 'photo-booth.png', 'emergency-exit.png', 'round-table.png', 'wall.png', 'plant.png', 'living.png'];
  expectedIcons.forEach((icon) => assert.equal(existsSync(path.join(appRoot, 'public', 'admin-icons', icon)), true, `falta ${icon}`));
  assert.match(styles, /mask-image: url\('\/admin-icons\/kitchen\.png'\)/);
  assert.match(styles, /mask-image: url\('\/admin-icons\/round-table\.png'\)/);
  assert.match(source, /floor-element-icon is-\$\{element\.kind\}/);
});

test('la familia extendida de iconos conserva grosor y significado en todo el plano', () => {
  const extendedIcons = ['stage.png', 'dj.png', 'cake.png', 'gifts.png', 'window.png', 'column.png', 'stairs.png', 'fountain.png', 'divider.png', 'floor-plan.png', 'guests.png', 'edit.png'];
  extendedIcons.forEach((icon) => assert.equal(existsSync(path.join(appRoot, 'public', 'admin-icons', icon)), true, `falta ${icon}`));
  assert.match(source, /stage: "\/admin-icons\/stage\.png"/);
  assert.match(source, /divider: "\/admin-icons\/divider\.png"/);
  assert.match(source, /seating-tab-icon is-guests/);
  assert.match(source, /admin-action-icon is-edit/);
  assert.match(styles, /mask-image: url\('\/admin-icons\/fountain\.png'\)/);
  assert.match(styles, /mask-image: url\('\/admin-icons\/floor-plan\.png'\)/);
});

test('las mesas y elementos del plano se pueden seleccionar con teclado', () => {
  assert.match(source, /role="button" tabIndex=\{0\} aria-pressed=\{selectedLayoutTableId === table\.id\}/);
  assert.match(source, /aria-pressed=\{selectedFloorElementId === element\.id\}/);
  assert.match(source, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(styles, /\.floor-table:focus-visible,\.floor-element:focus-visible/);
});

test('el celular puede mover invitados y objetos sin depender del drag nativo', () => {
  assert.match(source, /const moveTableWithPointer =/);
  assert.match(source, /const moveFloorElementWithPointer =/);
  assert.match(source, /event\.pointerType === "mouse"/);
  assert.match(source, /onPointerDown=\{\(event\) => moveTableWithPointer\(table, event\)\}/);
  assert.match(source, /onPointerDown=\{\(event\) => moveFloorElementWithPointer\(element, event\)\}/);
  assert.match(source, /if \(person\) selectGuestForSeat\(person\.guest\.id\)/);
  assert.match(styles, /\.floor-table,\.floor-element \{ touch-action: none/);
  assert.match(styles, /\.seat-marker\.is-occupied \{ touch-action: manipulation/);
});

test('el encabezado de entregables conserva aire respecto del borde', () => {
  assert.match(styles, /\.seating-export-center > header \{[^}]*padding: 4px 18px 2px/);
  assert.match(styles, /\.seating-export-center > header > div \{ min-width: 0; padding-right: 8px/);
});

test('la landing publica una política de privacidad adaptada a SaveYourDate', () => {
  const landing = readFileSync(path.join(appRoot, 'src', 'components', 'PlatformLandingConcept.tsx'), 'utf8');
  const landingStyles = readFileSync(path.join(appRoot, 'src', 'components', 'platform-landing-concept.css'), 'utf8');
  assert.match(landing, /function PrivacyPolicy\(\)/);
  assert.match(landing, /Última actualización: 27 de agosto de 2026/);
  assert.match(landing, /Supabase:/);
  assert.match(landing, /Resend y FormSubmit:/);
  assert.match(landing, /Mercado Pago:/);
  assert.match(landing, /hola@saveyourdate\.site/);
  assert.doesNotMatch(landing, /contact@seatplanning\.com/);
  assert.doesNotMatch(landing, /Stripe/);
  assert.match(landingStyles, /\.concept-legal-modal\.is-policy/);
});

test('imprimir y cerrar sesión usan PNG transparentes recoloreables', () => {
  ['print.png', 'logout.png'].forEach((icon) => assert.equal(existsSync(path.join(appRoot, 'public', 'admin-icons', icon)), true, `falta ${icon}`));
  assert.match(source, /admin-action-icon is-print/);
  assert.match(source, /admin-action-icon is-logout/);
  assert.match(styles, /mask-image: url\('\/admin-icons\/print\.png'\)/);
  assert.match(styles, /mask-image: url\('\/admin-icons\/logout\.png'\)/);
});

test('la exportación del plano ofrece calidad y vista previa privada', () => {
  assert.match(source, /const \[planExportScale, setPlanExportScale\]/);
  assert.match(source, /const floorElementIconPath =/);
  assert.match(source, /const createPlanImage = async/);
  assert.match(source, /context\.scale\(scale, scale\)/);
  assert.match(source, /const drawTintedPlanIcon =/);
  assert.match(source, /globalCompositeOperation = "source-in"/);
  assert.match(source, /drawTintedPlanIcon\(context, icon/);
  assert.match(source, /await createPlanImage\(\)/);
  assert.match(source, /const previewPlan =/);
  assert.match(source, /draw-element\.icon-only i/);
  assert.match(source, /Esta versión no incluye datos privados/);
  assert.match(source, /Abrir PDF imprimible/);
  assert.match(styles, /\.plan-preview-frame/);
});

test('los invitados se mueven entre sillas o vuelven a sin mesa mediante arrastre', () => {
  assert.match(source, /draggable=\{Boolean\(canEdit && person\)\}/);
  assert.match(source, /event\.dataTransfer\.setData\("text\/guest-id", person\.guest\.id\)/);
  assert.match(source, /className=\{`unassign-drop-zone/);
  assert.match(source, /void unassignGuest\(guestId\)/);
  assert.match(source, /guestCategoryFilter/);
  assert.match(source, /matchesCategory/);
});

test('el plano ajusta a cuadrícula, detecta solapamientos y duplica mesas', () => {
  assert.match(source, /const \[snapToGrid, setSnapToGrid\]/);
  assert.match(source, /Math\.round\(x \/ grid\) \* grid/);
  assert.match(source, /const overlappingTableIds = new Set/);
  assert.match(source, /className="layout-overlap-warning"/);
  assert.match(source, /const duplicateTable = async/);
  assert.match(source, /void duplicateTable\(selectedTable\)/);
});

test('el reporte de catering exporta personas con mesa, asiento y necesidades', () => {
  assert.match(source, /function seatingRowsForTable/);
  assert.match(source, /const exportCateringReport =/);
  assert.match(source, /catering-por-mesa\.csv/);
  assert.match(source, /row\.seat/);
  assert.match(source, /row\.accessibility/);
  assert.match(source, /onClick=\{exportCateringReport\}/);
  assert.match(source, /Asiento.*\$\{seat\.seat\}/s);
});

test('el plano mantiene un historial persistente de deshacer y rehacer', () => {
  assert.match(source, /layoutUndoStack/);
  assert.match(source, /layoutRedoStack/);
  assert.match(source, /current\.slice\(-29\)/);
  assert.match(source, /const undoLayoutChange = async/);
  assert.match(source, /const redoLayoutChange = async/);
  assert.match(source, /await restoreLayoutVersion\(change\.before\)/);
  assert.match(source, /await restoreLayoutVersion\(change\.after\)/);
});

test('la revisión visual incorpora adolescentes, arrastre de elementos y tamaño de sala', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const teenMigration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812070000_guest_teen_category.sql'), 'utf8');
  const spaceMigration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812080000_layout_space_sizes.sql'), 'utf8');
  assert.match(source, /guestType: "adult" \| "teen" \| "child"/);
  assert.doesNotMatch(source, /className="auto-assign-button"/);
  assert.match(source, /text\/new-element-kind/);
  assert.match(source, /const saveSpaceSize = async/);
  assert.match(source, /spaceSizes\[space\]/);
  assert.match(tablesApi, /event_layout_spaces/);
  assert.match(teenMigration, /'adult', 'teen', 'child'/);
  assert.match(spaceMigration, /canvas_width/);
});

test('los filtros no comprimen sus etiquetas y las restricciones sociales son visibles', () => {
  const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812090000_guest_social_preferences.sql'), 'utf8');
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(105px, 1fr\)\)/);
  assert.match(styles, /\.filter-pills button[^}]*white-space: nowrap/);
  assert.match(source, /socialTogetherWith/);
  assert.match(source, /socialSeparateFrom/);
  assert.match(source, /preferredTableName/);
  assert.match(source, /className="guest-menu-restrictions"/);
  assert.match(guestsApi, /social_together_with/);
  assert.match(guestsApi, /social_separate_from/);
  assert.match(migration, /preferred_table_name/);
});

test('la categoría y el asiento se pueden cambiar sin depender del arrastre', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  assert.match(source, /Categoría de edad/);
  assert.match(source, /className="seat-position-select"/);
  assert.match(source, /availableStarts/);
  assert.doesNotMatch(source, /Asiento automático/);
  assert.match(source, /const effectiveSeatByGuest = new Map/);
  assert.match(source, /className="seat-number"/);
  assert.match(source, /- Math\.PI \/ 2/);
  assert.match(source, /fromTableId === tableId && fromSeatNumber === seatNumber/);
  assert.doesNotMatch(source, /Parada o zona/);
  assert.match(tablesApi, /companion_of_id=not\.is\.null/);
  assert.match(tablesApi, /const guestSize = usesIndividualRows \? 1/);
});

test('la navegación permite buscar mesas y asignar por selección y clic', () => {
  assert.match(source, /const \[selectedGuestId, setSelectedGuestId\]/);
  assert.match(source, /const \[tableQuery, setTableQuery\]/);
  assert.match(source, /const visibleTables = tables\.filter/);
  assert.match(source, /const focusTable =/);
  assert.match(source, /className="table-navigation"/);
  assert.match(source, /Ahora elegí una silla libre/);
  assert.match(source, /void assignGuest\(selectedGuestId, table\.id, true, seatIndex \+ 1\)/);
  assert.match(styles, /\.seat-marker\.is-click-target/);
});

test('cada silla muestra categoría y prioriza las restricciones', () => {
  assert.match(source, /const guestHasRestriction =/);
  assert.match(source, /t\("Restricciones", "Restrictions", "Restrições"\)/);
  assert.match(source, /person && guestHasRestriction\(person\.guest\) \? "has-alert"/);
  assert.match(styles, /\.seat-marker\.is-occupied \.seat-number/);
  assert.match(styles, /\.seat-marker\.is-teen \.seat-number/);
  assert.match(styles, /\.seat-marker\.is-child \.seat-number/);
  assert.match(styles, /\.seat-marker\.has-alert \.seat-number/);
  assert.ok(styles.lastIndexOf('.seat-marker.has-alert') > styles.lastIndexOf('.seat-marker.is-selected'));
});

test('las preferencias sociales generan conflictos accionables por mesa', () => {
  assert.match(source, /const socialConflicts =/);
  assert.match(source, /findSocialReferences/);
  assert.match(source, /t\("debe sentarse junto a"/);
  assert.match(source, /t\("debe sentarse separado de"/);
  assert.match(source, /className="social-conflict-summary"/);
  assert.match(source, /const selectedSocialConflicts =/);
  assert.match(source, /className="floor-inspector-operations"/);
  assert.match(styles, /\.social-conflict-summary/);
  assert.match(styles, /\.floor-inspector-operations/);
});

test('el paquete de usabilidad agrupa densidad, guardado, vacíos y adaptación móvil', () => {
  assert.match(source, /const \[compactTables, setCompactTables\]/);
  assert.match(source, /const \[assignmentSavingId, setAssignmentSavingId\]/);
  assert.match(source, /setAssignmentStatus\("saving"\)/);
  assert.match(source, /setAssignmentStatus\("saved"\)/);
  assert.match(source, /const \[failedAssignment, setFailedAssignment\]/);
  assert.match(source, /assignmentStatus === "error" && failedAssignment/);
  assert.match(source, /className="seating-overview"/);
  assert.match(styles, /\.seating-overview/);
  assert.match(source, /className="tables-empty-state"/);
  assert.match(source, /Vista compacta/);
  assert.match(source, /className="clear-seating-filters"/);
  assert.match(styles, /\.tables-grid\.is-compact/);
  assert.match(styles, /\.table-card\.is-saving/);
  assert.match(styles, /\.guest-assign-list \{ max-height: none; overflow: visible/);
});

test('el segundo paquete agrega restricciones, referencias, exportación y teclado', () => {
  assert.match(source, /const \[guestRestrictionFilter, setGuestRestrictionFilter\]/);
  assert.match(source, /normalizedReference\(candidate\.group\) === normalized/);
  assert.match(source, /unresolved-together/);
  assert.match(source, /unresolved-separate/);
  assert.match(source, /conflictos-de-mesas\.csv/);
  assert.match(source, /className=\{`restriction-filter/);
  assert.match(source, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(source, /focusSpecificTable\(conflict\.tableId\)/);
});

test('sugiere una silla cercana cuando el grupo ya tiene mesa', () => {
  assert.match(source, /const suggestedGroupTable =/);
  assert.match(source, /const suggestedTargetIds =/);
  assert.match(source, /const groupSeatIndexes =/);
  assert.match(source, /const suggestedSeatIndex =/);
  assert.match(source, /seatIndex === suggestedSeatIndex \? "is-suggested"/);
  assert.match(source, /Asiento sugerido junto al grupo/);
  assert.match(styles, /\.seat-marker\.is-suggested/);
  assert.match(styles, /\.table-card\.is-group-suggestion/);
});

test('busca por grupo y prioriza la condición explícita de sentar junto', () => {
  assert.match(source, /guestTerms.*guest\.name.*guest\.group/);
  assert.match(source, /const findSocialReferences =/);
  assert.match(source, /const explicitTogetherGuests =/);
  assert.match(source, /const seatedExplicitTargetIds =/);
  assert.match(source, /hasTogetherMatchAtTable/);
  assert.match(source, /hasSeparateMatchAtTable/);
  assert.match(source, /list="global-social-references"/);
  assert.match(source, /list="local-social-references"/);
  assert.match(source, /aparecerá como sugerencia en Mesas/);
});

test('los círculos sociales alimentan la carga y las sugerencias de proximidad', () => {
  assert.match(source, /Círculo social/);
  assert.match(source, /Sin círculo social/);
  assert.match(source, /Agregar otro círculo…/);
  assert.match(source, /"Amigos",\s*"Facultad",\s*"Trabajo",\s*"Colegio",\s*"Familia",\s*"Club"/);
  assert.match(source, /newCustomSocialCircle && <input name="socialCircle"/);
  assert.match(source, /editCustomSocialCircle && <input name="socialCircle"/);
  assert.match(source, /group: \["grupo", "grupo de invitacion", "grupo invitacion", "familia"\]/);
  assert.match(source, /socialCircle: \["circulo", "circulo social"\]/);
  assert.match(source, /const circleTables = tables\.filter/);
  assert.match(source, /Math\.hypot/);
  assert.match(source, /mesa cercana a su círculo/);
  assert.match(source, /const \[socialCircleFilter, setSocialCircleFilter\]/);
  assert.match(source, /Todos los círculos/);
  assert.match(source, /const matchesCircle =/);
  assert.match(source, /Círculo disperso/);
  assert.match(source, /circle-distance-/);
  assert.match(source, /assignCollection\(kind, groupName, event\.target\.value\)/);
  assert.match(source, /basis: "circle"/);
  assert.match(source, /basis: "group"/);
  assert.match(source, /Administrar círculos/);
  assert.match(source, /const updateSocialCircleMembers = async/);
  assert.match(source, /protectedInvitationGroups/);
  assert.match(source, /className="modal social-circle-manager"/);
  assert.match(source, /className="floor-social-connectors"/);
  assert.match(source, /className={`seating-final-review/);
  assert.match(source, /Grupos separados/);
  assert.match(source, /Círculos dispersos/);
  assert.match(source, /afines ubicados/);
  assert.match(source, /guest-circle-tag/);
  assert.match(source, /has-social-circle/);
  assert.match(styles, /\.social-circle-filter/);
  assert.match(styles, /\.guest-circle-tag/);
  assert.match(styles, /\.table-card\.has-social-circle/);
  assert.match(styles, /\.floor-table\.has-social-circle/);
  assert.match(styles, /\.floor-social-connectors line/);
  assert.match(styles, /\.seating-final-review/);
  assert.match(styles, /\.social-circle-manager-list/);
});

test('grupo de invitación y círculo social se editan y muestran como conceptos separados', () => {
  assert.match(source, /<th className="guest-group-column">\{t\("Grupo", "Group", "Grupo"\)\}<\/th>/);
  assert.match(source, /<th className="guest-circle-column">\{t\("Círculo", "Circle", "Círculo"\)\}<\/th>/);
  assert.doesNotMatch(source, /Grupo \/ círculo/);
  assert.match(source, /const updateSocialCircleFromDetails = async/);
  assert.match(source, /className="guest-details-circle"/);
  assert.match(source, /detailsSocialCircle === inspectingGuest\.socialCircle/);
  assert.match(source, /function GlobalGuestEditor/);
  assert.match(source, /name=\{customSocialCircle \? undefined : "socialCircle"\}/);
  assert.match(source, /item\.name, item\.group, item\.socialCircle/);
  assert.match(styles, /\.guest-circle-cell/);
  assert.match(styles, /\.guests-table \.guest-secondary-column/);
  assert.match(source, /className="guest-circle-column" data-label=/);
  assert.match(source, /className="guest-actions-column" data-label=/);
  assert.match(styles, /\.guests-table tbody > tr:not\(\.guest-empty-row\)/);
});

test('las restricciones salen de la tabla y permanecen disponibles en más opciones', () => {
  assert.doesNotMatch(source, /<th className="guest-secondary-column">\{t\("Restricción"/);
  assert.doesNotMatch(source, /<td className="guest-secondary-column" data-label=\{t\("Restricción"/);
  assert.match(source, /className="guest-menu-restrictions"/);
  assert.match(source, /hasGuestRestriction\(guest\)/);
  assert.match(styles, /\.guest-menu-restrictions/);
});

test('la sugerencia permanece visible y se reinicia después de cada movimiento', () => {
  assert.match(source, /const suggestedTableForGuest =/);
  assert.match(source, /if \(explicitTable\) return/);
  assert.match(source, /if \(!normalizedGroup\) return null/);
  assert.match(source, /const guestSuggestion = suggestedTableForGuest\(guest\)/);
  assert.match(source, /guest-seat-suggestion/);
  assert.match(source, /setDragGuestId\(""\);\s*setSelectedGuestId\(""\);/);
  assert.match(source, /const seatedExplicitTargetIds =/);
  assert.match(styles, /\.guest-assign-list \.guest-seat-suggestion/);
  assert.doesNotMatch(source, /guestSuggestion && guestSuggestion\.table\.id !== currentTable/);
  assert.match(source, /hasConfirmedGroupPeers/);
  assert.match(source, /Sugerencia pendiente: ubicá primero a alguien de su grupo o círculo/);
  assert.match(source, /mesa correcta/);
});

test('las acciones masivas actualizan edad, logística y restricciones sin tocar otros campos', () => {
  const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  for (const field of ['guestType', 'transportOption', 'menuChoice', 'food', 'socialTogetherWith', 'socialSeparateFrom', 'preferredTableName']) {
    assert.match(source, new RegExp(`value="${field}"`));
    assert.match(guestsApi, new RegExp(field));
  }
  assert.match(source, /bulkField === "guestType"/);
  assert.match(source, /value="teen"/);
  assert.match(source, /selected\.length >= 25/);
  assert.match(source, /bulk-social-references/);
  assert.match(guestsApi, /changes\.guest_type = guestType/);
});

test('los elementos del plano conservan tamaños de hasta 20 px al guardar y restaurar', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const restoreApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'restore.ts'), 'utf8');
  assert.match(source, /return \{ width: 20, height: 20 \}/);
  assert.match(tablesApi, /element_width: Math\.round\(Math\.max\(20,/);
  assert.match(tablesApi, /element_height: Math\.round\(Math\.max\(20,/);
  assert.match(restoreApi, /element_width: Math\.max\(20,/);
  assert.match(restoreApi, /element_height: Math\.max\(20,/);
  assert.doesNotMatch(tablesApi, /element_width: Math\.round\(Math\.max\(90,/);
});

test('las tarjetas de invitados distribuyen datos y acciones sin comprimirlos', () => {
  assert.match(styles, /grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.guest-person-column \{ grid-column: 1 \/ 3; grid-row: 1/);
  assert.match(styles, /\.guest-status-column \{ grid-column: 3; grid-row: 1/);
  assert.match(styles, /\.guest-actions-column \.whatsapp-button \{ min-width: 48px; white-space: nowrap/);
  assert.match(styles, /@media \(max-width: 520px\)/);
});

test('entregables guía la elección y muestra una vista previa enfocada', () => {
  assert.match(source, /const \[exportSelection, setExportSelection\]/);
  assert.match(source, /aria-label=\{t\("Tipo de entregable"/);
  assert.match(source, /exportSelection === "coordination"/);
  assert.match(source, /exportSelection === "catering"/);
  assert.match(source, /exportSelection === "layout"/);
  assert.match(source, /La descarga incluye los datos reales; esta muestra no\./);
  assert.match(source, /PLANO SIN DATOS PRIVADOS/);
  assert.match(styles, /\.export-workspace/);
  assert.match(styles, /\.export-detail \{ display: grid; grid-template-columns:/);
});

test('el centro de invitados distingue el recorrido y permite programar recordatorios', () => {
  assert.match(source, /className={`guest-reminder-schedule/);
  assert.match(source, /Recordatorio automático por email/);
  assert.match(source, /filter === "Necesitan recordatorio"/);
  assert.match(source, /fetch\("\/api\/admin\/settings", \{/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /Preparado para WhatsApp/);
  assert.match(source, /Invitación web/);
  assert.match(source, /Abrió el enlace/);
  assert.match(source, /no significa que WhatsApp haya marcado el mensaje como leído/);
  assert.match(styles, /\.guest-reminder-schedule/);
  assert.match(styles, /\.guest-contact-history em/);
});

test('el centro de invitados muestra el seguimiento oficial de WhatsApp separado de la apertura web', () => {
  const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  const webhook = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'whatsapp-webhook.ts'), 'utf8');
  assert.match(guestsApi, /select=guest_id,status,status_at,error_detail/);
  assert.match(guestsApi, /whatsappStatusAt: whatsappTracking\.statusAt/);
  assert.match(guestsApi, /whatsappErrorDetail: whatsappTracking\.errorDetail/);
  assert.match(source, /guest\.whatsappStatus\s*\? whatsappStatus\(guest\.whatsappStatus\)\[0\]/);
  assert.match(source, /Meta no pudo entregar el mensaje/);
  assert.match(webhook, /x-hub-signature-256/);
  assert.match(webhook, /\['sent', 'delivered', 'read', 'failed'\]/);
  assert.match(styles, /\.guest-delivery-status\.is-read/);
  assert.match(styles, /\.guest-delivery-status\.is-failed/);
});
