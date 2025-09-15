import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const mercadosRef = collection(db, "mercados");

export const criarMercado = async (dados) => {
  try {
    const q = query(mercadosRef, where("cnpj", "==", dados.cnpj));
    const resultado = await getDocs(q);
    if (!resultado.empty) throw new Error("CNPJ já cadastrado");
    await addDoc(mercadosRef, dados);
    return true;
  } catch (error) {
    console.error("Erro ao criar mercado", error);
    return false;
  }
};

export const listarMercados = async () => {
  try {
    const snapshot = await getDocs(mercadosRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao listar mercados", error);
    return [];
  }
};

export const atualizarMercado = async (id, dados) => {
  try {
    await updateDoc(doc(db, "mercados", id), dados);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar mercado", error);
    return false;
  }
};

export const deletarMercado = async (id) => {
  try {
    await deleteDoc(doc(db, "mercados", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar mercado", error);
    return false;
  }
};

export const buscarMercadoPorContato = async (valor, tipo = "email") => {
  try {
    const campo = tipo === "telefone" ? "telefone" : "email";
    const q = query(mercadosRef, where(campo, "==", valor));
    const resultado = await getDocs(q);
    if (resultado.empty) return null;
    const docSnap = resultado.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Erro ao buscar mercado:", error);
    return null;
  }
};

export const buscarMercadoPorId = async (id) => {
  try {
    const snap = await getDoc(doc(db, "mercados", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Erro ao buscar mercado por id:", error);
    return null;
  }
};
