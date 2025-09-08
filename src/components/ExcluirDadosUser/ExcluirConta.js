import React, { useState, useEffect } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import { buscarUsuario } from "../../services/firestore/usuarios";
import { useAuth } from "../../Context/AuthContext";
import styles from "./ExcluirConta.module.css";

export default function ExcluirConta({ onClose }) {
  const [step, setStep] = useState(1);
  const [codigo, setCodigo] = useState("");
  const [codigoGerado, setCodigoGerado] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [usuarioContato, setUsuarioContato] = useState("");
  const [tipoContato, setTipoContato] = useState(null);
  const [docId, setDocId] = useState(null);
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [botaoBloqueado, setBotaoBloqueado] = useState(false);

  const { enviarCodigo } = useEmailCodigo();
  const {
    sendVerificationCode,
    verificationCode,
    error: smsError,
  } = useTextBeeSms();

  const { usuario, logout } = useAuth();

  useEffect(() => {
    if (!usuario) {
      setError("❌ Usuário não autenticado.");
      return;
    }

    setEmail(usuario.email || "");
    setTelefone(usuario.telefone || "");
  }, [usuario]);

  const handleEnviarCodigo = async (contatoSelecionado, tipoSelecionado) => {
    setError(null);
    setStatus(null);

    setBotaoBloqueado(true);
    setTimeout(() => setBotaoBloqueado(false), 5000);

    if (!contatoSelecionado || !tipoSelecionado) {
      setError("❌ Contato do usuário não disponível.");
      return;
    }

    try {
      const userFromDb = await buscarUsuario(contatoSelecionado, tipoSelecionado);
      if (!userFromDb) {
        setError("❌ Usuário não encontrado no banco.");
        return;
      }

      setDocId(userFromDb.id);
      setUsuarioContato(contatoSelecionado);
      setTipoContato(tipoSelecionado);

      if (tipoSelecionado === "telefone") {
        const codigoSms = await sendVerificationCode(contatoSelecionado);
        if (!codigoSms) {
          setError(smsError || "❌ Falha ao enviar SMS.");
          return;
        }
        setCodigoGerado(codigoSms);
        setStatus(`Código enviado para: ${contatoSelecionado}`);
        setStep(2);
      } else {
        const codigoEmail = await enviarCodigo(
          contatoSelecionado,
          "email",
          (titulo, msg) => setStatus(`${titulo}: ${msg}`),
          (titulo, msg) => setError(`${titulo}: ${msg}`)
        );

        if (!codigoEmail) {
          setError("❌ Falha ao enviar código por e-mail.");
          return;
        }

        setCodigoGerado(codigoEmail);
        setStatus(`Código enviado para: ${contatoSelecionado}`);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError("❌ Erro ao enviar código.");
    }
  };

  const handleValidarCodigo = () => {
    if (!codigo.trim()) {
      setError("❌ Código não informado.");
      return;
    }

    const codigoValido =
      tipoContato === "telefone"
        ? codigo.trim() === verificationCode
        : codigo.trim() === codigoGerado;

    if (!codigoValido) {
      setError("❌ Código inválido.");
      return;
    }

    setStep(3);
    setError(null);
    setStatus(null);
  };

  const handleExcluirConta = async () => {
    try {
      if (!docId) {
        setError("❌ Documento do usuário não encontrado.");
        return;
      }

      await deleteDoc(doc(db, "usuario", docId));
      logout();
      setStep(4);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("❌ Erro ao excluir conta.");
    }
  };

  return (
    <div className={styles.painel}>
      <h2>Excluir Conta</h2>

      {step === 1 && (
        <>
          <p>Tem certeza que deseja excluir sua conta? Essa ação é irreversível.</p>

          {email && (
            <button
              disabled={botaoBloqueado}
              className={`${styles.continueBtn} ${botaoBloqueado ? styles.bloqueado : ""}`}
              onClick={() => handleEnviarCodigo(email, "email")}
            >
              Enviar código por E-mail <br></br> {email}
            </button>
          )}

          {telefone && (
            <button
              disabled={botaoBloqueado}
              className={`${styles.continueBtn} ${botaoBloqueado ? styles.bloqueado : ""}`}
              onClick={() => handleEnviarCodigo(telefone, "telefone")}
            >
              Enviar código por SMS <br></br> {telefone}
            </button>
          )}

          <button className={styles.botaoCancelar} onClick={onClose}>
            Cancelar
          </button>

          {error && <p className={styles.error}>{error}</p>}
          {status && <p className={styles.status}>{status}</p>}
        </>
      )}

      {step === 2 && (
        <>
          <p>Digite o código enviado para <strong>{usuarioContato}</strong></p>
          <input
            className={styles.input}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={6}
            placeholder="Código"
          />
          <button className={styles.continueBtn} onClick={handleValidarCodigo}>
            Validar código
          </button>
          <button className={styles.botaoCancelar} onClick={onClose}>
            Cancelar
          </button>
          {error && <p className={styles.error}>{error}</p>}
          {status && <p className={styles.status}>{status}</p>}
        </>
      )}

      {step === 3 && (
        <>
          <p>⚠️ Última confirmação: deseja realmente excluir sua conta?</p>
          <button className={styles.continueBtn} onClick={handleExcluirConta}>
            Excluir agora
          </button>
          <button className={styles.botaoCancelar} onClick={onClose}>
            Cancelar
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}

      {step === 4 && (
        <>
          <p>✅ Sua conta foi excluída com sucesso.</p>
          <button className={styles.continueBtn} onClick={onClose}>
            Fechar
          </button>
        </>
      )}
    </div>
  );
}
