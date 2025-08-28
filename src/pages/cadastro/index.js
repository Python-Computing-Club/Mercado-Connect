import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";
import cartIcon from "../../assets/teste.png";
import googleIcon from "../../assets/google.png";
import facebookIcon from "../../assets/facebook.png";
import Modal from "../../modal/modal.js";
import styles from "./cadastro.module.css";

export default function Cadastro() {
  const [step, setStep] = useState(1);
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

  const formatTelefone = (value) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
    return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const gerarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

  const enviarCodigo = async () => {
    if (!form.contato.trim()) return showAlert("Campo vazio", "Informe e-mail ou telefone.");
    const codigoGerado = gerarCodigo();
    setForm((prev) => ({ ...prev, codigoGerado, codigo: "" }));
    setTempoRestante(300);
    setStep(2);

    if (form.tipoContato === "email") {
      const email = form.contato.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAlert("Email inválido", "Informe um email válido.");
      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          { to_email: email, codigo: codigoGerado },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
        showAlert("Código enviado", `Código enviado para: ${email}`);
      } catch (err) {
        console.error(err);
        showAlert("Erro", "Falha ao enviar código pelo EmailJS.");
      }
    } else {
      showAlert("Código enviado", `Código enviado para: ${form.contato}`);
    }
  };

  const reenviarCodigo = () => {
    enviarCodigo();
  };

  useEffect(() => {
    if (step !== 2 || !form.codigoGerado) return;

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          showAlert("Código expirado", "Seu código expirou. Reenvie para continuar.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, form.codigoGerado]);

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

  const handleBack = () => { if (step > 1) setStep((s) => s - 1); };

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

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoContainer}>
        <div className={styles.logo}><img src={cartIcon} alt="Logo" className={styles.cartIcon} /></div>
        <div className={styles.title} translate="no"><h1>Mercado</h1><h1>Connect</h1></div>
      </Link>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {step === 1 && (
          <>
            <label>Email ou telefone</label>
            <input type="text" name="contato" value={form.contato} onChange={handleChange} placeholder="Digite e-mail ou telefone" />
            <button type="button" className={styles.submitBtn} onClick={enviarCodigo}>Enviar código</button>
            <div className={styles.divider}><span></span><span>ou</span><span></span></div>
            <div className={styles.socialLogin}>
              <button type="button" className={styles.googleBtn}><img src={googleIcon} alt="Google" />Entrar com Google</button>
              <button type="button" className={styles.facebookBtn}><img src={facebookIcon} alt="Facebook" />Entrar com Facebook</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label>Código enviado</label>
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value.replace(/\D/g, "") }))}
              placeholder="Digite o código"
              maxLength={6}
            />
            <p>Tempo restante: {Math.floor(tempoRestante / 60)}:{("0" + (tempoRestante % 60)).slice(-2)}</p>
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>Voltar</button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={validarCodigo}
                disabled={form.codigo.length !== 6 || tempoRestante === 0}
                style={{
                  backgroundColor: form.codigo.length === 6 && tempoRestante > 0 ? "#006400" : "#ccc",
                  cursor: form.codigo.length === 6 && tempoRestante > 0 ? "pointer" : "not-allowed",
                }}
              >
                Confirmar código
              </button>
            </div>
            <button type="button" className={styles.submitBtn} style={{ marginTop: "10px" }} onClick={reenviarCodigo}>Reenviar código</button>
          </>
        )}

        {step === 3 && (
          <>
            <label>Nome completo</label>
            <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Digite seu nome" />
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>Voltar</button>
              <button type="button" className={styles.submitBtn} onClick={() => setStep(4)}>Continuar</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <label>Telefone (opcional)</label>
            <input type="text" name="telefoneOpcional" value={form.telefoneOpcional} onChange={handleChange} placeholder="Digite seu telefone (opcional)" />
            <div className={styles.privacyContainer}>
              <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <label htmlFor="terms">
                Aceito os{" "}
                <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a{" "}
                <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
              </label>
            </div>
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>Voltar</button>
              <button type="button" className={styles.skipBtn} onClick={pularTelefone}>Pular</button>
              <button type="button" className={styles.submitBtn} onClick={finalizarCadastro}>Finalizar cadastro</button>
            </div>
          </>
        )}
      </form>

      {modal.open && <Modal title={modal.title} message={modal.message} onClose={() => setModal((m) => ({ ...m, open: false }))} />}
    </div>
  );
}
