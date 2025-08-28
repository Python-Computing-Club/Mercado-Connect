import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFormatTelefone from "../../hooks/useFormatTelefone";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import useStepNavigation from "../../hooks/useStepNavigation";
import useCodigoTimer from "../../hooks/useCodigoTimer";

export default function CadastroForm() {
  const [form, setForm] = useState({
    contato: "",
    tipoContato: "",
    codigo: "",
    codigoGerado: "",
    nome: "",
    telefoneOpcional: "",
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

  const handleChange = ({ target: { name, value } }) => {
    if (step === 1 && name === "contato") {
      const primeiro = value[0];
      if (primeiro && /\d/.test(primeiro)) {
        setForm({ ...form, contato: formatTelefone(value), tipoContato: "telefone" });
      } else {
        setForm({ ...form, contato: value, tipoContato: "email" });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const enviarCodigoHandler = async () => {
    const codigoGerado = await enviarCodigo(form.contato, form.tipoContato, showAlert, showAlert);
    if (!codigoGerado) return;

    setForm((prev) => ({ ...prev, codigoGerado, codigo: "" }));
    setTempoRestante(300);
    setStep(2);
  };

  const reenviarCodigo = () => enviarCodigoHandler();

  const validarCodigo = () => {
    if (tempoRestante === 0) return showAlert("Código expirado", "Reenvie o código para continuar.");
    if (form.codigo.length !== 6) return;
    if (form.codigo === form.codigoGerado) {
      setStep(3);
      setForm((prev) => ({ ...prev, codigo: "" }));
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  const finalizarCadastro = () => {
    if (!form.nome.trim()) return showAlert("Nome obrigatório", "Informe seu nome completo.");
    if (!acceptedTerms) return showAlert("Termos não aceitos", "Aceite os termos para continuar.");
    showAlert("Cadastro realizado", "Seu cadastro foi concluído com sucesso!");
    setTimeout(() => navigate("/"), 1500);
  };

  const pularTelefone = () => {
    if (!acceptedTerms) return showAlert("Termos não aceitos", "Aceite os termos para continuar.");
    finalizarCadastro();
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
    pularTelefone,
    setAcceptedTerms,
    setStep,
    setForm,
    setModal,
  };
}