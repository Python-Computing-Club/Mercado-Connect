import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const mercadosRef = collection(db, "mercados");

//criar um mercado
export const criarMercado = async (dados) => {
  try{
    await addDoc(mercadosRef, dados);
    return true;
  } catch(error){
    console.log("Erro ao criar o mercado", error);
    return false;
  }
};

// Listar todos os mercados
export const listarMercados = async () => {
  const snapshot = await getDocs(mercadosRef);
  try{
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
  } catch (error){
    console.log("Erro ao listar os mercados", error);
  }
};

// Atualizar mercado
export const atualizarMercado = async (id, dados) => {
  try{
    await updateDoc(doc(db, "mercados", id), dados);
    return true;
  } catch(error){
    console.log("Erro ao atualizar informações", error);
    return false;
  }
};

// Deletar mercado
export const deletarMercado = async (id) => {
  try{
    await deleteDoc(doc(db, "mercados", id));
    return true;
  } catch(error){
    console.log("Erro ao deletar mercado", error);
    return false;
  }
};