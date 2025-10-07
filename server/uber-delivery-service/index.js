import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import uberDeliveryRouter from "./routes/uberDelivery.js";

dotenv.config();
const app = express();

// ✅ Libera CORS corretamente
app.use(cors({
  origin: "*", // ou "https://mercado-connect.vercel.app"
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());

// 📦 Rota de criação de entrega Uber
app.use("/api/uber-delivery", uberDeliveryRouter);

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`📦 Uber Delivery Service rodando na porta ${PORT}`);
});