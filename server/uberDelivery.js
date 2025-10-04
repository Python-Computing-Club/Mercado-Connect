import express from "express";
import fetch from "node-fetch";

const router = express.Router();

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

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro ao criar entrega Uber:", err);
    res.status(500).json({ error: "Falha na criação da entrega Uber" });
  }
});

export default router;