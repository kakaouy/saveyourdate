import assert from 'node:assert/strict';
import test from 'node:test';
import { daysUntilEvent, guestReminderDue, isReminderDue, reminderDaysFor, reminderMaxAttemptsFor, reminderRepeatDaysFor } from '../api/_lib/reminder-rules.ts';

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

test('abre la ventana configurada y respeta la pausa', () => {
  assert.equal(isReminderDue({ eventDate: '2026-08-03', reminderDaysBefore: 7, automaticRemindersEnabled: true }, today), true);
  assert.equal(isReminderDue({ eventDate: '2026-08-03', reminderDaysBefore: 7, automaticRemindersEnabled: false }, today), false);
  assert.equal(isReminderDue({ eventDate: '2026-08-04', reminderDaysBefore: 7, automaticRemindersEnabled: true }, today), false);
  assert.equal(isReminderDue({ eventDate: '2026-08-03', reminderDaysBefore: 7, automaticRemindersEnabled: true, automaticRemindersPaused: true }, today), false);
});

test('repite con intervalo y nunca supera el máximo', () => {
  const payload = { eventDate: '2026-08-03', reminderDaysBefore: 7, reminderRepeatDays: 3, reminderMaxAttempts: 2, automaticRemindersEnabled: true };
  assert.equal(reminderRepeatDaysFor(payload), 3);
  assert.equal(reminderMaxAttemptsFor(payload), 2);
  assert.equal(guestReminderDue({ payload, attempts: 0, now: today }), true);
  assert.equal(guestReminderDue({ payload, attempts: 1, lastReminderAt: '2026-07-26T18:30:00Z', now: today }), false);
  assert.equal(guestReminderDue({ payload, attempts: 1, lastReminderAt: '2026-07-24T18:30:00Z', now: today }), true);
  assert.equal(guestReminderDue({ payload, attempts: 2, lastReminderAt: '2026-07-20T18:30:00Z', now: today }), false);
});
