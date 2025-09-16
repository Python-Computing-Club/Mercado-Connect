import { useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import useStepNavigation from "../../hooks/useStepNavigation";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import useGoogleLogin from "../../hooks/useGoogleLogin";
import useFacebookLogin from "../../hooks/useFacebookLogin";
import { criarUsuario, buscarUsuario } from "../../services/firestore/usuarios";

function formatarTelefoneVisual(telefone) {
  if (!telefone) return "";
  const numeros = telefone.replace(/\D/g, "");
  let numeroSemCodigo = numeros.startsWith("55") ? numeros.slice(2) : numeros;

  if (numeroSemCodigo.length === 11) {
    const ddd = numeroSemCodigo.slice(0, 2);
    const parte1 = numeroSemCodigo.slice(2, 7);
    const parte2 = numeroSemCodigo.slice(7, 11);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  if (numeroSemCodigo.length === 10) {
    const ddd = numeroSemCodigo.slice(0, 2);
    const parte1 = numeroSemCodigo.slice(2, 6);
    const parte2 = numeroSemCodigo.slice(6, 10);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  if (numeroSemCodigo.length > 2) {
    return `(${numeroSemCodigo.slice(0, 2)}) ${numeroSemCodigo.slice(2)}`;
  }
  if (numeroSemCodigo.length > 0) {
    return `(${numeroSemCodigo}`;
  }
  return "";
}

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
    cpf: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [tempoRestante, setTempoRestante] = useState(0);
  const [bloquearEnvio, setBloquearEnvio] = useState(false);
  const [bloquearContinuar, setBloquearContinuar] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const showAlert = (title, message) =>
    setModal({ open: true, title, message });

  const { enviarCodigo } = useEmailCodigo();
  const { sendVerificationCode } = useTextBeeSms();
  const { loginComGoogle: autenticarGoogle, loading: googleLoading } =
    useGoogleLogin(showAlert);

  const { step, setStep, handleBack } = useStepNavigation(1, {
    customBack: (currentStep) => {
      if (currentStep === 3) return 1;
      if (currentStep === 5 || currentStep === 6)
        return form.tipoContato === "email" ? 4 : 3;
      return null;
    },
  });

  const { loginComFacebook: autenticarFacebook } = useFacebookLogin(
    setModal,
    setForm,
    setStep
  );

  useCodigoTimer({
    active:
      (step === 2 && !!form.codigoGerado) ||
      (step === 5 && !!form.codigoGeradoOpcional),
    duration: 300,
    onExpire: () =>
      showAlert("Código expirou", "Reenvie o código para continuar."),
    setTime: setTempoRestante,
  });

  const bloquearTemporariamente = (callback, segundos) => {
    callback(true);
    setTimeout(() => callback(false), segundos * 1000);
  };

  const prepararTelefoneParaSalvar = (value) => {
    if (!value) return "";
    let telefoneFormatado = value.replace(/[^\d+]/g, "");
    if (!telefoneFormatado.startsWith("+55")) {
      telefoneFormatado = "+55" + telefoneFormatado.replace(/\D/g, "");
    }
    return telefoneFormatado;
  };

  const handleChange = ({ target: { name, value } }) => {
    if (step === 1 && name === "contato") {
      const isEmail = value.includes("@");
      const onlyNumbers = value.replace(/\D/g, "");

      if (isEmail) {
        setForm((prev) => ({
          ...prev,
          contato: value,
          tipoContato: "email",
          telefone: "",
        }));
        return;
      }

      if (onlyNumbers.length >= 7) {
        const numeroComDdi =
          "+" + (onlyNumbers.startsWith("55") ? onlyNumbers : "55" + onlyNumbers);
        const visualFormat = formatarTelefoneVisual(onlyNumbers);

        setForm((prev) => ({
          ...prev,
          contato: visualFormat,
          tipoContato: "telefone",
          telefone: numeroComDdi,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          contato: value,
          tipoContato: "",
          telefone: "",
        }));
      }
    } else if (step === 4 && name === "telefone") {
      const somenteNumeros = value.replace(/\D/g, "");
      setForm((prev) => ({
        ...prev,
        telefone: somenteNumeros,
        contato: prev.contato,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const telefoneFormatadoParaExibir =
    step === 1 || step === 4
      ? formatarTelefoneVisual(form.telefone)
      : form.telefone;

  const enviarCodigoHandler = async () => {
    if (tempoRestante > 0 || bloquearEnvio) {
      return showAlert("Aguarde", "Você precisa esperar antes de reenviar o código.");
    }

    bloquearTemporariamente(setBloquearEnvio, 10);
    bloquearTemporariamente(setBloquearContinuar, 10);

    if (!form.tipoContato) {
      return showAlert("Formato inválido", "Informe um e‑mail ou telefone válido.");
    }

    const contatoParaBuscar =
      form.tipoContato === "telefone" ? form.telefone : form.contato;

    const usuarioExistente = await buscarUsuario(
      contatoParaBuscar,
      form.tipoContato
    );
    if (usuarioExistente) {
      return showAlert("Já existe", "Este e-mail ou telefone já está cadastrado.");
    }

    let codigoGerado = "";

    if (form.tipoContato === "email") {
      codigoGerado = await enviarCodigo(
        form.contato,
        form.tipoContato,
        showAlert,
        showAlert
      );
    } else {
      const telefoneEnvio = form.telefone.startsWith("+55")
        ? form.telefone
        : "+55" + form.telefone.replace(/\D/g, "");

      const result = await sendVerificationCode(telefoneEnvio);
      if (!result) {
        showAlert("Erro ao enviar SMS", "Falha ao enviar código.");
        return;
      }

      codigoGerado = result;
      showAlert("Código enviado", `Código enviado para: ${telefoneEnvio}`);
    }

    if (!codigoGerado) return;

    setForm((prev) => ({ ...prev, codigoGerado, codigo: "" }));
    setTempoRestante(300);
    setStep(2);
  };

  const reenviarCodigo = () => {
    if (bloquearEnvio) {
      return showAlert("Aguarde", "Espere 10 segundos antes de reenviar.");
    }
    enviarCodigoHandler();
  };

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

  const enviarCodigoTelefone = async () => {
    if (bloquearEnvio) {
      return showAlert("Aguarde", "Espere 10 segundos antes de enviar novamente.");
    }

    bloquearTemporariamente(setBloquearEnvio, 10);
    bloquearTemporariamente(setBloquearContinuar, 10);

    let numero = form.telefone?.replace(/\D/g, "");
    if (!numero || numero.length < 10) {
      showAlert("Telefone inválido", "Digite um número válido com DDD.");
      return;
    }

    if (!numero.startsWith("55")) {
      numero = "55" + numero;
    }

    const telefoneFormatado = "+" + numero;

    const usuarioExistenteTelefone = await buscarUsuario(
      telefoneFormatado,
      "telefone"
    );
    if (usuarioExistenteTelefone) {
      showAlert("Já cadastrado", "Este telefone já está em uso.");
      return;
    }

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

    let telefoneParaSalvar = "";
    if (form.tipoContato === "telefone") {
      telefoneParaSalvar = form.telefone;
    } else {
      telefoneParaSalvar = prepararTelefoneParaSalvar(form.telefone);
    }

    const usuario = {
      nome: form.nome,
      email: form.tipoContato === "email" ? form.contato : "",
      telefone: telefoneParaSalvar,
      cpf: form.cpf || "",
      enderecos: {
        cep: form.cep || "",
        rua: form.rua || "",
        numero: form.numero || "",
        bairro: form.bairro || "",
        cidade: form.cidade || "",
        estado: form.estado || "",
      },
    };

    const resultado = await criarUsuario(usuario);

    if (resultado?.sucesso || resultado?.motivo === "duplicado") {
      const dadosUsuario = { ...usuario, id: resultado.id };
      localStorage.setItem("userSession", JSON.stringify(dadosUsuario));
      login(dadosUsuario);
      showAlert("Cadastro realizado", "Seu cadastro foi concluído com sucesso!");
      setTimeout(() => navigate("/home"), 1500);
    } else {
      showAlert("Erro", "Não foi possível concluir o cadastro.");
    }
  };

  const handleContinue = () => {
    if (bloquearContinuar) {
      return showAlert("Aguarde", "Espere alguns segundos antes de continuar.");
    }

    bloquearTemporariamente(setBloquearContinuar, 10);

    if (step === 1) {
      enviarCodigoHandler();
    } else if (step === 3) {
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
        return showAlert(
          "Telefone obrigatório",
          "Informe um número válido ou clique em 'Pular'."
        );
      } else {
        enviarCodigoTelefone();
      }
    } else if (step === 5) {
      validarCodigoOpcional();
    } else if (step === 6) {
      finalizarCadastro();
    }
  };

  const pularTelefone = () => {
    setForm((prev) => ({ ...prev, telefone: "" }));
    setStep(6);
  };

  const loginComGoogle = async ({ usuario }) => {
    if (!usuario?.email) {
      showAlert("Erro no login", "Não foi possível autenticar com o Google.");
      return;
    }

    const usuarioExistente = await buscarUsuario(usuario.email, "email");
    if (usuarioExistente) {
      return showAlert("Já cadastrado", "Este e‑mail já está em uso.");
    }

    setForm((prev) => ({
      ...prev,
      nome: usuario.displayName || "Usuário Google",
      contato: usuario.email,
      tipoContato: "email",
    }));

    setStep(3);
  };

  const loginComFacebook = async () => {
    autenticarFacebook();
  };

  return {
    step,
    form: { ...form, telefone: telefoneFormatadoParaExibir },
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
    loginComGoogle,
    autenticarGoogle,
    googleLoading,
    loginComFacebook,
    setModal,
    bloquearEnvio,
    bloquearContinuar,
    pularTelefone,
  };
}