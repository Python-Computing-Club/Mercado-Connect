import { useState, useEffect } from "react";
import { updateProfile, updateEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import { buscarUsuario, atualizarUsuario } from "../../services/firestore/usuarios";
import useEmailCodigo from "../../hooks/useEmailCodigo";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import { useAuth } from "../../Context/AuthContext";
import useFormatTelefone from "../../hooks/useFormatTelefone";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import styles from "./DadosConta.module.css";

function removerPrefixoInternacional(telefone) {
  const limpo = (telefone || "").replace(/\D/g, "");
  if (limpo.startsWith("55") && limpo.length > 11) {
    return limpo.slice(2);
  }
  return limpo;
}

function formatarTelefoneParaEnvio(value) {
  let tel = (value || "").replace(/\D/g, "");
  if (!tel.startsWith("55")) {
    tel = "55" + tel;
  }
  return "+" + tel;
}

function formatarCpf(value) {
  let v = (value || "").replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{3})(\d)/, "$1.$2");
  v = v.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1-$2");
  return v;
}

export default function DadosConta({ onClose }) {
  const { usuario, atualizarUsuarioContext } = useAuth();
  const { enviarCodigo: enviarEmailCodigo } = useEmailCodigo();
  const { sendVerificationCode: enviarSmsCodigo } = useTextBeeSms();
  const { formatTelefone } = useFormatTelefone();

  const [step, setStep] = useState(1);
  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [telefone, setTelefone] = useState(
    formatTelefone(removerPrefixoInternacional(usuario?.telefone || ""))
  );
  const [cpf, setCpf] = useState(formatarCpf(usuario?.cpf || ""));

  const [cpfConfirmado, setCpfConfirmado] = useState(!!usuario?.cpf);

  const [docId, setDocId] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [codigoGerado, setCodigoGerado] = useState(null);

  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const [loadingCodigo, setLoadingCodigo] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  const [timeReenvio, setTimeReenvio] = useState(0);
  const [timeCodigo, setTimeCodigo] = useState(0);

  const emailAlterado = email !== usuario?.email;
  const telefoneAlterado =
    telefone !== formatTelefone(removerPrefixoInternacional(usuario?.telefone || ""));

  const cpfEditavel = !cpfConfirmado;

  useCodigoTimer({
    active: timeReenvio > 0,
    duration: timeReenvio,
    onExpire: () => setTimeReenvio(0),
    setTime: setTimeReenvio,
  });

  useCodigoTimer({
    active: timeCodigo > 0,
    duration: timeCodigo,
    onExpire: () => {
      setCodigoGerado(null);
      setError("⏰ Código expirado. Por favor, solicite um novo código.");
      setStep(1);
    },
    setTime: setTimeCodigo,
  });

  useEffect(() => {
    async function fetchDocId() {
      if (!usuario?.email) return;
      const userDoc = await buscarUsuario(usuario.email, "email");
      if (userDoc) setDocId(userDoc.id);
    }
    fetchDocId();
  }, [usuario]);

  useEffect(() => {
    setStatus(null);
    setError(null);
    setCodigo("");
    setTimeCodigo(0);
    setTimeReenvio(0);
  }, [step]);

  useEffect(() => {
    if (!usuario?.cpf && cpf.replace(/\D/g, "").length === 11) {
      setCpfConfirmado(false);
    }
  }, [cpf, usuario]);

  const handleConfirmarCpf = () => {
    if (cpf.replace(/\D/g, "").length !== 11) {
      setError("❌ CPF inválido. Digite os 11 dígitos.");
      return;
    }
    setError(null);
    setCpfConfirmado(true);
    setStatus("CPF confirmado. Você não poderá editar o CPF depois.");
  };

  const handleEnviarCodigoEmail = async () => {
    setError(null);
    setStatus("Enviando código para o e-mail...");
    setLoadingCodigo(true);
    try {
      const codigo = await enviarEmailCodigo(
        email,
        "email",
        (titulo, msg) => setStatus(`${titulo}: ${msg}`),
        (titulo, msg) => setError(`${titulo}: ${msg}`)
      );
      if (codigo) {
        setCodigoGerado(codigo);
        setStep(2);
        setStatus("Código enviado. Verifique sua caixa de entrada.");
        setTimeCodigo(300);
      }
    } catch {
      setError("❌ Erro ao enviar código por e-mail.");
    } finally {
      setLoadingCodigo(false);
    }
  };

  const handleEnviarCodigoSms = async () => {
    if (timeReenvio > 0) return;

    setError(null);
    setStatus("Enviando código por SMS...");
    setLoadingCodigo(true);
    try {
      const telefoneParaEnvio = formatarTelefoneParaEnvio(telefone);
      const codigo = await enviarSmsCodigo(telefoneParaEnvio);
      if (codigo) {
        setCodigoGerado(codigo);
        setStep(3);
        setStatus("Código enviado por SMS.");
        setTimeCodigo(300);
        setTimeReenvio(80);
      }
    } catch {
      setError("❌ Erro ao enviar código por SMS.");
    } finally {
      setLoadingCodigo(false);
    }
  };

  const handleValidarEmail = () => {
    setError(null);
    if (codigo.trim() === String(codigoGerado)) {
      setCodigo("");
      setStep(telefoneAlterado ? 3 : 4);
      setTimeCodigo(0);
    } else {
      setError("❌ Código inválido.");
    }
  };

  const handleValidarSms = () => {
    setError(null);
    if (codigo.trim() === String(codigoGerado)) {
      setCodigo("");
      setStep(4);
      setTimeCodigo(0);
    } else {
      setError("❌ Código inválido.");
    }
  };

  const handleSalvar = async () => {
    setError(null);
    setStatus("Salvando dados...");
    setLoadingSalvar(true);

    try {
      if (!docId) {
        setError("❌ Documento do usuário não encontrado.");
        setStatus(null);
        setLoadingSalvar(false);
        return;
      }

      const telefoneParaSalvar = formatarTelefoneParaEnvio(telefone);

      const cpfParaSalvar = usuario?.cpf ? usuario.cpf : cpf.replace(/\D/g, "");

      const novosDados = {
        nome,
        email,
        telefone: telefoneParaSalvar,
        cpf: cpfParaSalvar,
      };

      const atualizado = await atualizarUsuario(docId, novosDados);

      if (!atualizado) {
        setError("❌ Falha ao atualizar dados.");
        setStatus(null);
        setLoadingSalvar(false);
        return;
      }

      if (auth.currentUser) {
        try {
          if (nome && nome !== auth.currentUser.displayName) {
            await updateProfile(auth.currentUser, { displayName: nome });
          }
        } catch (e) {
          console.warn("Falha ao atualizar displayName no Auth.", e);
        }

        if (emailAlterado) {
          try {
            await updateEmail(auth.currentUser, email);
          } catch (e) {
            setError(
              "❌ Erro ao atualizar o e-mail na autenticação. Você pode precisar fazer login novamente: " +
                e.message
            );
            setStatus(null);
            setLoadingSalvar(false);
            return;
          }
        }
      }

      const dadosParaContexto = {
        ...usuario,
        nome,
        email,
        telefone: telefoneParaSalvar,
        cpf: cpfParaSalvar,
      };

      if (typeof atualizarUsuarioContext === "function") {
        atualizarUsuarioContext(dadosParaContexto);
      } else {
        console.warn("atualizarUsuarioContext não é uma função");
      }

      setSucesso(true);
      setError(null);
      setStatus(null);
      setLoadingSalvar(false);

      window.location.reload();

    } catch (e) {
      setError("❌ Erro ao salvar dados.");
      setStatus(null);
      setLoadingSalvar(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Editar dados</h1>

      {error && <p className={styles.error}>{error}</p>}
      {status && <p className={styles.status}>{status}</p>}
      {sucesso && <p className={styles.sucesso}>✔ Dados atualizados com sucesso! Você pode fechar a janela.</p>}

      {step === 1 && (
        <>
          <label className={styles.label}>Nome</label>
          <input
            className={styles.input}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />

          <label className={styles.label}>CPF</label>
          <input
            className={styles.input}
            type="text"
            value={cpf}
            onChange={(e) => {
              if (!cpfEditavel) return;
              setCpf(formatarCpf(e.target.value));
            }}
            disabled={!cpfEditavel}
            maxLength={14}
            placeholder="000.000.000-00"
          />

          {!cpfConfirmado && cpf.replace(/\D/g, "").length === 11 && (
            <div className={styles.confirmCpfMessage}>
              <p>
                ⚠️ Você não poderá editar o CPF depois de confirmar. Confirma que este CPF está correto?
              </p>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirmarCpf}
                disabled={loadingSalvar || loadingCodigo}
              >
                Confirmar CPF
              </button>
            </div>
          )}

          <label className={styles.label}>E-mail</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className={styles.label}>Telefone</label>
          <input
            className={styles.input}
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
          />

          <div className={styles.botoes}>
            <button
              className={styles.continueBtn}
              onClick={() => {
                if (!cpfConfirmado && cpf.replace(/\D/g, "").length === 11) {
                  setError("❌ Confirme o CPF antes de continuar.");
                  return;
                }

                if (emailAlterado) {
                  handleEnviarCodigoEmail();
                } else if (telefoneAlterado) {
                  handleEnviarCodigoSms();
                } else {
                  setStep(4);
                }
              }}
              disabled={
                loadingCodigo ||
                loadingSalvar ||
                timeReenvio > 0 ||
                (!cpfConfirmado && cpf.replace(/\D/g, "").length === 11)
              }
            >
              Avançar
            </button>

            <button
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loadingCodigo || loadingSalvar}
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className={styles.label}>Código enviado para o e-mail {email}</p>
          <input
            className={styles.input}
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={6}
            autoFocus
          />
          <div className={styles.botoes}>
            <button className={styles.continueBtn} onClick={handleValidarEmail} disabled={loadingSalvar}>
              Validar Código
            </button>
            <button
              className={styles.continueBtn}
              onClick={handleEnviarCodigoEmail}
              disabled={loadingCodigo || loadingSalvar}
            >
              Reenviar Código
            </button>
            <button className={styles.cancelBtn} onClick={() => setStep(1)} disabled={loadingSalvar}>
              Voltar
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className={styles.label}>Código enviado para o telefone {telefone}</p>
          <input
            className={styles.input}
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={6}
            autoFocus
          />
          <div className={styles.botoes}>
            <button className={styles.continueBtn} onClick={handleValidarSms} disabled={loadingSalvar}>
              Validar Código
            </button>
            <button
              className={styles.continueBtn}
              onClick={handleEnviarCodigoSms}
              disabled={loadingCodigo || loadingSalvar || timeReenvio > 0}
            >
              {timeReenvio > 0 ? `Reenviar SMS em ${timeReenvio}s` : "Reenviar Código"}
            </button>
            <button className={styles.cancelBtn} onClick={() => setStep(emailAlterado ? 2 : 1)} disabled={loadingSalvar}>
              Voltar
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p className={styles.label}>Confirme os dados e clique em salvar.</p>
          <div className={styles.dadosResumo}>
            <p><strong>Nome:</strong> {nome}</p>
            <p><strong>CPF:</strong> {cpf}</p>
            <p><strong>E-mail:</strong> {email}</p>
            <p><strong>Telefone:</strong> {telefone}</p>
          </div>
          <div className={styles.botoes}>
            <button className={styles.continueBtn} onClick={handleSalvar} disabled={loadingSalvar}>
              {loadingSalvar ? "Salvando..." : "Salvar"}
            </button>
            <button className={styles.cancelBtn} onClick={() => setStep(1)} disabled={loadingSalvar}>
              Voltar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
