import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const categoriasRef = collection(db, "categorias");

export const listarCategoriasGlobais = async () => {
  try {
    const snapshot = await getDocs(categoriasRef);
    const categorias = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const unicas = [];
    const nomesVistos = new Set();

    for (const cat of categorias) {
      if (!nomesVistos.has(cat.nome)) {
        nomesVistos.add(cat.nome);
        unicas.push(cat);
      }
    }

    return unicas;
  } catch (error) {
    console.error("Erro ao listar categorias globais", error);
    return [];
  }
};
