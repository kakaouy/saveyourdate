type Occupant = { id: string; confirmed?: number };

export const occupiedSeats = (occupants: Occupant[], excludedGuestId = '') =>
  occupants
    .filter((occupant) => occupant.id !== excludedGuestId)
    .reduce((total, occupant) => total + Math.max(0, Number(occupant.confirmed || 0)), 0);

export const canAssignGuest = (
  capacity: number,
  occupants: Occupant[],
  guestId: string,
  guestSize: number
) => occupiedSeats(occupants, guestId) + Math.max(0, guestSize) <= capacity;
