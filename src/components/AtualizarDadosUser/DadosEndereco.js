import React, { useState, useEffect } from "react";
import styles from "./DadosEndereco.module.css";
import { atualizarUsuario, buscarUsuario } from "../../services/firestore/usuarios";
import { useAuth } from "../../Context/AuthContext";
import FormatCEP from "../../hooks/FormatCEP";
import consultarCEP from "../../hooks/useValidarEndereco";

export default function DadosEndereco({ onClose }) {
  const { usuario } = useAuth();

  const [docId, setDocId] = useState(null);
  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function fetchDocId() {
      if (!usuario?.email) return;
      const userDoc = await buscarUsuario(usuario.email, "email");
      if (userDoc) setDocId(userDoc.id);
    }
    fetchDocId();
  }, [usuario]);

  const handleChange = (campo, valor) => {
    if (campo === "cep") {
      valor = FormatCEP(valor);
    }
    setEndereco((prev) => ({ ...prev, [campo]: valor }));
  };

  useEffect(() => {
    const cepLimpo = endereco.cep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      setCarregando(true);
      consultarCEP(cepLimpo, (tipo, msg) => {
        setMensagem(msg);
        setCarregando(false);
      })
        .then((dados) => {
          if (dados) {
            setEndereco((prev) => ({
              ...prev,
              rua: dados.logradouro || "",
              bairro: dados.bairro || "",
              cidade: dados.localidade || "",
              estado: dados.uf || "",
            }));
            setMensagem("");
          }
          setCarregando(false);
        })
        .catch(() => {
          setCarregando(false);
          setMensagem("Erro ao consultar CEP.");
        });
    }
  }, [endereco.cep]);

  const handleSalvar = async () => {
    if (!docId) {
      setMensagem("ID do usuário não encontrado.");
      return;
    }

    const camposObrigatorios = ["cep", "rua", "numero", "bairro", "cidade", "estado"];
    for (let campo of camposObrigatorios) {
      if (!endereco[campo] || endereco[campo].trim() === "") {
        setMensagem(`Por favor, preencha o campo ${campo.toUpperCase()}.`);
        return;
      }
    }

    setCarregando(true);

    try {
      const novosEnderecos = Array.isArray(usuario?.enderecos)
        ? [...usuario.enderecos, endereco]
        : [endereco];

      const sucesso = await atualizarUsuario(docId, { enderecos: novosEnderecos });

      if (sucesso) {
        const usuarioAtualizado = await buscarUsuario(usuario.email, "email");

        if (usuarioAtualizado) {
          localStorage.setItem("userSession", JSON.stringify(usuarioAtualizado));
          setMensagem("Endereço adicionado com sucesso.");
          window.location.reload();
        } else {
          setMensagem("Endereço salvo, mas erro ao atualizar dados.");
        }
      } else {
        setMensagem("Erro ao salvar o endereço.");
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao salvar o endereço.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalPanel}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
        <div className={styles.container}>
          <h2>Adicionar Novo Endereço</h2>

          <label>
            CEP:
            <input
              className={styles.input}
              type="text"
              value={endereco.cep}
              maxLength={9}
              onChange={(e) => handleChange("cep", e.target.value)}
            />
          </label>

          <label>
            Rua:
            <input
              className={styles.input}
              type="text"
              value={endereco.rua}
              onChange={(e) => handleChange("rua", e.target.value)}
            />
          </label>

          <label>
            Número:
            <input
              className={styles.input}
              type="text"
              value={endereco.numero}
              onChange={(e) => handleChange("numero", e.target.value)}
            />
          </label>

          <label>
            Bairro:
            <input
              className={styles.input}
              type="text"
              value={endereco.bairro}
              onChange={(e) => handleChange("bairro", e.target.value)}
            />
          </label>

          <label>
            Cidade:
            <input
              className={styles.input}
              type="text"
              value={endereco.cidade}
              onChange={(e) => handleChange("cidade", e.target.value)}
            />
          </label>

          <label>
            Estado:
            <input
              className={styles.input}
              type="text"
              value={endereco.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              maxLength={2}
            />
          </label>

          {mensagem && (
            <p
              className={
                mensagem.toLowerCase().includes("erro")
                  ? styles.error
                  : styles.status
              }
            >
              {mensagem}
            </p>
          )}

          <button
            className={styles.continueBtn}
            onClick={handleSalvar}
            disabled={carregando}
          >
            {carregando ? "Salvando..." : "Salvar Endereço"}
          </button>
        </div>
      </div>
    </div>
  );
}
