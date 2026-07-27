import { supabaseRequest } from './orders.js';

export const deleteEventData = async (
  orderNumber: string,
  eventDate: string,
  reason: 'owner_request' | 'retention_expired'
) => {
  await supabaseRequest('event_deletion_receipts', {
    method: 'POST',
    body: JSON.stringify({
      order_number: orderNumber,
      reason,
      event_date: /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : null
    })
  });
  await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
    method: 'DELETE'
  });
};

