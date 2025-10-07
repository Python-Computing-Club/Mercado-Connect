export async function consultarEntregaUber(deliveryId) {
  const baseURL = process.env.REACT_APP_UBER_DELIVERY || "";

  try {
    const res = await fetch(`${baseURL}/api/uber-delivery/status/${deliveryId}`);
    const data = await res.json();
    return data.status || null;
  } catch (err) {
    console.error("❌ Erro ao consultar status da entrega Uber:", err);
    return null;
  }
}