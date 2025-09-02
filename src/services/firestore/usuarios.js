import {collection, addDoc, getDocs, updateDoc, deleteDoc, doc} from "firebase/firestore";

const usuariosRef = collection(db, "usuario");

//Campos de usuário:
//- nome
//- email
//- telefone

//criar um usuário
export const criarUsuario = async (dados) => {
    try{
        await addDoc(usuariosRef, dados);
        return true;
    } catch (error){
        console.log("Erro ao criar usuário", error);
        return false;
    }
};


//Listar usuários
export const listarUsuarios = async() => {
    const snapshot = await getDocs(usuariosRef);
    try{
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error){
        console.log("Erro ao listar usuários", error);
    }
};

//Atualizar usuário
export const atualizarUsuario = async(id, dados) => {
    try{
        await updateDoc(doc(db, "usuario", id), dados);
        return true;
    } catch (error){
        console.log("Erro ao atualizar informações", error);
        return false;
    }
};

//deletar usuario
export const deletarUsuario = async(id) => {
    try{
        await deleteDoc(doc(doc, "usuario", id));
        return true;
    } catch (error){
        console.log("Erro ao deletar usuário", error);
        return false;
    }
};