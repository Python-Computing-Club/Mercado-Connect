import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import { v2 as cloudinary } from "cloudinary";
import cloudinaryDeleteRouter from "./cloudinaryDelete.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env" });

console.log("Cloudinary env:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "✔️ carregada" : "❌ vazia",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✔️ carregada" : "❌ vazia",
});

const app = express();

// 🧠 JSON parser antes das rotas
app.use(express.json());

// 🌍 Configuração de CORS (permitindo Vercel e localhost)
const allowedOrigins = [
  "http://localhost:3000",
  "https://mercado-connect.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("🚫 Bloqueado por CORS:", origin);
        callback(new Error("CORS não permitido para essa origem: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Preflight universal (Express 4 e 5)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ☁️ Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// 🚀 Servir React build (caso queira hospedar tudo no Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

// 🟢 Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
