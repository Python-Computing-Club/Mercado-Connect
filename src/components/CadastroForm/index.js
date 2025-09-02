import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFormatTelefone from "../../hooks/useFormatTelefone";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import useStepNavigation from "../../hooks/useStepNavigation";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import axios from "axios";

export default function CadastroForm() {
  const BASE_URL = process.env.REACT_APP_BASE_URL;
  const API_KEY = process.env.REACT_APP_API_KEY;
  const DEVICE_ID = process.env.REACT_APP_DEVICE_ID;

  const [form, setForm] = useState({
    contato: "",
    tipoContato: "",
    codigo: "",
    codigoGerado: "",
    nome: "",
    telefone: "",
    telefoneOpcional: "",
    codigoOpcional: "",
    codigoGeradoOpcional: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [tempoRestante, setTempoRestante] = useState(0);

  const navigate = useNavigate();
  const { enviarCodigo } = useEmailCodigo();
  const { formatTelefone } = useFormatTelefone();

  const { step, setStep, handleBack, handleContinue: handleNextStep } = useStepNavigation(1, {
  customBack: (currentStep) => {
    if (currentStep === 3) return 1;
    if (currentStep === 5 || currentStep === 6) return 4;
    return null;
  },
});

  useCodigoTimer({
    active:
      (step === 2 && !!form.codigoGerado) ||
      (step === 5 && !!form.codigoGeradoOpcional),
    duration: 300,
    onExpire: () =>
      showAlert("Código expirado", "Seu código expirou. Reenvie para continuar."),
    setTime: setTempoRestante,
  });

  const showAlert = (title, message) =>
    setModal({ open: true, title, message });

  const handleChange = ({ target: { name, value } }) => {
    if (step === 1 && name === "contato") {
      const isEmail = value.includes("@");
      const onlyNumbers = value.replace(/\D/g, "");
      if (isEmail) {
        setForm({ ...form, contato: value, tipoContato: "email" });
        return;
      }
      if (onlyNumbers.length < 4) {
        setForm({ ...form, contato: value, tipoContato: "" });
        return;
      }
      let formatted = onlyNumbers;
      if (!onlyNumbers.startsWith("55")) {
        formatted = "55" + onlyNumbers;
      }
      const formattedPhone = "+" + formatted;
      setForm({ ...form, contato: formattedPhone, tipoContato: "telefone" });
    } else if (step === 4 && name === "telefoneOpcional") {
      const apenasNumeros = value.replace(/\D/g, "");
      let formatted = apenasNumeros;
      if (apenasNumeros.length >= 4 && !apenasNumeros.startsWith("55")) {
        formatted = "55" + apenasNumeros;
      }
      setForm({ ...form, telefoneOpcional: "+" + formatted });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const enviarCodigoHandler = async () => {
    let codigoGerado = "";
    if (form.tipoContato === "email") {
      codigoGerado = await enviarCodigo(
        form.contato,
        form.tipoContato,
        showAlert,
        showAlert
      );
    } else if (form.tipoContato === "telefone") {
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const message = `Seu código de verificação é: ${codigo}. Ele expira em 5 minutos.`;
      try {
        await axios.post(
          `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
          { recipients: [form.contato], message },
          { headers: { "x-api-key": API_KEY } }
        );
        codigoGerado = codigo;
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message;
        showAlert("Erro ao enviar SMS", errMsg);
        return;
      }
    }
    if (!codigoGerado) return;
    setForm((prev) => ({ ...prev, codigoGerado, codigo: "" }));
    setTempoRestante(300);
    setStep(2);
  };

  const reenviarCodigo = () => enviarCodigoHandler();

  const validarCodigo = () => {
    if (tempoRestante === 0) {
      return showAlert("Código expirado", "Reenvie o código para continuar.");
    }
    if (form.codigo.length !== 6) return;
    if (form.codigo === form.codigoGerado) {
      setStep(3);
      setForm((prev) => ({ ...prev, codigo: "" }));
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  const enviarCodigoOpcional = async () => {
    const numero = form.telefoneOpcional.replace(/\D/g, "");
    if (!numero) return;
    const telefoneFormatado = form.telefoneOpcional;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `Código de verificação: ${codigo}. Ele expira em 5 minutos.`;
    try {
      await axios.post(
        `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
        { recipients: [telefoneFormatado], message },
        { headers: { "x-api-key": API_KEY } }
      );
      setForm((prev) => ({
        ...prev,
        telefone: telefoneFormatado,
        codigoGeradoOpcional: codigo,
        codigoOpcional: "",
      }));
      setStep(5);
      setTempoRestante(300);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      showAlert("Erro ao enviar SMS", errMsg);
    }
  };

  const validarCodigoOpcional = () => {
    if (form.codigoOpcional === form.codigoGeradoOpcional) {
      setStep(6);
    } else {
      showAlert("Inválido", "Código do telefone está incorreto.");
    }
  };

  const finalizarCadastro = () => {
    if (!form.nome.trim()) {
      return showAlert("Nome obrigatório", "Informe seu nome completo.");
    }
    if (!acceptedTerms) {
      return showAlert("Termos não aceitos", "Aceite os termos para continuar.");
    }
    showAlert("Cadastro realizado", "Seu cadastro foi concluído com sucesso!");
    setTimeout(() => navigate("/"), 1500);
  };

  const handleContinue = () => {
    if (step === 3) {
      if (!form.nome.trim())
        return showAlert("Nome obrigatório", "Informe seu nome completo.");
      setStep(4);
    } else if (step === 4) {
      const numero = form.telefoneOpcional.replace(/\D/g, "");
      if (!numero) {
        setStep(6);
        showAlert("Telefone não informado", "Você poderá adicioná-lo mais tarde.");
      } else {
        enviarCodigoOpcional();
      }
    } else if (step === 5) {
      validarCodigoOpcional();
    } else if (step === 6) {
      finalizarCadastro();
    }
  };

  return {
    step,
    form,
    acceptedTerms,
    modal,
    tempoRestante,
    handleChange,
    enviarCodigoHandler,
    reenviarCodigo,
    validarCodigo,
    handleBack,
    handleContinue,
    finalizarCadastro,
    setAcceptedTerms,
    setStep,
    setForm,
    setModal,
  };
}
