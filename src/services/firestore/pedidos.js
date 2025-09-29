import {collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc} from "firebase/firestore";
import {db} from "../firebase";

const pedidosRef = collection(db, "pedidos");

//Pedido - Dados:
// - id_pedido
// - id_usuario
// - id_mercado
// - data_pedido
// - status
// - cupom
// - valor_total
// - avaliacao

export const criarPedido = async(dados) => {
    try{
        await addDoc(pedidosRef, dados);
        return true;
    }catch (error){
        console.error("Erro ao criar pedido", error);
        return false;
    }
};


export const listarPedidos = async () => {
    try{
        const snapshot = await getDocs(pedidosRef);
        return snapshot.docs.map((d) => ({id: d.id, ...d.data()}));
    } catch(error){
        console.error("Erro ao listar pedidos", error);
        return [];
    }
};

export const atualizarPedido = async (id, dados) => {
    try{
        await updateDoc(doc(db, "pedidos", id), dados);
        return true;
    } catch(error){
        console.error("Erro ao atualizar pedido", error);
        return false;
    }
};

export const excluirPedido = async (id) => {
    try{
        await deleteDoc(doc(db, "pedidos", id));
        return true;
    } catch(error){
        console.error("Erro ao deletar pedido", error);
        return false;
    }
};

