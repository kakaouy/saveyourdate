export const reminderDaysFor = (payload: Record<string, unknown>) =>
  Math.max(1, Math.min(60, Number(payload.reminderDaysBefore) || 7));

export const reminderRepeatDaysFor = (payload: Record<string, unknown>) =>
  Math.max(1, Math.min(30, Number(payload.reminderRepeatDays) || 3));

export const reminderMaxAttemptsFor = (payload: Record<string, unknown>) =>
  Math.max(1, Math.min(5, Number(payload.reminderMaxAttempts) || 1));

export const daysUntilEvent = (eventDate: string, now = new Date()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return null;
  const event = new Date(`${eventDate}T00:00:00Z`);
  if (Number.isNaN(event.getTime())) return null;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const eventUtc = Date.UTC(event.getUTCFullYear(), event.getUTCMonth(), event.getUTCDate());
  return Math.round((eventUtc - todayUtc) / 86400000);
};

export const isReminderDue = (payload: Record<string, unknown>, now = new Date()) =>
  payload.automaticRemindersEnabled === true
  && payload.automaticRemindersPaused !== true
  && (daysUntilEvent(String(payload.eventDate || ''), now) ?? -1) >= 0
  && (daysUntilEvent(String(payload.eventDate || ''), now) ?? 61) <= reminderDaysFor(payload);

export const guestReminderDue = ({
  payload,
  attempts,
  lastReminderAt,
  now = new Date()
}: {
  payload: Record<string, unknown>;
  attempts: number;
  lastReminderAt?: string | null;
  now?: Date;
}) => {
  if (!isReminderDue(payload, now) || attempts >= reminderMaxAttemptsFor(payload)) return false;
  if (!lastReminderAt || attempts === 0) return true;
  const last = new Date(lastReminderAt);
  if (Number.isNaN(last.getTime())) return true;
  return now.getTime() - last.getTime() >= reminderRepeatDaysFor(payload) * 86400000;
};
