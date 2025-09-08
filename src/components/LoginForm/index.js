import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import { autenticar } from "../../services/firestore/usuarios";
import { useAuth } from "../../Context/AuthContext";

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
    entidadeDados: null
  });

  const [step, setStep] = useState(1);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [tempoRestante, setTempoRestante] = useState(0);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  const navigate = useNavigate();
  const { enviarCodigo } = useEmailCodigo();
  const { sendVerificationCode } = useTextBeeSms();
  const { login } = useAuth();

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
      setForm({ ...form, contato: value, tipoContato: "email" });
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

  const enviarCodigoHandler = async () => {
    if (!form.tipoContato) {
      return showAlert("Formato inválido", "Informe um e‑mail ou telefone válido.");
    }

    let contatoParaBusca = form.contato;
    if (form.tipoContato === "telefone") {
      contatoParaBusca = normalizarTelefone(form.contato);
    }

    let usuario = null;
    let mercado = null;

    if (form.tipoContato === "email") {
      usuario = await autenticar("usuario", form.contato, form.tipoContato);
      mercado = await autenticar("mercados", form.contato, form.tipoContato);
    } else {
      usuario = await autenticar("usuario", contatoParaBusca, form.tipoContato);
    }

    const entidade = usuario || mercado;
    const tipoLogin = mercado ? "mercado" : "usuario";

    if (!entidade) {
      return showAlert("Conta não encontrada", "Nenhum cadastro vinculado a este contato.");
    }

    let codigo = "";

    if (form.tipoContato === "email") {
      codigo = await enviarCodigo(form.contato, "login", showAlert, showAlert);
    } else {
      const result = await sendVerificationCode(contatoParaBusca);
      if (!result) return showAlert("Erro", "Falha ao enviar SMS.");
      codigo = result;
    }

    if (!codigo) return;

    showAlert("Código enviado", `Enviado para ${form.contato}`);
    setForm((prev) => ({
      ...prev,
      codigoGerado: codigo,
      codigo: "",
      tipoLogin,
      entidadeId: entidade.id,
      entidadeDados: entidade
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
      let contatoParaBusca = form.contato;
      if (form.tipoContato === "telefone") {
        contatoParaBusca = normalizarTelefone(form.contato);
      }

      const user = await buscarUsuario(contatoParaBusca, form.tipoContato);
      if (!user) {
        return showAlert("Erro", "Usuário não encontrado no banco.");
      }

      const sessionData = {
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        id: user.id,
        loginTime: Date.now(),
      };

      const sucesso = await login(sessionData);
      if (sucesso !== false) {
        localStorage.setItem("tipoLogin", form.tipoLogin);
      localStorage.setItem("entidade", JSON.stringify(form.entidadeDados));
      if (form.tipoLogin === "mercado") {
        navigate("/painel-mercado");
      } else {
        navigate("/painel-usuario");
      }
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

    const user = await autenticar(email, "email");
    if (user) {
      const sessionData = {
        nome: user.nome || nome,
        email: user.email,
        telefone: user.telefone || telefone,
        id: user.id,
        loginTime: Date.now(),
      };
      const sucesso = await login(sessionData);
      if (sucesso !== false) {
        navigate("/home");
      } else {
        showAlert("Erro", "Falha ao realizar login.");
      }
    } else {
      showAlert("Conta não encontrada", "Cadastre-se antes de fazer login com o Google.");
    }
  };

  return {
    form,
    step,
    modal,
    tempoRestante,
    buttonsDisabled,
    handleChange,
    handlerLogin,
    validarCodigo,
    setForm,
    setStep,
    setModal,
    loginComGoogle,
  };
}