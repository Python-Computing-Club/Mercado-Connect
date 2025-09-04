import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInWithGoogle } from "../services/firebase";
import { criarUsuario, buscarUsuario } from "../services/firestore/usuarios";

export default function useGoogleLogin(showAlert, setAcceptedTerms) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginComGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      const user = result.user;

      const nome = user.displayName || "Usuário";
      const email = user.email || "";
      const telefone = user.phoneNumber || "";

      const existente = await buscarUsuario(email, "email");

      if (existente) {
        showAlert("Bem-vindo de volta!", "Você já possui uma conta.");
        navigate("/home");
        return;
      }

      setAcceptedTerms(true);

      const novoUsuario = { nome, email, telefone };
      const resultado = await criarUsuario(novoUsuario);

      if (resultado?.sucesso) {
        showAlert("Cadastro realizado", "Conta criada com sucesso!");
        navigate("/home");
      } else {
        showAlert("Erro", "Não foi possível criar sua conta.");
      }
    } catch (error) {
      console.error("Erro no login com Google:", error);
      showAlert("Erro", "Falha ao autenticar com o Google.");
    } finally {
      setLoading(false);
    }
  };

  return { loginComGoogle, loading };
}