export async function consultarEntregaUber(deliveryId) {
  const baseURL = process.env.REACT_APP_UBER_DELIVERY || "";

  try {
    const res = await fetch(`${baseURL}/api/uber-delivery/status/${deliveryId}`);
    const data = await res.json();

    const statusUber = data.status || null;

    const statusPermitidos = ["accepted", "en_route_to_pickup", "delivered"];

    if (!statusPermitidos.includes(statusUber)) {
      console.log("🔒 Status da Uber ignorado:", statusUber);
      return null;
    }

    return statusUber;
  } catch (err) {
    console.error("❌ Erro ao consultar status da entrega Uber:", err);
    return null;
  }
}