import { supabaseRequest } from '../orders.js';

type AuditSession = {
  order_number: string;
  login_email: string;
  access_role: 'owner' | 'editor' | 'viewer';
};

export const logAdminActivity = async (
  session: AuditSession,
  action: string,
  entityType: string,
  entityId = '',
  details: Record<string, unknown> = {}
) => {
  try {
    await supabaseRequest('admin_activity_log', {
      method: 'POST',
      body: JSON.stringify({
        order_number: session.order_number,
        actor_email: session.login_email,
        actor_role: session.access_role,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details
      })
    });
  } catch (error) {
    console.error('No pudimos registrar la actividad administrativa.', error);
  }
};
