import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import useStepNavigation from "../../hooks/useStepNavigation";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import { criarUsuario, buscarUsuario } from "../../services/firestore/usuarios";
import { signInWithGoogle } from "../../services/firebase";

export default function useCadastroForm() {
  const [form, setForm] = useState({
    contato: "",
    tipoContato: "",
    codigo: "",
    codigoGerado: "",
    nome: "",
    telefone: "",
    codigoOpcional: "",
    codigoGeradoOpcional: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [tempoRestante, setTempoRestante] = useState(0);

  const navigate = useNavigate();
  const { enviarCodigo } = useEmailCodigo();
  const { sendVerificationCode } = useTextBeeSms();

  const showAlert = (title, message) => setModal({ open: true, title, message });

  const { step, setStep, handleBack } = useStepNavigation(1, {
    customBack: (currentStep) => {
      if (currentStep === 3) return 1;
      if (currentStep === 5 || currentStep === 6) return form.tipoContato === "email" ? 4 : 3;
      return null;
    },
  });

  useCodigoTimer({
    active: (step === 2 && !!form.codigoGerado) || (step === 5 && !!form.codigoGeradoOpcional),
    duration: 300,
    onExpire: () => showAlert("Código expirado", "Seu código expirou. Reenvie para continuar."),
    setTime: setTempoRestante,
  });

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
      setForm({ ...form, contato: formattedPhone, tipoContato: "telefone", telefone: formattedPhone });
    }

    else if (step === 4 && name === "telefone") {
      const apenasNumeros = value.replace(/\D/g, "");
      let formatted = apenasNumeros;
      if (apenasNumeros.length >= 4 && !apenasNumeros.startsWith("55")) {
        formatted = "55" + apenasNumeros;
      }
      const telefoneFormatado = "+" + formatted;
      setForm({ ...form, telefone: telefoneFormatado });
    }

    else {
      setForm({ ...form, [name]: value });
    }
  };

  const enviarCodigoHandler = async () => {
    let codigoGerado = "";

    if (form.tipoContato === "email") {
      codigoGerado = await enviarCodigo(form.contato, form.tipoContato, showAlert, showAlert);
    } else if (form.tipoContato === "telefone") {
      const result = await sendVerificationCode(form.contato);
      if (!result) {
        showAlert("Erro ao enviar SMS", "Falha ao enviar código.");
        return;
      }
      codigoGerado = result;
      showAlert("Código enviado", `Código enviado para: ${form.contato}`);
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
    if (form.codigo?.length !== 6) return;

    if (form.codigo === form.codigoGerado) {
      setStep(3);
      setForm((prev) => ({ ...prev, codigo: "" }));
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  const enviarCodigoOpcional = async () => {
    let numero = form.telefone?.replace(/\D/g, "");
    if (!numero || numero.length < 10) {
      showAlert("Telefone inválido", "Digite um número válido com DDD.");
      return;
    }

    if (!numero.startsWith("55")) {
      numero = "55" + numero;
    }

    const telefoneFormatado = "+" + numero;

    const result = await sendVerificationCode(telefoneFormatado);
    if (!result) {
      showAlert("Erro ao enviar SMS", "Falha ao enviar código.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      telefone: telefoneFormatado,
      codigoGeradoOpcional: result,
      codigoOpcional: "",
    }));

    setStep(5);
    setTempoRestante(300);
  };

  const validarCodigoOpcional = () => {
    if (form.codigoOpcional === form.codigoGeradoOpcional) {
      setStep(6);
    } else {
      showAlert("Inválido", "Código do telefone está incorreto.");
    }
  };

  const finalizarCadastro = async () => {
    if (!form.nome?.trim()) {
      return showAlert("Nome obrigatório", "Informe seu nome completo.");
    }

    if (!acceptedTerms) {
      return showAlert("Termos não aceitos", "Aceite os termos para continuar.");
    }

    const usuario = {
      nome: form.nome,
      email: form.tipoContato === "email" ? form.contato : "",
      telefone: form.tipoContato === "telefone" ? form.contato : form.telefone,
    };

    const resultado = await criarUsuario(usuario);

    if (resultado?.sucesso) {
      showAlert("Cadastro realizado", "Seu cadastro foi concluído com sucesso!");
      setTimeout(() => navigate("/home"), 1500);
    } else if (resultado?.motivo === "duplicado") {
      showAlert("Já existe", "Este e-mail ou telefone já está cadastrado.");
    } else {
      showAlert("Erro", "Não foi possível concluir o cadastro.");
    }
  };

  const handleContinue = () => {
    if (step === 3) {
      if (!form.nome?.trim()) {
        return showAlert("Nome obrigatório", "Informe seu nome completo.");
      }

      if (form.tipoContato === "email") {
        setStep(4);
      } else {
        setStep(6);
      }

    } else if (step === 4) {
      const numero = form.telefone?.replace(/\D/g, "");
      if (!numero || numero.length < 10) {
        showAlert("Telefone não informado", "Você poderá adicioná-lo mais tarde.");
        setStep(6);
      } else {
        enviarCodigoOpcional();
      }

    } else if (step === 5) {
      validarCodigoOpcional();

    } else if (step === 6) {
      finalizarCadastro();
    }
  };

  const loginComGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      const nome = user.displayName || "";
      const email = user.email || "";
      const telefone = user.phoneNumber || "";

      const existente = await buscarUsuario(email, "email");

      if (!existente) {
        await criarUsuario({ nome, email, telefone });
      }

      setForm((prev) => ({
        ...prev,
        nome,
        contato: email,
        tipoContato: "email",
        telefone,
      }));

      setStep(6);
      showAlert("Quase lá!", "Confirme os termos para finalizar seu cadastro.");
    } catch (error) {
      console.error("Erro no login com Google:", error);
      showAlert("Erro", "Não foi possível fazer login com o Google.");
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
    loginComGoogle,
  };
}