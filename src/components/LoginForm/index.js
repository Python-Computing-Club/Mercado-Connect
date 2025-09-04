import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import { buscarUsuario } from "../../services/authService";

export default function useLoginFormLogic() {
  const [form, setForm] = useState({
    contato: "",
    tipoContato: "",
    codigo: "",
    codigoGerado: "",
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

  const enviarCodigoHandler = async () => {
    if (!form.tipoContato) {
      return showAlert("Formato inválido", "Informe um e‑mail ou telefone válido.");
    }

    const user = await buscarUsuario(form.contato, form.tipoContato);
    if (!user) {
      return showAlert("Não encontrado", "Usuário não cadastrado.");
    }

    let codigo = "";

    if (form.tipoContato === "email") {
      codigo = await enviarCodigo(form.contato, "login", showAlert, showAlert);
    } else {
      const result = await sendVerificationCode(form.contato);
      if (!result) return showAlert("Erro", "Falha ao enviar SMS.");
      codigo = result;
    }

    if (!codigo) return;

    showAlert("Código enviado", `Enviado para ${form.contato}`);
    setForm((prev) => ({ ...prev, codigoGerado: codigo, codigo: "" }));
    setTempoRestante(300);
    setStep(2);
  };

  const validarCodigo = () => {
    if (tempoRestante === 0) {
      return showAlert("Código expirado", "Reenvie o código para continuar.");
    }

    if (form.codigo === form.codigoGerado) {
      navigate("/home");
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  const loginComGoogle = async (email, nome, telefone) => {
    const user = await buscarUsuario(email, "email");
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
    enviarCodigoHandler,
    validarCodigo,
    setForm,
    setStep,
    setModal,
    loginComGoogle,
  };
}