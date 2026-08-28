import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cron = fs.readFileSync(new URL('../api/cron-communications.ts', import.meta.url), 'utf8');
const whatsapp = fs.readFileSync(new URL('../api/_lib/whatsapp.ts', import.meta.url), 'utf8');
const vercel = fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');

test('las comunicaciones programadas se envían con control de duplicados y elegibilidad', () => {
  assert.match(cron, /row\.details\.delivery === 'event-whatsapp-business'/);
  assert.match(cron, /event_whatsapp_connections\?order_number=/);
  assert.match(cron, /decryptEventWhatsAppToken/);
  assert.match(cron, /phoneNumberId: eventConnection\.phone_number_id/);
  assert.doesNotMatch(cron, /supportsEventWhatsAppConnections = false/);
  assert.match(cron, /communication\.dispatching/);
  assert.match(cron, /deterministicUuid/);
  assert.match(cron, /communication\.auto_sent/);
  assert.match(cron, /communication\.auto_failed/);
  assert.match(cron, /failures >= 3/);
  assert.match(cron, /guest\.status === 'Pendiente'/);
  assert.match(cron, /guest\.status === 'Confirmado'/);
  assert.match(cron, /recipient_not_eligible/);
  assert.match(cron, /htmlToText/);
  assert.match(cron, /bankDetails/);
  assert.match(cron, /extraContent \|\| ''\) === 'image'/);
  assert.match(vercel, /\/api\/cron-communications/);
});

test('cada clase de comunicación usa una plantilla aprobada de Meta', () => {
  assert.match(whatsapp, /WHATSAPP_\$\{kind\.toUpperCase\(\)\}_TEMPLATE_NAME/);
  assert.match(whatsapp, /type: 'image'/);
  assert.match(whatsapp, /message/);
  assert.match(whatsapp, /closing/);
  assert.match(whatsapp, /actionUrl/);
});
