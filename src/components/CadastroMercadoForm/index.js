import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFormatTelefone from "../../hooks/useFormatTelefone";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import useStepNavigation from "../../hooks/useStepNavigation";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import useValidarCodigo from "../../hooks/useValidarCodigo";
import consultarCEP from "../../hooks/useValidarEndereco";

export default function CadastroMercadoForm() {
  const [form, setForm] = useState({
    tipoContato: "",
    codigo: "",
    codigoGerado: "",
    nome: "",
    telefone: "",
    email: "",
    bairro: "",
    estado: "",
    cidade: "",
    endereco: ""
  });

  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [tempoRestante, setTempoRestante] = useState(0);

  const navigate = useNavigate();
  const { enviarCodigo } = useEmailCodigo();
  const { formatTelefone } = useFormatTelefone();

  const { step, setStep, handleBack, handleContinue } = useStepNavigation(1);
  useCodigoTimer({
    active: step === 2 && !!form.codigoGerado,
    duration: 300,
    onExpire: () => showAlert("Código expirado", "Seu código expirou. Reenvie para continuar."),
    setTime: setTempoRestante,
  });

  const showAlert = (title, message) => setModal({ open: true, title, message });

  const handleChange = async ({ target: { name, value } }) => {
    if (step === 3 && name === "telefone") {
      const apenasNumeros = value.replace(/\D/g, "");
      setForm({ ...form, telefone: formatTelefone(apenasNumeros), tipoContato: "telefone" });
    } else if (step === 4 && name === "cep" && value.replace(/\D/g, "").length === 8) {
        const endereco = await consultarCEP(value, showAlert);
        setForm((prev) => ({
            ...prev,
            estado: endereco.uf,
            cidade: endereco.localidade,
            endereco: endereco.logradouro,
            bairro: endereco.bairro,
        }));
    } else {
        setForm({ ...form, [name]: value });
    }
  };

  const enviarCodigoHandler = async () => {
    const codigoGerado = await enviarCodigo(form.email, "email", showAlert, showAlert);
    if (!codigoGerado) return;

    setForm((prev) => ({ ...prev, codigoGerado, codigo: "" }));
    setTempoRestante(300);
    setStep(2);
  };

  const reenviarCodigo = () => enviarCodigoHandler();

  const { validarCodigo } = useValidarCodigo({
    form,
    tempoRestante,
    setStep,
    setForm,
    showAlert,
  });

  const finalizarCadastro = () => {
    if (!form.nome.trim()) return showAlert("Nome obrigatório", "Informe seu nome completo.");
    if (!acceptedTerms) return showAlert("Termos não aceitos", "Aceite os termos para continuar.");
    showAlert("Cadastro realizado", "Seu cadastro foi concluído com sucesso!");
    setTimeout(() => navigate("/"), 1500);
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