import React from "react";
import { Link } from "react-router-dom";
import cartIcon from "../../assets/teste.png";
import Modal from "../../modal/modal.js";
import styles from "./cadastro.module.css";
import useCadastroMercadoForm from "../../components/CadastroMercadoForm/index.js";

export default function CadastroMercado() {
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
    handleContinue,
    finalizarCadastro,
    setAcceptedTerms,
    setModal,
    setForm,
  } = useCadastroMercadoForm();

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
            <label>Email</label>
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Digite seu e-mail"
            />
            <button type="button" className={styles.submitBtn} onClick={enviarCodigoHandler}>
              Continuar Cadastro
            </button>
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
              placeholder="Nome e Sobrenome"
            />
            <label>Celular</label>
            <input
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="Insira seu número de celular"
            />
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.backBtn} onClick={handleBack}>
                Voltar
              </button>
              <button type="button" className={styles.submitBtn} onClick={handleContinue}>
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <label>CEP</label>
            <input
              type="text"
              name="cep"
              value={form.cep}
              onChange={handleChange}
              placeholder="Insira o CEP da loja"
            />
            <label>Endereço</label>
            <input
              type="text"
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
              disabled={true}
            />
            <label>Estado</label>
            <input
              type="text"
              name="estado"
              value={form.estado}
              onChange={handleChange}
              disabled={true}
            />
            <label>Cidade</label>
            <input
              type="text"
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              disabled={true}
            />
            <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              disabled={true}
            />
            <label>Número</label>
            <input
              type="number"
              name="numero"
              value={form.numero}
              onChange={handleChange}
            />
            <label>Complemento</label>
            <input
              type="text"
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
              placeholder="Ex: Casa A"
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