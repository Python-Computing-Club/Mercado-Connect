import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Criação de entrega Uber
router.post("/", async (req, res) => {
  const payload = req.body;

  const customerId = process.env.UBER_CUSTOMER_ID;
  const token = process.env.UBER_TOKEN;
  const env = process.env.UBER_ENV || "sandbox";

  const url = `https://${env}-api.uber.com/v1/customers/${customerId}/deliveries`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.id || !data.tracking_url) {
      console.warn("❌ Erro ao criar entrega Uber:", data);
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Erro ao criar entrega Uber:", err);
    res.status(500).json({ error: "Falha na criação da entrega Uber" });
  }
});

// Consulta de status da entrega Uber
router.get("/status/:deliveryId", async (req, res) => {
  const { deliveryId } = req.params;

  const customerId = process.env.UBER_CUSTOMER_ID;
  const token = process.env.UBER_TOKEN;
  const env = process.env.UBER_ENV || "sandbox";

  const url = `https://${env}-api.uber.com/v1/customers/${customerId}/deliveries/${deliveryId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.warn("❌ Erro ao consultar status da entrega Uber:", data);
      return res.status(response.status).json(data);
    }

    res.status(200).json({
      deliveryId,
      status: data.status
    });
  } catch (err) {
    console.error("❌ Erro ao consultar status da entrega Uber:", err);
    res.status(500).json({ error: "Falha ao consultar status da entrega Uber" });
  }
});

export default router;