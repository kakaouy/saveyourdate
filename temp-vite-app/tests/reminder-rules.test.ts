import assert from 'node:assert/strict';
import test from 'node:test';
import { daysUntilEvent, isReminderDue, reminderDaysFor } from '../api/_lib/reminder-rules.ts';

const today = new Date('2026-07-27T18:30:00Z');

test('calcula días por fecha UTC sin depender de la hora', () => {
  assert.equal(daysUntilEvent('2026-08-03', today), 7);
  assert.equal(daysUntilEvent('fecha-inválida', today), null);
});

test('limita la anticipación entre 1 y 60 días', () => {
  assert.equal(reminderDaysFor({}), 7);
  assert.equal(reminderDaysFor({ reminderDaysBefore: 0 }), 7);
  assert.equal(reminderDaysFor({ reminderDaysBefore: 90 }), 60);
});

test('sólo programa eventos habilitados en el día configurado', () => {
  assert.equal(isReminderDue({ eventDate: '2026-08-03', reminderDaysBefore: 7, automaticRemindersEnabled: true }, today), true);
  assert.equal(isReminderDue({ eventDate: '2026-08-03', reminderDaysBefore: 7, automaticRemindersEnabled: false }, today), false);
  assert.equal(isReminderDue({ eventDate: '2026-08-04', reminderDaysBefore: 7, automaticRemindersEnabled: true }, today), false);
});
