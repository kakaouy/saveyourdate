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

test('cada mesa resume menús y alertas operativas también en el reporte', () => {
  assert.match(source, /const menuSummary = new Map<string, number>/);
  assert.match(source, /className="table-operations"/);
  assert.match(source, /dietaryAlerts/);
  assert.match(source, /accessibilityAlerts/);
  assert.match(source, /class="ops"/);
  assert.match(source, /guest\.companions/);
});

test('el plano admite mesas redondas, rectangulares y cuadradas con asientos visibles', () => {
  const tablesApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'tables.ts'), 'utf8');
  const migration = readFileSync(path.join(appRoot, 'supabase', 'migrations', '20260812030000_table_shapes.sql'), 'utf8');
  assert.match(source, /type EventTable =/);
  assert.match(source, /shape: "round" \| "rectangular" \| "square"/);
  assert.match(source, /className=\{`table-seat-map is-/);
  assert.match(source, /className=\{`seat-marker/);
  assert.match(source, /table-shape-picker/);
  assert.match(tablesApi, /table_shape/);
  assert.match(migration, /check \(table_shape in \('round', 'rectangular', 'square'\)\)/);
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
  assert.match(source, /rotation: \(\(table\.rotation \|\| 0\) \+ 45\) % 360/);
  assert.match(source, /locked: !table\.locked/);
  assert.match(source, /draggable=\{canEdit && !table\.locked\}/);
  assert.match(tablesApi, /rotation_degrees/);
  assert.match(tablesApi, /is_locked/);
  assert.match(migration, /is_locked boolean/);
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
  assert.match(source, /void duplicateTable\(table\)/);
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
