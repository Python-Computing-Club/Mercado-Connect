import { createContext, useContext, useState, useEffect } from "react";
import { buscarUsuario } from "../services/firestore/usuarios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      const session = localStorage.getItem("userSession");
      if (session) {
        const usuarioLocal = JSON.parse(session);
        setUsuario(usuarioLocal);

        try {
          const dadosAtualizados = await buscarUsuario(usuarioLocal.email || usuarioLocal.contato, "email");
          if (dadosAtualizados) {
            const usuarioAtualizado = { ...dadosAtualizados };
            setUsuario(usuarioAtualizado);
            localStorage.setItem("userSession", JSON.stringify(usuarioAtualizado));
          }
        } catch (err) {
          console.error("Erro ao atualizar dados do usuário:", err);
        }
      }
      setLoading(false);
    }

    carregarUsuario();
  }, []);

  const login = async (dadosUsuario) => {
    try {
      const dadosFirestore = await buscarUsuario(dadosUsuario.email || dadosUsuario.contato, "email");

      if (!dadosFirestore) {
        console.warn("Usuário não encontrado no Firestore durante login.");
        return false;
      }

      const dadosCompletos = {
        ...dadosFirestore,
        ...dadosUsuario,
      };

      setUsuario(dadosCompletos);
      localStorage.setItem("userSession", JSON.stringify(dadosCompletos));
      return true;
    } catch (error) {
      console.error("Erro ao buscar usuário no login:", error);
      return false;
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("userSession");
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
