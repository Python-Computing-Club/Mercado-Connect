import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import uberDeliveryRouter from "./routes/uberDelivery.js";

dotenv.config();
const app = express();

// ✅ Libera CORS corretamente para o frontend no Vercel
app.use(cors({
  origin: "https://mercado-connect.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Middleware para JSON
app.use(express.json());

// 📦 Rota de criação de entrega Uber
app.use("/api/uber-delivery", uberDeliveryRouter);

// ✅ Rota raiz para verificação de saúde (Render)
app.get("/", (req, res) => {
  res.send("✅ Uber Delivery Service está online!");
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`📦 Uber Delivery Service rodando na porta ${PORT}`);
});