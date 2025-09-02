import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase"; // certifique-se de ajustar o caminho do seu firebase.js

const usuariosRef = collection(db, "usuario");

//Campos de usuário:
//- nome
//- email
//- telefone

//criar um usuário
export const criarUsuario = async (dados) => {
    try {
        // Verificar se já existe usuário com mesmo email ou telefone
        const filtros = [];

        if (dados.email) {
            filtros.push(where("email", "==", dados.email));
        }

        if (dados.telefone) {
            filtros.push(where("telefone", "==", dados.telefone));
        }

        let q;

        // Se houver mais de um filtro (email e telefone), usar múltiplos wheres
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

//Listar usuários
export const listarUsuarios = async () => {
    const snapshot = await getDocs(usuariosRef);
    try {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.log("Erro ao listar usuários", error);
    }
};

//Atualizar usuário
export const atualizarUsuario = async (id, dados) => {
    try {
        await updateDoc(doc(db, "usuario", id), dados);
        return true;
    } catch (error) {
        console.log("Erro ao atualizar informações", error);
        return false;
    }
};

//deletar usuario
export const deletarUsuario = async (id) => {
    try {
        await deleteDoc(doc(db, "usuario", id));
        return true;
    } catch (error) {
        console.log("Erro ao deletar usuário", error);
        return false;
    }
};
