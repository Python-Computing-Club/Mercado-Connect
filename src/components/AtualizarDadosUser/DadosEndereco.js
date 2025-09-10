import React, { useState, useEffect } from "react";
import styles from "./DadosEndereco.module.css";
import { atualizarUsuario, buscarUsuario } from "../../services/firestore/usuarios";
import { useAuth } from "../../Context/AuthContext";
import FormatCEP from "../../hooks/FormatCEP";
import consultarCEP from "../../hooks/useValidarEndereco";
import AddressPicker from "../../hooks/AddressPicker";

export default function DadosEndereco({ onClose }) {
  const { usuario } = useAuth();

  const [docId, setDocId] = useState(null);
  const [step, setStep] = useState(1);

  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    lat: null,
    lng: null,
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

  useEffect(() => {
    const cepLimpo = endereco.cep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      setCarregando(true);
      consultarCEP(cepLimpo, (tipo, msg) => {
        setMensagem(msg);
        setCarregando(false);
      })
        .then(async (dados) => {
          if (dados) {
            let lat = null;
            let lng = null;
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${cepLimpo}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
              );
              const result = await response.json();
              if (result.status === "OK" && result.results[0]) {
                lat = result.results[0].geometry.location.lat;
                lng = result.results[0].geometry.location.lng;
              }
            } catch (err) {
              console.error("Erro ao buscar coordenadas do CEP:", err);
            }

            setEndereco((prev) => ({
              ...prev,
              rua: dados.logradouro || "",
              bairro: dados.bairro || "",
              cidade: dados.localidade || "",
              estado: dados.uf || "",
              lat,
              lng,
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

  const handleChange = (campo, valor) => {
    if (campo === "cep") valor = FormatCEP(valor);
    setEndereco((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleContinue = () => {
    const camposObrigatorios = ["cep", "rua", "numero", "bairro", "cidade", "estado"];
    for (let campo of camposObrigatorios) {
      if (!endereco[campo] || endereco[campo].trim() === "") {
        setMensagem(`Por favor, preencha o campo ${campo.toUpperCase()}.`);
        return;
      }
    }
    setMensagem("");
    setStep(2);
  };

  const handleSalvar = async () => {
    if (!docId) {
      setMensagem("ID do usuário não encontrado.");
      return;
    }

    setCarregando(true);

    try {
      const novosEnderecos = Array.isArray(usuario?.enderecos)
        ? [...usuario.enderecos, endereco]
        : [endereco];

      const sucesso = await atualizarUsuario(docId, {
        enderecos: novosEnderecos,
      });

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
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <div className={styles.container}>
          {step === 1 && (
            <>
              <h2>Adicionar Novo Endereço</h2>

              <label>
                CEP:
                <input
                  className={styles.input}
                  value={endereco.cep}
                  maxLength={9}
                  onChange={(e) => handleChange("cep", e.target.value)}
                />
              </label>

              <label>
                Rua:
                <input
                  className={styles.input}
                  value={endereco.rua}
                  onChange={(e) => handleChange("rua", e.target.value)}
                />
              </label>

              <label>
                Número:
                <input
                  className={styles.input}
                  value={endereco.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                />
              </label>

              <label>
                Bairro:
                <input
                  className={styles.input}
                  value={endereco.bairro}
                  onChange={(e) => handleChange("bairro", e.target.value)}
                />
              </label>

              <label>
                Cidade:
                <input
                  className={styles.input}
                  value={endereco.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                />
              </label>

              <label>
                Estado:
                <input
                  className={styles.input}
                  maxLength={2}
                  value={endereco.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
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
                onClick={handleContinue}
                disabled={carregando}
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Confirme no mapa</h2>

              <AddressPicker
                initialAddress={endereco.rua}
                initialPosition={
                  endereco.lat && endereco.lng
                    ? { lat: endereco.lat, lng: endereco.lng }
                    : null
                }
                onChange={({ address, position, rua, bairro, cidade, estado, cep, numero }) => {
                  setEndereco((prev) => ({
                    ...prev,
                    rua: rua || prev.rua,
                    bairro: bairro || prev.bairro,
                    cidade: cidade || prev.cidade,
                    estado: estado || prev.estado,
                    cep: cep || prev.cep,
                    numero: numero || prev.numero,
                    lat: position?.lat,
                    lng: position?.lng,
                  }));
                }}
              />

              <button
                className={styles.continueBtn}
                onClick={handleSalvar}
                disabled={carregando}
              >
                {carregando ? "Salvando..." : "Confirmar Endereço"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
