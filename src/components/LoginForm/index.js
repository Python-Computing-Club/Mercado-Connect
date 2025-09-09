import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import { autenticar } from "../../services/authService";
import { buscarUsuario } from "../../services/firestore/usuarios";
import { useAuth } from "../../Context/AuthContext";
import useFacebookLogin from "../../hooks/useFacebookLogin";

function formatarTelefoneVisual(telefone) {
  const onlyNumbers = telefone.replace(/\D/g, "");
  if (onlyNumbers.length < 7) return telefone;

  if (onlyNumbers.length === 11) {
    return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 7)}-${onlyNumbers.slice(7)}`;
  }
  if (onlyNumbers.length === 10) {
    return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 6)}-${onlyNumbers.slice(6)}`;
  }
  return telefone;
}

function normalizarTelefone(telefoneFormatado) {
  const onlyNumbers = telefoneFormatado.replace(/\D/g, "");
  return onlyNumbers.startsWith("55") ? "+" + onlyNumbers : "+55" + onlyNumbers;
}

export default function useLoginFormLogic() {
  const [form, setForm] = useState({
    contato: "",
    tipoContato: "",
    codigo: "",
    codigoGerado: "",
    tipoLogin: "",
    entidadeId: "",
    entidadeDados: null,
  });

  const [step, setStep] = useState(1);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [tempoRestante, setTempoRestante] = useState(0);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  const navigate = useNavigate();
  const { enviarCodigo } = useEmailCodigo();
  const { sendVerificationCode } = useTextBeeSms();
  const { login } = useAuth();

  const { loginComFacebook } = useFacebookLogin(setModal, () => {}, () => {}, () => {}, "login"); // <- USO DO HOOK FB

  const showAlert = (title, message) => {
    setModal({ open: true, title, message });
  };

  useCodigoTimer({
    active: step === 2 && !!form.codigoGerado,
    duration: 300,
    onExpire: () => showAlert("Código expirado", "Reenvie o código para continuar."),
    setTime: setTempoRestante,
  });

  const bloquearBotoesTemporariamente = () => {
    setButtonsDisabled(true);
    setTimeout(() => setButtonsDisabled(false), 8000);
  };

  const handleChange = (e) => {
    let { value } = e.target;
    const isEmail = value.includes("@");

    if (isEmail) {
      setForm({ ...form, contato: value.trim().toLowerCase(), tipoContato: "email" });
    } else {
      const onlyNumbers = value.replace(/\D/g, "");
      if (onlyNumbers.length >= 7) {
        const formatted = formatarTelefoneVisual(onlyNumbers);
        setForm({ ...form, contato: formatted, tipoContato: "telefone" });
      } else {
        setForm({ ...form, contato: value, tipoContato: "" });
      }
    }
  };

  const buscarEntidade = async (contato, tipoContato) => {
    const telefoneNormalizado =
      tipoContato === "telefone" ? normalizarTelefone(contato) : contato.trim().toLowerCase();

    const usuarioEmail =
      tipoContato === "email" ? await autenticar("usuario", contato.trim().toLowerCase(), "email") : null;
    const usuarioTelefone =
      tipoContato === "telefone" ? await autenticar("usuario", telefoneNormalizado, "telefone") : null;

    const mercadoEmail =
      tipoContato === "email" ? await autenticar("mercados", contato.trim().toLowerCase(), "email") : null;
    const mercadoTelefone =
      tipoContato === "telefone" ? await autenticar("mercados", telefoneNormalizado, "telefone") : null;

    const usuario = usuarioEmail || usuarioTelefone;
    const mercado = mercadoEmail || mercadoTelefone;

    const entidade = usuario || mercado;
    const tipoLogin = mercado ? "mercado" : "usuario";

    return { entidade, tipoLogin };
  };

  const enviarCodigoHandler = async () => {
    if (!form.tipoContato) {
      return showAlert("Formato inválido", "Informe um e‑mail ou telefone válido.");
    }

    const contatoParaBusca =
      form.tipoContato === "telefone"
        ? normalizarTelefone(form.contato)
        : form.contato.trim().toLowerCase();

    const { entidade, tipoLogin } = await buscarEntidade(form.contato, form.tipoContato);

    if (!entidade) {
      return showAlert("Conta não encontrada", "Nenhum cadastro vinculado a este contato.");
    }

    let codigo = "";

    if (form.tipoContato === "email") {
      codigo = await enviarCodigo(form.contato.trim().toLowerCase(), "email", showAlert, showAlert);
      if (!codigo) return;
    } else {
      const result = await sendVerificationCode(contatoParaBusca);
      if (!result) {
        showAlert("Erro", "Falha ao enviar SMS.");
        return;
      }
      codigo = result;
    }

    showAlert("Código enviado", `Enviado para ${form.contato}`);
    setForm((prev) => ({
      ...prev,
      codigoGerado: codigo,
      codigo: "",
      tipoLogin,
      tipoContato: form.tipoContato,
      entidadeId: entidade.id,
      entidadeDados: entidade,
    }));
    setTempoRestante(300);
    setStep(2);
  };

  const validarCodigo = async () => {
    if (buttonsDisabled) return;
    bloquearBotoesTemporariamente();

    if (tempoRestante === 0) {
      return showAlert("Código expirado", "Reenvie o código para continuar.");
    }

    if (form.codigo === form.codigoGerado) {
      let contatoParaBusca = form.tipoContato === "telefone"
        ? normalizarTelefone(form.contato)
        : form.contato.trim().toLowerCase();

      let entidade = null;
      if (form.tipoLogin === "mercado") {
        entidade = await autenticar("mercados", contatoParaBusca, form.tipoContato);
      } else {
        entidade = await buscarUsuario(contatoParaBusca, form.tipoContato);
      }

      if (!entidade) {
        return showAlert("Erro", "Usuário não encontrado no banco.");
      }

      const sessionData = {
        nome: entidade.nome,
        email: entidade.email,
        telefone: entidade.telefone,
        id: entidade.id,
        loginTime: Date.now(),
        tipoLogin: form.tipoLogin,
        tipoContato: form.tipoContato,
      };

      const sucesso = await login(sessionData);
      if (sucesso !== false) {
        localStorage.setItem("tipoLogin", form.tipoLogin);
        localStorage.setItem("entidade", JSON.stringify(form.entidadeDados));
        navigate(form.tipoLogin === "mercado" ? "/painel-mercado" : "/home");
      } else {
        showAlert("Erro", "Falha ao realizar login.");
      }
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  const loginComGoogle = async (email, nome, telefone) => {
    if (buttonsDisabled) return;
    bloquearBotoesTemporariamente();

    try {
      const mercado = await autenticar("mercados", email.trim().toLowerCase(), "email");
      if (mercado) {
        return showAlert(
          "Login não permitido",
          "Por medidas de segurança, mercados devem fazer login utilizando e-mail ou telefone, não com o Google."
        );
      }

      const user = await autenticar("usuario", email.trim().toLowerCase(), "email");
      const userTelefone = telefone
        ? await autenticar("usuario", normalizarTelefone(telefone), "telefone")
        : null;

      const finalUser = user || userTelefone;

      if (finalUser) {
        const sessionData = {
          nome: finalUser.nome || nome,
          email: finalUser.email || email,
          telefone: finalUser.telefone || telefone,
          id: finalUser.id,
          loginTime: Date.now(),
          tipoLogin: "usuario",
          tipoContato: "email",
        };

        const sucesso = await login(sessionData);
        if (sucesso !== false) {
          localStorage.setItem("tipoLogin", "usuario");
          localStorage.setItem("entidade", JSON.stringify(finalUser));
          navigate("/home");
        } else {
          showAlert("Erro", "Falha ao realizar login.");
        }
      } else {
        showAlert("Conta não encontrada", "Cadastre-se antes de fazer login com o Google.");
      }
    } catch (error) {
      console.error("Erro ao autenticar com Google:", error);
      showAlert("Erro", "Ocorreu um erro inesperado.");
    }
  };

  return {
    form,
    step,
    modal,
    tempoRestante,
    buttonsDisabled,
    handleChange,
    enviarCodigoHandler,
    validarCodigo,
    setForm,
    setStep,
    setModal,
    loginComGoogle,
    loginComFacebook,
  };
}
