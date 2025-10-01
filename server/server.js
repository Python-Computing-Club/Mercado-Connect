import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import cloudinaryDeleteRouter from "./cloudinaryDelete.js";
import axios from "axios";

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

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/cloudinary", cloudinaryDeleteRouter);

app.get("/", (req, res) => {
  res.send("✅ Backend rodando e CORS habilitado!");
});

// 🚚 Rota Uber Direct API - modo Sandbox
app.post("/api/uber/iniciar-entrega", async (req, res) => {
  const { pedido, endereco, usuario } = req.body;

  try {
    // 1. Gerar token OAuth
    const tokenRes = await axios.post("https://auth.uber.com/oauth/v2/token", null, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      params: {
        client_id: process.env.UBER_CLIENT_ID,
        client_secret: process.env.UBER_CLIENT_SECRET,
        grant_type: "client_credentials",
        scope: "eats.orders eats.deliveries",
      },
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Criar entrega simulada
    const entrega = {
      pickup: {
        address: "Rua do Mercado, 123, São Paulo, SP",
        contact: { name: "Mercado Central", phone: "+5511999999999" },
      },
      dropoff: {
        address: `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}`,
        contact: { name: usuario.nome, phone: usuario.telefone },
      },
      order_id: pedido.id,
      items: pedido.itens.map(item => ({
        name: item.nome,
        quantity: item.quantidade,
      })),
      dropoff_verification: { type: "pin" },
    };

    const entregaRes = await axios.post(
      `https://sandbox-api.uber.com/v1/customers/${process.env.UBER_CUSTOMER_ID}/deliveries`,
      entrega,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json(entregaRes.data);
  } catch (error) {
    console.error("Erro na entrega Uber:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao iniciar entrega Uber." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});