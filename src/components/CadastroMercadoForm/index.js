import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFormatTelefone from "../../hooks/useFormatTelefone";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import useStepNavigation from "../../hooks/useStepNavigation";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import useValidarCodigo from "../../hooks/useValidarCodigo";
import consultarCEP from "../../hooks/useValidarEndereco";
import FormatCEP from "../../hooks/FormatCEP";
import { criarMercado } from "../../services/firestore/mercados";

export default function CadastroMercadoForm() {
    const [form, setForm] = useState({
        codigo: "",
        codigoGerado: "",
        nome: "",
        telefone: "",
        email: "",
        bairro: "",
        estado: "",
        cidade: "",
        endereco: "",
        proprietario: "",
        cpf: "",
        cnpj: "",
        loja: ""
    });


    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [modal, setModal] = useState({ open: false, title: "", message: "" });
    const [tempoRestante, setTempoRestante] = useState(0);

    const navigate = useNavigate();
    const { enviarCodigo } = useEmailCodigo();
    const { formatTelefone } = useFormatTelefone();

    const validateStep = (step, form) => {
        if (step === 3) {
            const nomeValido = form.nome?.trim().length > 0;
            const telefoneValido = form.telefone?.trim().length > 0;

            if (!nomeValido || !telefoneValido) {
                showAlert("Campos obrigatórios", "Preencha seu nome completo e número de telefone.");
                return false;
            } else {
                return true;
            }
        } else if (step === 4) {
            if (!form.nome.trim() || !form.cep.trim() || !form.numero) {
                showAlert("Campos obrigatórios", "Preencha todos os campos obrigatórios.");
                return false;
            }
        }
        return true;
    };

    const { step, setStep, handleBack, handleContinue } = useStepNavigation(1, {
        validateStep
    });
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
            setForm((prev) => ({
                ...prev,
                telefone: formatTelefone(apenasNumeros)
            }));
            return;
        } else if (step === 3 && name === "nome") {
            const apenasLetras = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""); // inclui acentos e espaços
            setForm((prev) => ({
                ...prev,
                nome: apenasLetras,
            }));
            return;
        } else if (step === 4 && name === "cep") {
            const cepFormatado = FormatCEP(value);
            setForm((prev) => ({ ...prev, cep: cepFormatado }));
            const cepLimpo = value.replace(/\D/g, "");

            if (cepLimpo.length === 8) {
                console.log(cepLimpo)
                const endereco = await consultarCEP(cepLimpo, showAlert);
                if (endereco && !endereco.erro) {
                    setForm((prev) => ({
                        ...prev,
                        cep: cepFormatado,
                        estado: endereco.uf || "",
                        cidade: endereco.localidade || "",
                        endereco: endereco.logradouro || "",
                        bairro: endereco.bairro || "",
                    }));
                } else {
                    setForm((prev) => ({
                        ...prev,
                        estado: "",
                        cidade: "",
                        endereco: "",
                        bairro: "",
                    }));
                }
            } else {
                setForm((prev) => ({
                    ...prev,
                    estado: "",
                    cidade: "",
                    endereco: "",
                    bairro: "",
                }));
            }

        } else if (step === 5 && name === "cpf") {
            const cpfLimpo = value.replace(/\D/g, "");
            const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            setForm((prev) => ({...prev, cpf: cpfFormatado}))

        } else if (step === 5 && name === "cnpj") {
            const cnpjLimpo = value.replace(/\D/g, "");
            const cnpjFormatado = cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
            setForm((prev) => ({...prev, cnpj: cnpjFormatado}))

        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
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

        const finalizarCadastro = async () => {
            if (!form.proprietario.trim() || !form.cpf.length === 14 || !form.cnpj.length === 18 || !form.loja.trim()) return showAlert("Campos Obrigatórios", "Preencha todos os campos!");
            if (!acceptedTerms) return showAlert("Termos não aceitos", "Aceite os termos para continuar.");
            console.log(form)
            const cadastroMercado = await criarMercado({
                nome: form.nome,
                email: form.email,
                telefone: form.telefone,
                endereco:{
                    cep: form.cep,
                    logradouro: form.endereco,
                    cidade: form.cidade,
                    estado: form.estado,
                    bairro: form.bairro,
                    numero: form.numero,
                    complemento: form.complemento ?? ""
                },
                proprietario: form.proprietario,
                cpf_proprietario: form.cpf,
                cnpj: form.cnpj,
                estabelecimento: form.loja
            });
            if(cadastroMercado){
                showAlert("Cadastro realizado", "Seu cadastro foi concluído com sucesso!");
                setTimeout(() => navigate("/"), 1500);
            }else{
                showAlert("Erro no cadastro", "Verifique os dados e tente novamente.");
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