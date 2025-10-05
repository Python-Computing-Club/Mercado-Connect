import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: "public_id é obrigatório" });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    console.log("Resultado da exclusão:", result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao excluir imagem:", error);
    res.status(500).json({ error: "Falha ao excluir imagem" });
  }
}