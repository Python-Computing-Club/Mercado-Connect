import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });

console.log("✅ .env carregado de:", envPath);
console.log("🌩️  Config Cloudinary:", {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "****" : "⚠️ NÃO DEFINIDO",
});

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.send("Servidor rodando!");
});

app.post("/api/cloudinary/delete", async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: "public_id é obrigatório" });

    console.log("📸 public_id recebido:", public_id);

    const result = await cloudinary.uploader.destroy(public_id);
    res.json(result);
  } catch (error) {
    console.error("❌ Erro ao excluir imagem:", error);
    res.status(500).json({ error: "Falha ao excluir imagem" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
