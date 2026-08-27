type BackupRecord = Record<string, unknown>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const records = (value: unknown) =>
  Array.isArray(value) && value.every((item) => item && typeof item === 'object' && !Array.isArray(item))
    ? value as BackupRecord[]
    : null;

export const validateBackup = (value: unknown, expectedOrderNumber: string) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'El archivo no contiene un respaldo válido.' } as const;
  }
  const backup = value as BackupRecord;
  const event = backup.event as BackupRecord | undefined;
  const guests = records(backup.guests);
  const tables = records(backup.tables);
  const collaborators = records(backup.collaborators);
  const layoutElements = backup.layoutElements === undefined ? [] : records(backup.layoutElements);
  const layoutSpaces = backup.layoutSpaces === undefined ? [] : records(backup.layoutSpaces);
  if (
    backup.format !== 'save-your-date-admin-backup' ||
    backup.version !== 1 ||
    !event ||
    String(event.orderNumber || '').toUpperCase() !== expectedOrderNumber.toUpperCase() ||
    !guests ||
    !tables ||
    !collaborators || !layoutElements || !layoutSpaces
  ) {
    return { error: 'El respaldo no corresponde a este pedido o tiene un formato incompatible.' } as const;
  }
  if (guests.length > 500 || tables.length > 100 || layoutElements.length > 300 || layoutSpaces.length > 20 || collaborators.length > 20) {
    return { error: 'El respaldo supera los límites permitidos.' } as const;
  }
  for (const table of tables) {
    if (!UUID.test(String(table.id || '')) || !String(table.name || '').trim()) {
      return { error: 'El respaldo contiene una mesa incompleta.' } as const;
    }
    const capacity = Number(table.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
      return { error: 'El respaldo contiene una capacidad de mesa inválida.' } as const;
    }
  }
  const tableIds = new Set(tables.map((table) => String(table.id)));
  for (const guest of guests) {
    if (!UUID.test(String(guest.id || '')) || !String(guest.name || '').trim()) {
      return { error: 'El respaldo contiene un invitado incompleto.' } as const;
    }
    const seats = Number(guest.seats);
    const confirmed = Number(guest.confirmed);
    if (!Number.isInteger(seats) || seats < 1 || seats > 20 || !Number.isInteger(confirmed) || confirmed < 0 || confirmed > seats) {
      return { error: 'El respaldo contiene cantidades de invitados inválidas.' } as const;
    }
    if (guest.table_id && !tableIds.has(String(guest.table_id))) {
      return { error: 'El respaldo referencia una mesa que no existe.' } as const;
    }
    if (guest.invite_token && !UUID.test(String(guest.invite_token))) {
      return { error: 'El respaldo contiene un enlace personalizado inválido.' } as const;
    }
  }
  for (const collaborator of collaborators) {
    const email = String(collaborator.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['admin', 'editor', 'viewer'].includes(String(collaborator.role))) {
      return { error: 'El respaldo contiene un colaborador inválido.' } as const;
    }
  }
  for (const element of layoutElements) {
    if (!UUID.test(String(element.id || '')) || !String(element.label || '').trim() || !String(element.space_name || '').trim()) {
      return { error: 'El respaldo contiene un elemento incompleto en el plano.' } as const;
    }
  }
  for (const space of layoutSpaces) {
    if (!String(space.space_name || '').trim()) return { error: 'El respaldo contiene un espacio incompleto.' } as const;
  }
  return { backup, event, guests, tables, layoutElements, layoutSpaces, collaborators } as const;
};
