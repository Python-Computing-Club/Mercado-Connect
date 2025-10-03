import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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

app.use("/api/cloudinary", cloudinaryDeleteRouter);

app.get("/", (req, res) => {
  res.send("✅ Backend rodando e CORS habilitado!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
