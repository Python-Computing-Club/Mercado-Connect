export async function generateQuote(payload) {
  if (!payload || typeof payload !== "object") {
    console.warn("⚠️ Payload inválido ou ausente:", payload);
    return null;
  }

  const baseURL = process.env.REACT_APP_UBER_QUOTE || ""; // ← use variável específica para o serviço

  if (!baseURL) {
    console.error("❌ REACT_APP_UBER_QUOTE não definida no .env.local");
    return null;
  }

  try {
    const res = await fetch(`${baseURL}/api/uber-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("📬 Resposta da Uber Quote Service:", data);

    if (res.ok && data.id && data.fee) {
      return {
        quoteId: data.id,
        fee: data.fee,
        eta: data.dropoff_eta,
        storeId: data.external_store_id
      };
    } else {
      console.warn("⚠️ Cotação Uber inválida ou incompleta:", data);
      return null;
    }
  } catch (err) {
    console.error("❌ Erro ao gerar cotação Uber:", err);
    return null;
  }
}