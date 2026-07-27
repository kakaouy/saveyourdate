export const reminderDaysFor = (payload: Record<string, unknown>) =>
  Math.max(1, Math.min(60, Number(payload.reminderDaysBefore) || 7));

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
  && daysUntilEvent(String(payload.eventDate || ''), now) === reminderDaysFor(payload);
