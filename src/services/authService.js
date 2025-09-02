import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

const usuariosRef = collection(db, "usuario");

export const buscarUsuario = async (contato, tipo) => {
  try {
    const campo = tipo === "email" ? "email" : "telefone";
    const q = query(usuariosRef, where(campo, "==", contato));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.log("Erro ao buscar usuário:", error);
    throw error;
  }
};
