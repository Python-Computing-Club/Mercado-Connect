import React from "react";
import { Link } from "react-router-dom";
import cartIcon from "../../assets/teste.png";
import googleIcon from "../../assets/google.png";
import facebookIcon from "../../assets/facebook.png";
import Modal from "../../modal/modal.js";
import styles from "./cadastro.module.css";
import useCadastroForm from "../../components/CadastroForm/index.js";

export default function CadastroUsuario() {
  const {
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
    finalizarCadastro,
    pularTelefone,
    setAcceptedTerms,
    setModal,
    setForm,
  } = useCadastroForm();

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoContainer}>
        <div className={styles.logo}>
          <img src={cartIcon} alt="Logo" className={styles.cartIcon} />
        </div>
        <div className={styles.title} translate="no">
          <h1>Mercado</h1>
          <h1>Connect</h1>
        </div>
      </Link>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {step === 1 && (
          <>
            <label>Email ou telefone</label>
            <input
              type="text"
              name="contato"
              value={form.contato}
              onChange={handleChange}
              placeholder="Digite e-mail ou telefone"
            />
            <button type="button" className={styles.submitBtn} onClick={enviarCodigoHandler}>
              Enviar código
            </button>
            <div className={styles.divider}>
              <span></span>
              <span>ou</span>
              <span></span>
            </div>
            <div className={styles.socialLogin}>
              <button type="button" className={styles.googleBtn}>
                <img src={googleIcon} alt="Google" />
                Entrar com Google
              </button>
              <button type="button" className={styles.facebookBtn}>
                <img src={facebookIcon} alt="Facebook" />
                Entrar com Facebook
              </button>
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, codigo: e.target.value.replace(/\D/g, "") }))
              }
              placeholder="Digite o código"
              maxLength={6}
            />
            <p>
              Tempo restante: {Math.floor(tempoRestante / 60)}:
              {("0" + (tempoRestante % 60)).slice(-2)}
            </p>
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>
                Voltar
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={validarCodigo}
                disabled={form.codigo.length !== 6 || tempoRestante === 0}
                style={{
                  backgroundColor:
                    form.codigo.length === 6 && tempoRestante > 0 ? "#006400" : "#ccc",
                  cursor:
                    form.codigo.length === 6 && tempoRestante > 0 ? "pointer" : "not-allowed",
                }}
              >
                Confirmar código
              </button>
            </div>
            <button
              type="button"
              className={styles.submitBtn}
              style={{ marginTop: "10px" }}
              onClick={reenviarCodigo}
            >
              Reenviar código
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <label>Nome completo</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Digite seu nome"
            />
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>
                Voltar
              </button>
              <button type="button" className={styles.submitBtn} onClick={() => setForm((f) => ({ ...f, step: 4 }))}>
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <label>Telefone (opcional)</label>
            <input
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="Digite seu telefone (opcional)"
            />
            <div className={styles.privacyContainer}>
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                Aceito os{" "}
                <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer">
                  Termos de Uso
                </a>{" "}
                e a{" "}
                <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">
                  Política de Privacidade
                </a>.
              </label>
            </div>
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>
                Voltar
              </button>
              <button type="button" className={styles.skipBtn} onClick={pularTelefone}>
                Pular
              </button>
              <button type="button" className={styles.submitBtn} onClick={finalizarCadastro}>
                Finalizar cadastro
              </button>
            </div>
          </>
        )}
      </form>

      {modal.open && (
        <Modal
          title={modal.title}
          message={modal.message}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
        />
      )}
    </div>
  );
}