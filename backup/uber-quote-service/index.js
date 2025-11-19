import express from "express";
import dotenv from "dotenv";
import uberQuoteRouter from "./routes/uberQuote.js";

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

// 🛣️ Rota de cotação Uber
app.use("/api/uber-quote", uberQuoteRouter);

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚚 Uber Quote Service rodando na porta ${PORT}`);
});