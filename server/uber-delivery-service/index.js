import express from "express";
import dotenv from "dotenv";
import uberDeliveryRouter from "./routes/uberDelivery.js";

dotenv.config();
const app = express();

// 🌍 CORS liberado
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// 📦 Rota de criação de entrega Uber
app.use("/api/uber-delivery", uberDeliveryRouter);

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`📦 Uber Delivery Service rodando na porta ${PORT}`);
});