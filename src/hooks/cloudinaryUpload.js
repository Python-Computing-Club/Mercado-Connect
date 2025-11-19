export const uploadParaCloudinary = async (file) => {
  if (!file) return null;

  try {
    console.log("Iniciando upload da imagem:", file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_PRESET);

    console.log("FormData criado, upload_preset:", process.env.REACT_APP_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    console.log("Resposta do Cloudinary recebida:", res);

    const data = await res.json();
    console.log("Dados do Cloudinary:", data);

    if (!res.ok) throw new Error(data.error?.message || "Erro ao enviar imagem para Cloudinary");

    return { url: data.secure_url, public_id: data.public_id };
  } catch (error) {
    console.error("Erro no upload Cloudinary:", error);
    return null;
  }
};

export const excluirImagemCloudinary = async (publicId) => {
  const baseURL = process.env.REACT_APP_CLOUDINARY || "";

  try {
    console.log("Iniciando exclusão da imagem:", publicId);

    const res = await fetch(`${baseURL}/api/cloudinary-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId })
    });

    console.log("Resposta do servidor:", res);

    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

    const data = await res.json();
    console.log("Resultado da exclusão:", data);

    return data;
  } catch (error) {
    console.error("Erro ao excluir imagem Cloudinary:", error);
    return null;
  }
};