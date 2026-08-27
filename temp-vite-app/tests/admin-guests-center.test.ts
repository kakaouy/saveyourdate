import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(
  path.join(appRoot, 'src', 'components', 'AdminPrototype.tsx'),
  'utf8',
);
const styles = readFileSync(path.join(appRoot, 'src', 'admin-prototype.css'), 'utf8');

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

test('el ciclo de invitación registra envío, apertura y respuesta', () => {
  const api = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
  const rsvp = readFileSync(path.join(appRoot, 'api', 'rsvp.ts'), 'utf8');
  const migration = readFileSync(
    path.join(appRoot, 'supabase', 'migrations', '20260812010000_guest_invitation_lifecycle.sql'),
    'utf8',
  );

  assert.match(api, /mark-invitation-sent/);
  assert.match(rsvp, /invitation_opened_at/);
  assert.match(rsvp, /responded_at/);
  assert.match(migration, /invitation_sent_at/);
  assert.match(migration, /invitation_opened_at/);
  assert.match(migration, /responded_at/);
});

test('la importación exige revisar duplicados y errores antes de guardar', () => {
  assert.match(source, /type GuestImportPreview =/);
  assert.match(source, /setImportPreview\(\{ fileName: file\.name, rows: previewRows \}\)/);
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
  assert.match(source, /const previewPastedGuests = async/);
  assert.match(source, /Paso 1 de 2 · Pegar lista/);
  assert.match(source, /Paso 2 de 2 · Revisión/);
  assert.match(styles, /\.guest-add-options/);
  assert.match(styles, /\.paste-guests-input/);
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

test('las acciones principales quedan visibles y Archivar pasa a Más opciones', () => {
  assert.match(source, /title=\{t\("Copiar enlace"/);
  assert.match(source, /className="whatsapp-button"/);
  assert.match(source, /aria-label=\{`\$\{t\("Editar"/);
  assert.match(source, /className="guest-more-menu"/);
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

test('la búsqueda permite ubicar un grupo completo de forma atómica', () => {
  assert.match(source, /const matchingGroups = query\.trim\(\)/);
  assert.match(source, /const assignGroup = async/);
  assert.match(source, /action: "assign-batch"/);
  assert.match(source, /className="group-search-results"/);
  assert.match(source, /Ubicar grupo completo/);
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
  assert.match(restoreApi, /'living'/);
  assert.match(restoreApi, /seat_number: guest\.seat_number/);
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
});

test('el plano admite los nuevos elementos y muestra ayuda sólo en contexto', () => {
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260827020000_expand_floor_plan_element_types.sql'), 'utf8');
  for (const element of ['wall', 'fountain', 'stage', 'restroom', 'photo-booth', 'divider']) {
    assert.match(migration, new RegExp(`'${element}'`));
  }
  assert.match(source, /className="seating-quick-status"/);
  assert.match(source, /className="context-tip" data-help=/);
  assert.doesNotMatch(source, /className="floor-plan-guide"/);
  assert.match(source, /className="table-name-save"/);
  assert.match(styles, /\.context-tip:hover::after/);
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
});

test('la exportación del plano ofrece calidad y vista previa privada', () => {
  assert.match(source, /const \[planExportScale, setPlanExportScale\]/);
  assert.match(source, /const createPlanImage =/);
  assert.match(source, /context\.scale\(scale, scale\)/);
  assert.match(source, /const previewPlan =/);
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
  assert.match(source, /className="restriction-chips"/);
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
  assert.match(source, /Sugerencia pendiente: ubicá primero a alguien de su grupo/);
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
