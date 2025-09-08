import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

export const autenticar = async (colecao, contato, tipo) => {
  if (!tipo) {
    throw new Error("O parâmetro 'tipo' (nome do campo) é obrigatório.");
  }

  try {
    const ref = collection(db, colecao);
    const q = query(ref, where(tipo, "==", contato));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } else {
      console.log("Resultado:", snapshot.empty, "Nenhum documento encontrado");
      return null;
    }
  } catch (error) {
    console.log(`Erro ao buscar ${colecao}:`, error);
    throw error;
  }
};
