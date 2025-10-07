import express from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

router.post("/delete", async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: "public_id é obrigatório" });

    const result = await cloudinary.uploader.destroy(public_id);
    console.log("Resultado da exclusão:", result);

    res.json(result);
  } catch (error) {
    console.error("Erro ao excluir imagem:", error);
    res.status(500).json({ error: "Falha ao excluir imagem" });
  }
});

export default router;
