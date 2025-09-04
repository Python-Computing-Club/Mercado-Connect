import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import { autenticar } from "../../services/authService";

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

  const navigate = useNavigate();
  const { enviarCodigo } = useEmailCodigo();
  const { sendVerificationCode } = useTextBeeSms();

  useCodigoTimer({
    active: step === 2 && !!form.codigoGerado,
    duration: 300,
    onExpire: () => showAlert("Código expirado", "Reenvie o código para continuar."),
    setTime: setTempoRestante,
  });

  const showAlert = (title, message) => {
    setModal({ open: true, title, message });
  };

  const handleChange = (e) => {
    const { value } = e.target;
    const isEmail = value.includes("@");
    const onlyNumbers = value.replace(/\D/g, "");

    if (isEmail) {
      setForm({ ...form, contato: value, tipoContato: "email" });
    } else if (onlyNumbers.length >= 4) {
      const formatted = "+" + (onlyNumbers.startsWith("55") ? onlyNumbers : "55" + onlyNumbers);
      setForm({ ...form, contato: formatted, tipoContato: "telefone" });
    } else {
      setForm({ ...form, contato: value, tipoContato: "" });
    }
  };

  const handlerLogin = async () => {
    if (!form.tipoContato) {
      return showAlert("Formato inválido", "Informe um e‑mail ou telefone válido.");
    }

    let usuario = null;
    let mercado = null;

    if (form.tipoContato === "email") {
      usuario = await autenticar("usuario", form.contato, form.tipoContato);
      mercado = await autenticar("mercados", form.contato, form.tipoContato);
    } else {
      usuario = await autenticar("usuario", form.contato, form.tipoContato);
    }

    const entidade = usuario || mercado;
    const tipoLogin = mercado ? "mercado" : "usuario";

    if (!entidade) {
      return showAlert("Conta não encontrada", "Nenhum cadastro vinculado a este contato.");
    }

    let codigo = "";

    if (form.tipoContato === "email") {
      codigo = await enviarCodigo(form.contato, form.tipoContato, showAlert, showAlert);
    } else {
      const result = await sendVerificationCode(form.contato);
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

  const validarCodigo = () => {
    if (tempoRestante === 0) {
      return showAlert("Código expirado", "Reenvie o código para continuar.");
    }

    if (form.codigo === form.codigoGerado) {
      localStorage.setItem("tipoLogin", form.tipoLogin);
      localStorage.setItem("entidade", JSON.stringify(form.entidadeDados));
      if (form.tipoLogin === "mercado") {
        navigate("/painel-mercado");
      } else {
        navigate("/painel-usuario");
      }
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  const loginComGoogle = async (email, nome, telefone) => {
    const user = await autenticar(email, "email");
    if (user) {
      navigate("/home");
    } else {
      showAlert("Conta não encontrada", "Cadastre-se antes de fazer login com o Google.");
    }
  };

  return {
    form,
    step,
    modal,
    tempoRestante,
    handleChange,
    handlerLogin,
    validarCodigo,
    setForm,
    setStep,
    setModal,
    loginComGoogle,
  };
}