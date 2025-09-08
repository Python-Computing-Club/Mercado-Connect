import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";

const usuariosRef = collection(db, "usuario");

export const criarUsuario = async (dados) => {
  try {
    const filtros = [];

    if (dados.email) filtros.push(where("email", "==", dados.email));
    if (dados.telefone) filtros.push(where("telefone", "==", dados.telefone));
    if (dados.cpf) filtros.push(where("cpf", "==", dados.cpf));

    let q;
    if (filtros.length > 1) {
      q = query(usuariosRef, ...filtros);
    } else if (filtros.length === 1) {
      q = query(usuariosRef, filtros[0]);
    }

    if (q) {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.log("Usuário já existe com este email, telefone ou CPF.");
        return { sucesso: false, motivo: "duplicado" };
      }
    }

    const docRef = await addDoc(usuariosRef, dados);
    return { sucesso: true, id: docRef.id };
  } catch (error) {
    console.log("Erro ao criar usuário", error);
    return { sucesso: false, motivo: "erro" };
  }
};

export const listarUsuarios = async () => {
  try {
    const snapshot = await getDocs(usuariosRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.log("Erro ao listar usuários", error);
    return [];
  }
};

export const atualizarUsuario = async (id, dados) => {
  try {
    const ref = doc(db, "usuario", id);
    const snapshot = await getDoc(ref);
    const atual = snapshot.data();

    if (atual?.cpf?.length > 0) {
      delete dados.cpf; 
    }

    await updateDoc(ref, dados);
    return true;
  } catch (error) {
    console.log("Erro ao atualizar informações", error);
    return false;
  }
};

export const deletarUsuario = async (id) => {
  try {
    await deleteDoc(doc(db, "usuario", id));
    return true;
  } catch (error) {
    console.log("Erro ao deletar usuário", error);
    return false;
  }
};

export const buscarUsuario = async (valor, tipo) => {
  try {
    let filtro;

    if (tipo === "email") {
      filtro = where("email", "==", valor);
    } else if (tipo === "telefone") {
      filtro = where("telefone", "==", valor);
    } else if (tipo === "cpf") {
      filtro = where("cpf", "==", valor);
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