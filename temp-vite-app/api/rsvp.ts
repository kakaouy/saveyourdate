import { findOrderByNumber, json, supabaseRequest } from './_lib/orders.js';
import { eventAccessExpired } from './_lib/event-lifecycle.js';

type GuestRow = {
  id: string;
  order_number: string;
  name: string;
  group_name: string;
  seats: number;
  confirmed: number;
  status: 'Confirmado' | 'Pendiente' | 'No asiste';
  food: string;
  song: string;
  identification_type: string;
  identification_number: string;
  companions: Array<{ name: string; food: string; identificationType: string; identificationNumber: string }>;
  transport_option: string;
  transport_stop: string;
  menu_choice: string;
  accessibility_needs: string;
  guest_notes: string;
};

const findGuest = async (token: string) => {
  const response = await supabaseRequest(
    `event_guests?invite_token=eq.${encodeURIComponent(token)}&archived_at=is.null&select=id,order_number,name,group_name,seats,confirmed,status,food,song,identification_type,identification_number,companions,transport_option,transport_stop,menu_choice,accessibility_needs,guest_notes&limit=1`
  );
  const rows = await response.json() as GuestRow[];
  return rows[0] || null;
};

const findPublishedInvitation = async (orderNumber: string) => {
  const eventResponse = await supabaseRequest(
    `events?order_number=eq.${encodeURIComponent(orderNumber)}&select=id&limit=1`
  );
  const event = ((await eventResponse.json()) as Array<{ id: string }>)[0];
  if (!event) return null;
  const documentResponse = await supabaseRequest(
    `invitation_documents?event_id=eq.${event.id}&workflow_status=eq.published&select=template_id,schema_version,palette_id,locale,workflow_status,sections,content,updated_at&limit=1`
  );
  return ((await documentResponse.json()) as unknown[])[0] || null;
};

async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const orderNumber = String(url.searchParams.get('order') || '').trim().toUpperCase();
    if (orderNumber) {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      if (!/^SYD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(orderNumber)) {
        return json({ error: 'Invitación inválida.' }, 400);
      }
      const document = await findPublishedInvitation(orderNumber);
      if (!document) return json({ error: 'Invitación no encontrada o todavía no publicada.' }, 404);
      return json({ document });
    }
    const token = url.searchParams.get('token') || '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
      return json({ error: 'El enlace no es válido.' }, 400);
    }
    const guest = await findGuest(token);
    if (!guest) return json({ error: 'El enlace no existe o fue desactivado.' }, 404);
    const order = await findOrderByNumber(guest.order_number);
    if (!order) return json({ error: 'No encontramos el evento.' }, 404);
    if (eventAccessExpired(order.order_payload)) {
      return json({ error: 'Este evento ya no se encuentra disponible.' }, 410);
    }

    if (request.method === 'GET') {
      const openedAt = new Date().toISOString();
      await supabaseRequest(
        `event_guests?id=eq.${encodeURIComponent(guest.id)}&invitation_opened_at=is.null`,
        { method: 'PATCH', body: JSON.stringify({ invitation_opened_at: openedAt, updated_at: openedAt }) }
      );
      return json({
        event: {
          title: String(order.order_payload.eventTitle || order.customer_name),
          date: String(order.order_payload.eventDate || '')
        },
        guest: {
          name: guest.name,
          group: guest.group_name,
          seats: guest.seats,
          confirmed: guest.confirmed,
          status: guest.status,
          food: guest.food,
          song: guest.song,
          identificationType: guest.identification_type,
          identificationNumber: guest.identification_number,
          companions: Array.isArray(guest.companions) ? guest.companions : [],
          transportOption: guest.transport_option || '',
          transportStop: guest.transport_stop || '',
          menuChoice: guest.menu_choice || '',
          accessibilityNeeds: guest.accessibility_needs || '',
          guestNotes: guest.guest_notes || ''
        }
      });
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as Record<string, unknown>;
      const status = String(body.status || '');
      if (!['Confirmado', 'No asiste'].includes(status)) {
        return json({ error: 'Elegí si vas a asistir.' }, 400);
      }
      const confirmed = status === 'Confirmado'
        ? Math.max(1, Math.min(guest.seats, Number(body.confirmed) || 1))
        : 0;
      const companions = status === 'Confirmado' && Array.isArray(body.companions)
        ? body.companions.slice(0, Math.max(0, confirmed - 1)).map((item) => {
            const companion = item as Record<string, unknown>;
            return {
              name: String(companion.name || '').trim().slice(0, 120),
              food: String(companion.food || '').trim().slice(0, 250),
              identificationType: String(companion.identificationType || '').trim().slice(0, 30),
              identificationNumber: String(companion.identificationNumber || '').trim().slice(0, 80)
            };
          })
        : [];
      if (status === 'Confirmado' && companions.length !== Math.max(0, confirmed - 1)) {
        return json({ error: 'Completá los datos de todos los acompañantes.' }, 400);
      }
      if (companions.some((companion) => !companion.name)) {
        return json({ error: 'Ingresá el nombre de cada acompañante.' }, 400);
      }
      const respondedAt = new Date().toISOString();
      await supabaseRequest(`event_guests?id=eq.${encodeURIComponent(guest.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          confirmed,
          food: status === 'Confirmado' ? String(body.food || '').trim() || 'Ninguna' : 'Ninguna',
          song: status === 'Confirmado' ? String(body.song || '').trim() || '—' : '—',
          identification_type: status === 'Confirmado' ? String(body.identificationType || '').trim() : '',
          identification_number: status === 'Confirmado' ? String(body.identificationNumber || '').trim() : '',
          companions,
          transport_option: status === 'Confirmado' ? String(body.transportOption || '').trim().slice(0, 80) : '',
          transport_stop: status === 'Confirmado' && body.transportOption ? String(body.transportStop || '').trim().slice(0, 160) : '',
          menu_choice: status === 'Confirmado' ? String(body.menuChoice || '').trim().slice(0, 120) : '',
          accessibility_needs: status === 'Confirmado' ? String(body.accessibilityNeeds || '').trim().slice(0, 500) : '',
          guest_notes: status === 'Confirmado' ? String(body.guestNotes || '').trim().slice(0, 1000) : '',
          ...(status !== 'Confirmado' ? { table_id: null, seat_number: null } : {}),
          responded_at: respondedAt,
          updated_at: respondedAt
        })
      });
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'No pudimos procesar la confirmación.' }, 500);
  }
}

export default { fetch: handler };
