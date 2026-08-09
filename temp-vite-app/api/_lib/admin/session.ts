import { findSession, readSessionToken } from "../admin-auth.js";
import { findOrderByNumber, json } from "../orders.js";

async function handler(request: Request) {
  if (request.method !== "GET")
    return json({ error: "Método no permitido." }, 405);
  try {
    const session = await findSession(readSessionToken(request));
    if (!session) return json({ authenticated: false }, 401);
    const order = await findOrderByNumber(session.order_number);
    if (!order) return json({ authenticated: false }, 401);
    return json({
      authenticated: true,
      order: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        plan: order.plan,
        modelName: order.model_name,
        eventTitle: String(
          order.order_payload.eventTitle || order.customer_name,
        ),
        eventDate: String(order.order_payload.eventDate || ""),
        eventType: String(order.order_payload["Tipo de evento"] || "Evento"),
        defaultPhoneCountryCode: order.default_phone_country_code || "+598",
        language: order.language,
        accessRole: session.access_role,
        loginEmail: session.login_email,
        invitationUrl: order.invitation_url || "",
        giftDetails: String(
          order.order_payload.giftDetails ||
            order.order_payload["Regalos"] ||
            order.order_payload["Datos bancarios"] ||
            "",
        ),
      },
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error(error);
    return json({ authenticated: false }, 500);
  }
}

export default { fetch: handler };
