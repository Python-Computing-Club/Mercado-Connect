export async function trackDelivery(deliveryId) {
  const token = process.env.REACT_APP_UBER_TOKEN;
  const customerId = process.env.REACT_APP_UBER_CUSTOMER_ID;
  const env = process.env.REACT_APP_UBER_ENV || "sandbox";

  const url = `https://${env}-api.uber.com/v1/customers/${customerId}/deliveries/${deliveryId}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (data.status) {
      return {
        status: data.status,
        courier: data.courier || null,
        eta: data.dropoff_eta || null,
        trackingUrl: data.tracking_url || null
      };
    } else {
      console.warn("Erro ao rastrear entrega Uber:", data);
      return null;
    }
  } catch (err) {
    console.error("Erro ao consultar entrega Uber:", err);
    return null;
  }
}