import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";

const usuariosRef = collection(db, "usuario");

// Criar um usuário com verificação de duplicidade
export const criarUsuario = async (dados) => {
  try {
    const filtros = [];

    if (dados.email) filtros.push(where("email", "==", dados.email));
    if (dados.telefone) filtros.push(where("telefone", "==", dados.telefone));

    let q;
    if (filtros.length > 1) {
      q = query(usuariosRef, ...filtros);
    } else if (filtros.length === 1) {
      q = query(usuariosRef, filtros[0]);
    }

    if (q) {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.log("Usuário já existe com este email ou telefone.");
        return { sucesso: false, motivo: "duplicado" };
      }
    }

    await addDoc(usuariosRef, dados);
    return { sucesso: true };
  } catch (error) {
    console.log("Erro ao criar usuário", error);
    return { sucesso: false, motivo: "erro" };
  }
};

// Listar todos os usuários
export const listarUsuarios = async () => {
  try {
    const snapshot = await getDocs(usuariosRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.log("Erro ao listar usuários", error);
    return [];
  }
};

// Atualizar dados de um usuário
export const atualizarUsuario = async (id, dados) => {
  try {
    await updateDoc(doc(db, "usuario", id), dados);
    return true;
  } catch (error) {
    console.log("Erro ao atualizar informações", error);
    return false;
  }
};

// Deletar um usuário
export const deletarUsuario = async (id) => {
  try {
    await deleteDoc(doc(db, "usuario", id));
    return true;
  } catch (error) {
    console.log("Erro ao deletar usuário", error);
    return false;
  }
};

// Buscar usuário por email ou telefone
export const buscarUsuario = async (valor, tipo) => {
  try {
    let filtro;

    if (tipo === "email") {
      filtro = where("email", "==", valor);
    } else if (tipo === "telefone") {
      filtro = where("telefone", "==", valor);
    } else {
      return null;
    }

    const q = query(usuariosRef, filtro);
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docEncontrado = snapshot.docs[0];
      return { id: docEncontrado.id, ...docEncontrado.data() };
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
};