import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

export const autenticar = async (colecao, contato, tipo) => {
  try {
    const ref = collection(db, colecao);
    const q = query(ref, where(tipo, "==", contato));
    const snapshot = await getDocs(q);
    if(snapshot.empty){
      console.log("Resultado:", snapshot.empty ? "Nenhum documento encontrado" : snapshot.docs[0].data());
      return null;
    }else{
      return snapshot.docs[0].data();
    }
  } catch (error) {
    console.log(`Erro ao buscar ${colecao}:`, error);
    throw error;
  }
};
