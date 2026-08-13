export const ACCOUNT_ROLES = ['host', 'organizer', 'venue', 'supplier', 'platform_admin'] as const;
export type AccountRole = typeof ACCOUNT_ROLES[number];

export const PRODUCT_MODULES = [
  'invitation',
  'guests_rsvp',
  'tables',
  'check_in',
  'messaging',
  'collaborative_album',
  'suppliers'
] as const;
export type ProductModule = typeof PRODUCT_MODULES[number];

export const EVENT_ACCESS_ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
export type EventAccessRole = typeof EVENT_ACCESS_ROLES[number];

export type InvitationWorkflowStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'published';

export interface AccountEntitlements {
  accountRoles: AccountRole[];
  enabledModules: ProductModule[];
  canManageMultipleEvents: boolean;
  canSelfApprove: boolean;
  requiresPlatformReview: boolean;
}

export interface EventMembership {
  accessRole: EventAccessRole;
  supplierModules?: ProductModule[];
}

export type EventAction =
  | 'view'
  | 'edit'
  | 'manage_collaborators'
  | 'submit_for_review'
  | 'approve'
  | 'publish';

const ROLE_ACTIONS: Record<EventAccessRole, readonly EventAction[]> = {
  owner: ['view', 'edit', 'manage_collaborators', 'submit_for_review', 'approve', 'publish'],
  admin: ['view', 'edit', 'manage_collaborators', 'submit_for_review', 'approve', 'publish'],
  editor: ['view', 'edit', 'submit_for_review'],
  viewer: ['view']
};

export const hasModuleAccess = (
  entitlements: AccountEntitlements,
  membership: EventMembership,
  module: ProductModule
) => {
  if (entitlements.accountRoles.includes('platform_admin')) return true;
  if (!entitlements.enabledModules.includes(module)) return false;
  if (!entitlements.accountRoles.includes('supplier')) return true;
  return membership.supplierModules?.includes(module) ?? false;
};

export const canPerformEventAction = (
  entitlements: AccountEntitlements,
  membership: EventMembership,
  action: EventAction
) => {
  if (entitlements.accountRoles.includes('platform_admin')) return true;
  if (!ROLE_ACTIONS[membership.accessRole].includes(action)) return false;
  if (action === 'approve') return entitlements.canSelfApprove;
  if (action === 'publish') {
    return entitlements.canSelfApprove && !entitlements.requiresPlatformReview;
  }
  return true;
};

export const nextInvitationStatuses = (
  current: InvitationWorkflowStatus,
  entitlements: AccountEntitlements,
  membership: EventMembership
): InvitationWorkflowStatus[] => {
  const canSubmit = canPerformEventAction(entitlements, membership, 'submit_for_review');
  const canApprove = canPerformEventAction(entitlements, membership, 'approve');
  const canPublish = canPerformEventAction(entitlements, membership, 'publish');

  switch (current) {
    case 'draft':
    case 'changes_requested':
      return canSubmit ? ['in_review'] : [];
    case 'in_review':
      return canApprove ? ['changes_requested', 'approved'] : [];
    case 'approved':
      return canPublish ? ['published'] : [];
    case 'published':
      return [];
  }
};
