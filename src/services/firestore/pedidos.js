import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const pedidosRef = collection(db, "pedidos");

export const criarPedido = async (dados) => {
  try {
    const pedidoComStatus = {
      ...dados,
      status: dados.status || "Aguardando confirmação da loja",
      data_pedido: dados.data_pedido || new Date().toLocaleString("pt-BR"),
    };

    const docRef = await addDoc(pedidosRef, pedidoComStatus);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar pedido", error);
    throw error;
  }
};

export const listarPedidos = async () => {
  try {
    const snapshot = await getDocs(pedidosRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao listar pedidos", error);
    return [];
  }
};

export const atualizarPedido = async (id, dados) => {
  try {
    await updateDoc(doc(db, "pedidos", id), dados);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar pedido", error);
    return false;
  }
};

export const excluirPedido = async (id) => {
  try {
    await deleteDoc(doc(db, "pedidos", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar pedido", error);
    return false;
  }
};
