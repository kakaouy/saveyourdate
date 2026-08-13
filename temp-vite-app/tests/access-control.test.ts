import assert from 'node:assert/strict';
import test from 'node:test';
import { canPerformEventAction, hasModuleAccess, nextInvitationStatuses } from '../src/domain/access-control.ts';

const organizer = {
  accountRoles: ['organizer'] as const,
  enabledModules: ['invitation', 'guests_rsvp'] as const,
  canManageMultipleEvents: true,
  canSelfApprove: true,
  requiresPlatformReview: false
};

test('un organizador administrador puede autoaprobar y publicar', () => {
  const membership = { accessRole: 'admin' as const };
  assert.equal(canPerformEventAction(organizer, membership, 'approve'), true);
  assert.deepEqual(nextInvitationStatuses('in_review', organizer, membership), ['changes_requested', 'approved']);
  assert.deepEqual(nextInvitationStatuses('approved', organizer, membership), ['published']);
});

test('la revisión de plataforma impide publicar aunque permita aprobar', () => {
  const restricted = { ...organizer, requiresPlatformReview: true };
  const membership = { accessRole: 'owner' as const };
  assert.equal(canPerformEventAction(restricted, membership, 'approve'), true);
  assert.equal(canPerformEventAction(restricted, membership, 'publish'), false);
});

test('un proveedor sólo accede a los módulos asignados en el evento', () => {
  const supplier = { ...organizer, accountRoles: ['supplier'] as const };
  const membership = { accessRole: 'viewer' as const, supplierModules: ['guests_rsvp'] as const };
  assert.equal(hasModuleAccess(supplier, membership, 'guests_rsvp'), true);
  assert.equal(hasModuleAccess(supplier, membership, 'invitation'), false);
});
