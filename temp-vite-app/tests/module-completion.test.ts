import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builder = readFileSync(path.join(appRoot, 'src', 'components', 'invitation-builder', 'InvitationBuilderPage.tsx'), 'utf8');
const admin = readFileSync(path.join(appRoot, 'src', 'components', 'AdminPrototype.tsx'), 'utf8');
const accessApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'access.ts'), 'utf8');
const guestsApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'guests.ts'), 'utf8');
const rsvpApi = readFileSync(path.join(appRoot, 'api', 'rsvp.ts'), 'utf8');
const healthApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'health.ts'), 'utf8');
const builderApi = readFileSync(path.join(appRoot, 'api', '_lib', 'admin', 'invitation-builder.ts'), 'utf8');
const reviewPage = readFileSync(path.join(appRoot, 'src', 'components', 'InvitationReviewPage.tsx'), 'utf8');

test('el constructor divide el formulario en un recorrido guiado', () => {
  for (const step of ['design', 'event', 'sections', 'copy', 'media', 'extras', 'review']) {
    assert.match(builder, new RegExp(`id: '${step}'`));
  }
  assert.match(builder, /builder-progress-track/);
  assert.match(builder, /goToAdjacentStep/);
  assert.match(builder, /Paso \{activeStepIndex \+ 1\} de/);
  assert.match(builder, /stepForValidationField/);
  assert.match(builder, /Ir a corregir →/);
});

test('los recordatorios permiten selección y envío de emails en lote', () => {
  assert.match(admin, /selectedReminderIds/);
  assert.match(admin, /const emailSelectedReminders = async/);
  assert.match(admin, /bulkReminderProgress/);
  assert.match(admin, /action: "remind-email"/);
  assert.match(admin, /const validateReminderSetup =/);
  assert.match(admin, /setBulkReminderBusy\(false\)/);
});

test('los accesos explican permisos y evitan colaboradores duplicados', () => {
  assert.match(admin, /className="access-role-guide"/);
  assert.match(admin, /Rol actualizado\. La sesión anterior fue cerrada por seguridad/);
  assert.match(accessApi, /Ese email ya corresponde a tu acceso actual/);
  assert.match(accessApi, /Esa persona ya tiene acceso al evento/);
  assert.match(accessApi, /catch \(emailError\)[\s\S]*method: 'DELETE'/);
  assert.match(accessApi, /revoked_at/);
  assert.match(admin, /const loadActivities = useCallback/);
});

test('sólo quienes editan pueden iniciar invitaciones por WhatsApp', () => {
  assert.match(admin, /\{canEdit && !guest\.archivedAt && <button\s+className="whatsapp-button"/);
  assert.match(admin, /El navegador bloqueó WhatsApp/);
  assert.doesNotMatch(admin, /const invitationSentAt = new Date\(\)\.toISOString\(\);\s*setGuests/);
  assert.match(admin, /Invitación registrada como enviada/);
});

test('WhatsApp manual no se presenta como entrega confirmada', () => {
  assert.match(guestsApi, /clientGuest\(updatedRows\[0\], "manual"\)/);
  assert.match(admin, /Preparado manualmente/);
});

test('rechazar una invitación limpia datos operativos ocultos', () => {
  assert.match(rsvpApi, /food: status === 'Confirmado'/);
  assert.match(rsvpApi, /transport_option: status === 'Confirmado'/);
  assert.match(rsvpApi, /accessibility_needs: status === 'Confirmado'/);
  assert.match(rsvpApi, /guest_notes: status === 'Confirmado'/);
});

test('el diagnóstico distingue envío y seguimiento de WhatsApp', () => {
  for (const variable of ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_TEMPLATE_NAME', 'WHATSAPP_GRAPH_VERSION', 'WHATSAPP_APP_SECRET', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN']) {
    assert.match(healthApi, new RegExp(variable));
  }
  assert.match(healthApi, /status: 'warning'/);
  assert.match(admin, /"whatsapp"/);
  assert.match(admin, /is-warning/);
});

test('el constructor respeta el modelo elegido en el pedido', () => {
  assert.match(builderApi, /const requestedTemplateFor =/);
  assert.match(builderApi, /'15-verona': 'verona'/);
  assert.match(builderApi, /suggestedTemplateId/);
  assert.match(builder, /payload\.suggestedTemplateId/);
  assert.match(builder, /setDocument\(suggested\.createDocument\(\)\)/);
});

test('un modelo tradicional no se reemplaza silenciosamente por Aurora', () => {
  assert.match(builder, /unsupportedRequestedModel/);
  assert.match(builder, /Este pedido usa un modelo tradicional/);
  assert.match(builder, /El guardado está bloqueado/);
  assert.match(builder, /disabled=\{saving \|\| Boolean\(unsupportedRequestedModel\)\}/);
});

test('una invitación en revisión o publicada no vuelve a borrador al editar', () => {
  assert.match(builderApi, /!\['draft', 'changes_requested'\]\.includes\(current\.workflow_status\)/);
  assert.match(builderApi, /no se puede editar mientras está en revisión/);
  assert.match(builder, /const canEditDocument =/);
  assert.match(builder, /Vista de consulta/);
  assert.match(builder, /builder-panel.*is-readonly/);
});

test('la revisión evita aprobar o publicar dos veces por accidente', () => {
  assert.match(reviewPage, /const \[busy, setBusy\]/);
  assert.match(reviewPage, /if \(busy\) return/);
  assert.match(reviewPage, /disabled=\{busy\}/);
  assert.match(reviewPage, /useCallback/);
});
