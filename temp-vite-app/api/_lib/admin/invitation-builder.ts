import { findSession, readSessionToken } from '../admin-auth.js';
import { appUrl, findOrderByNumber, json, supabaseRequest, updateOrder } from '../orders.js';
import { logAdminActivity } from './audit.js';

type WorkflowStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published';
type DocumentRow = {
  id: string; event_id: string; template_id: string; schema_version: number; palette_id: string;
  locale: 'es' | 'en' | 'pt'; workflow_status: WorkflowStatus; sections: unknown[];
  content: Record<string, unknown>; updated_at: string;
};

const select = 'id,event_id,template_id,schema_version,palette_id,locale,workflow_status,sections,content,updated_at';
const supportedTemplates = new Set(['aurora', 'astraea', 'coruscant', 'rosewood', 'rivendell', 'verona', 'varezzia']);
const templateAliases: Record<string, string> = { '15-verona': 'verona' };
const requestedTemplateFor = (order: Awaited<ReturnType<typeof findOrderByNumber>>) => {
  const raw = String(order?.order_payload.modelId || order?.model_name || '').trim().toLowerCase();
  const normalized = templateAliases[raw] || raw;
  return {
    requestedModel: String(order?.model_name || order?.order_payload.modelName || raw || 'Modelo sin definir'),
    suggestedTemplateId: supportedTemplates.has(normalized) ? normalized : null
  };
};
const validSections = new Set(['hero', 'dateStack', 'countdown', 'location', 'quote', 'dressCode', 'schedule', 'parallax', 'gallery', 'hotels', 'gifts', 'photoUpload', 'social', 'songSuggestions', 'qrPass', 'rsvp']);

const ensureEvent = async (orderNumber: string) => {
  const existing = await supabaseRequest(`events?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,owner_account_id&limit=1`);
  const found = ((await existing.json()) as Array<{ id: string; owner_account_id: string }>)[0];
  if (found) return found;
  const order = await findOrderByNumber(orderNumber);
  if (!order) return null;
  const accountId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  await supabaseRequest('accounts', { method: 'POST', body: JSON.stringify({
    id: accountId, name: order.customer_name, account_roles: ['host'], can_self_approve: false, requires_platform_review: true
  }) });
  await supabaseRequest('account_members', { method: 'POST', body: JSON.stringify({
    account_id: accountId, email: order.customer_email.toLowerCase(), role: 'owner'
  }) });
  const legacyModules = ['invitation', 'guests_rsvp', 'tables', 'check_in', 'messaging', 'collaborative_album', 'suppliers'];
  await supabaseRequest('account_modules', { method: 'POST', body: JSON.stringify(
    legacyModules.map((module) => ({ account_id: accountId, module, source: 'manual', enabled: true }))
  ) });
  await supabaseRequest('events', { method: 'POST', body: JSON.stringify({
    id: eventId, order_number: orderNumber, owner_account_id: accountId,
    name: String(order.order_payload.eventTitle || order.customer_name), event_date: order.order_payload.eventDate || null
  }) });
  await supabaseRequest('event_account_access', { method: 'POST', body: JSON.stringify({ event_id: eventId, account_id: accountId, access_role: 'owner' }) });
  return { id: eventId, owner_account_id: accountId };
};

const getDocument = async (eventId: string) => {
  const response = await supabaseRequest(`invitation_documents?event_id=eq.${encodeURIComponent(eventId)}&select=${select}&limit=1`);
  return ((await response.json()) as DocumentRow[])[0] || null;
};

async function handler(request: Request) {
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ error: 'Sesión vencida.' }, 401);
    const event = await ensureEvent(session.order_number);
    if (!event) return json({ error: 'No encontramos el evento.' }, 404);

    if (request.method === 'GET') {
      const order = await findOrderByNumber(session.order_number);
      const requestedTemplate = requestedTemplateFor(order);
      const accountResponse = await supabaseRequest(`accounts?id=eq.${event.owner_account_id}&select=can_self_approve,requires_platform_review&limit=1`);
      const account = ((await accountResponse.json()) as Array<{ can_self_approve: boolean; requires_platform_review: boolean }>)[0];
      const document = await getDocument(event.id);
      let reviewHistory: Array<Record<string, unknown>> = [];
      if (document) {
        const historyResponse = await supabaseRequest(`invitation_review_events?invitation_id=eq.${document.id}&select=id,action,comment,actor_type,created_at&order=created_at.desc&limit=50`);
        reviewHistory = await historyResponse.json() as Array<Record<string, unknown>>;
      }
      return json({
        document,
        ...requestedTemplate,
        reviewHistory,
        accessRole: session.access_role,
        workflow: {
          canEdit: session.access_role !== 'viewer',
          canApprove: ['owner', 'admin'].includes(session.access_role) && account?.can_self_approve === true,
          canPublish: ['owner', 'admin'].includes(session.access_role) && account?.can_self_approve === true && account?.requires_platform_review === false,
          requiresPlatformReview: account?.requires_platform_review !== false
        }
      });
    }
    if (session.access_role === 'viewer') return json({ error: 'Tu acceso es de sólo lectura.' }, 403);

    if (request.method === 'PUT') {
      const body = await request.json() as Record<string, unknown>;
      const templateId = String(body.templateId || '');
      const locale = String(body.locale || '');
      const sections = Array.isArray(body.sections) ? body.sections as Array<Record<string, unknown>> : [];
      if (!supportedTemplates.has(templateId) || !['es', 'en', 'pt'].includes(locale)) return json({ error: 'El modelo o idioma no es válido.' }, 400);
      if (!sections.length || sections.some((section) => !validSections.has(String(section.id)) || typeof section.enabled !== 'boolean')) return json({ error: 'La configuración de secciones no es válida.' }, 400);
      const current = await getDocument(event.id);
      if (current && !['draft', 'changes_requested'].includes(current.workflow_status)) {
        return json({ error: 'La invitación no se puede editar mientras está en revisión, aprobada o publicada.' }, 409);
      }
      const changes = {
        template_id: templateId, schema_version: 1,
        palette_id: String(body.paletteId || '').slice(0, 80), locale,
        sections,
        content: typeof body.content === 'object' && body.content ? body.content : {},
        workflow_status: 'draft',
        updated_at: new Date().toISOString()
      };
      let document: DocumentRow;
      if (current) {
        const response = await supabaseRequest(`invitation_documents?id=eq.${current.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(changes) });
        document = ((await response.json()) as DocumentRow[])[0];
      } else {
        const response = await supabaseRequest('invitation_documents', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ event_id: event.id, ...changes }) });
        document = ((await response.json()) as DocumentRow[])[0];
      }
      const revisions = await supabaseRequest(`invitation_revisions?invitation_id=eq.${document.id}&select=revision&order=revision.desc&limit=1`);
      const latest = ((await revisions.json()) as Array<{ revision: number }>)[0]?.revision || 0;
      await supabaseRequest('invitation_revisions', { method: 'POST', body: JSON.stringify({ invitation_id: document.id, revision: latest + 1, document: body, created_by_account_id: event.owner_account_id }) });
      await logAdminActivity(session, 'invitation.draft_saved', 'invitation', document.id, {});
      return json({ document });
    }

    if (request.method === 'PATCH') {
      const current = await getDocument(event.id);
      if (!current) return json({ error: 'Guardá el borrador antes de cambiar su estado.' }, 409);
      const body = await request.json() as { action?: string; comment?: string };
      const comment = String(body.comment || '').trim().slice(0, 2000);
      if (body.action === 'request-changes' && !comment) return json({ error: 'Escribí qué cambios necesita la invitación.' }, 400);
      const accountResponse = await supabaseRequest(`accounts?id=eq.${event.owner_account_id}&select=can_self_approve,requires_platform_review&limit=1`);
      const account = ((await accountResponse.json()) as Array<{ can_self_approve: boolean; requires_platform_review: boolean }>)[0];
      let status: WorkflowStatus | null = null;
      if (body.action === 'submit' && ['draft', 'changes_requested'].includes(current.workflow_status)) status = 'in_review';
      if (body.action === 'request-changes' && ['owner', 'admin'].includes(session.access_role) && current.workflow_status === 'in_review') status = 'changes_requested';
      if (body.action === 'approve' && ['owner', 'admin'].includes(session.access_role) && account?.can_self_approve && current.workflow_status === 'in_review') status = 'approved';
      if (body.action === 'publish' && ['owner', 'admin'].includes(session.access_role) && current.workflow_status === 'approved' && account?.can_self_approve && !account.requires_platform_review) status = 'published';
      if (!status) return json({ error: 'La transición solicitada no está permitida.' }, 409);
      const timestamps = status === 'in_review' ? { submitted_at: new Date().toISOString() } : status === 'approved' ? { approved_at: new Date().toISOString() } : status === 'published' ? { published_at: new Date().toISOString() } : {};
      const response = await supabaseRequest(`invitation_documents?id=eq.${current.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ workflow_status: status, ...timestamps, updated_at: new Date().toISOString() }) });
      await supabaseRequest('invitation_review_events', { method: 'POST', body: JSON.stringify({
        invitation_id: current.id,
        action: status === 'in_review' ? 'submitted' : status,
        comment: comment || null,
        actor_type: 'account',
        created_by_account_id: event.owner_account_id
      }) });
      if (status === 'published') {
        await updateOrder(session.order_number, {
          status: 'published',
          invitation_url: `${appUrl()}/i/${encodeURIComponent(session.order_number)}`,
          delivered_at: new Date().toISOString()
        });
      }
      await logAdminActivity(session, `invitation.${status}`, 'invitation', current.id, {});
      return json({ document: ((await response.json()) as DocumentRow[])[0] });
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos guardar la invitación.' }, 500);
  }
}

export default { fetch: handler };
