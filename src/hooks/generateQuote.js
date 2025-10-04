export async function generateQuote(payload) {
  try {
    const res = await fetch("https://mercado-connect-server.onrender.com/api/uber-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "include"
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