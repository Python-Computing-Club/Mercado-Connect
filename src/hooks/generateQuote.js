export async function generateQuote(payload) {
  const baseURL = process.env.REACT_APP_API_BASE || ""; // Define no .env.local para uso local

  try {
    const res = await fetch(`${baseURL}/api/uber-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("📬 Resposta da Uber:", data);

    if (data.id && data.fee) {
      return {
        quoteId: data.id,
        fee: data.fee,
        eta: data.dropoff_eta,
        storeId: data.external_store_id
      };
    } else {
      console.warn("⚠️ Cotação Uber inválida:", data);
      return null;
    }
  } catch (err) {
    console.error("❌ Falha ao gerar cotação Uber:", err);
    return null;
  }
}