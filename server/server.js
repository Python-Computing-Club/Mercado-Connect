import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import { v2 as cloudinary } from "cloudinary";
import cloudinaryDeleteRouter from "./cloudinaryDelete.js";

dotenv.config({ path: ".env" });

console.log("Cloudinary env:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "✔️ carregada" : "❌ vazia",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✔️ carregada" : "❌ vazia",
});

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors()); 


app.use(express.json());

// 🌩️ Cloudinary delete
app.use("/api/cloudinary", cloudinaryDeleteRouter);

// 🔍 Rota raiz
app.get("/", (req, res) => {
  res.send("✅ Backend rodando e CORS habilitado!");
});

// 💰 Cotação Uber
app.post("/api/uber-quote", async (req, res) => {
  const payload = req.body;
  const customerId = process.env.UBER_CUSTOMER_ID;
  const token = process.env.UBER_TOKEN;
  const env = process.env.UBER_ENV || "sandbox";

  const url = `https://${env}-api.uber.com/v1/customers/${customerId}/delivery_quotes`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na cotação Uber:", data);
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro ao cotar com Uber:", err);
    res.status(500).json({ error: "Falha na cotação Uber" });
  }
});

// 📦 Criar entrega Uber
app.post("/api/uber-delivery", async (req, res) => {
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na criação da entrega Uber:", data);
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro ao criar entrega Uber:", err);
    res.status(500).json({ error: "Falha na criação de entrega Uber" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
