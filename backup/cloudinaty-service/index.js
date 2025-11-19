import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cloudinaryDeleteRouter from "./routes/cloudinaryDelete.js";

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

// ☁️ Configuração Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🧹 Rota de exclusão de imagem
app.use("/api/cloudinary", cloudinaryDeleteRouter);

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`☁️ Cloudinary Service rodando na porta ${PORT}`);
});