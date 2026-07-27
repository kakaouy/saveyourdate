export const RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export const retentionDeadline = (eventDate: unknown) => {
  const value = String(eventDate || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const eventDay = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(eventDay.getTime())) return null;
  return new Date(eventDay.getTime() + (RETENTION_DAYS + 1) * DAY_MS);
};

export const eventAccessExpired = (payload: Record<string, unknown>, now = new Date()) => {
  const deadline = retentionDeadline(payload.eventDate);
  return deadline ? now >= deadline : false;
};

export const daysBeforeRetentionDeadline = (payload: Record<string, unknown>, now = new Date()) => {
  const deadline = retentionDeadline(payload.eventDate);
  if (!deadline) return null;
  return Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS);
};

