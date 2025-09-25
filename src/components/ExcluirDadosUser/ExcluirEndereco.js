import React, { useState, useEffect } from "react";
import styles from "./ExcluirEndereco.module.css";
import { useAuth } from "../../Context/AuthContext";
import { atualizarUsuario } from "../../services/firestore/usuarios";

export default function ExcluirEnderecos({ onClose }) {
  const { usuario } = useAuth();
  const [enderecos, setEnderecos] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [carregandoIndex, setCarregandoIndex] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(0);
  const ENDERECOS_POR_PAGINA = 1;

  useEffect(() => {
    if (!usuario) {
      setError("❌ Usuário não autenticado.");
      setEnderecos([]);
      return;
    }

    if (!usuario.enderecos || usuario.enderecos.length === 0) {
      setStatus("Você ainda não cadastrou nenhum endereço.");
      setEnderecos([]);
      return;
    }

    setEnderecos(usuario.enderecos);
    setStatus(null);
    setError(null);
    setPaginaAtual(0);
  }, [usuario]);

  async function handleExcluir(indexGlobal) {
    if (!usuario) {
      setError("❌ Usuário não autenticado.");
      return;
    }

    setCarregandoIndex(indexGlobal);
    setError(null);
    setStatus(null);

    try {
      const novosEnderecos = [...enderecos];
      novosEnderecos.splice(indexGlobal, 1);

      const sucesso = await atualizarUsuario(usuario.id, { enderecos: novosEnderecos });

      if (sucesso) {
        localStorage.setItem(
          "userSession",
          JSON.stringify({ ...usuario, enderecos: novosEnderecos })
        );

        setEnderecos(novosEnderecos);

        if (novosEnderecos.length === 0) {
          setStatus("Nenhum endereço cadastrado.");
        }

        const ultimaPagina = Math.max(0, Math.ceil(novosEnderecos.length / ENDERECOS_POR_PAGINA) - 1);
        if (paginaAtual > ultimaPagina) {
          setPaginaAtual(ultimaPagina);
        }

        window.location.reload();
      } else {
        setError("Erro ao excluir o endereço.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao excluir o endereço.");
    } finally {
      setCarregandoIndex(null);
    }
  }

  const inicio = paginaAtual * ENDERECOS_POR_PAGINA;
  const fim = inicio + ENDERECOS_POR_PAGINA;
  const enderecosPagina = enderecos.slice(inicio, fim);
  const totalPaginas = Math.ceil(enderecos.length / ENDERECOS_POR_PAGINA);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.painel} onClick={e => e.stopPropagation()}>
        <h2>Endereços cadastrados</h2>

        {error && <p className={styles.error}>{error}</p>}
        {status && <p className={styles.status}>{status}</p>}

        {enderecos.length > 0 && (
          <>
            <ul className={styles.listaEnderecos}>
              {enderecosPagina.map((endereco, index) => {
                const indexGlobal = inicio + index;
                return (
                  <li key={indexGlobal} className={styles.cardEndereco}>
                    <div className={styles.infoEndereco}>
                      <p><strong>CEP:</strong> {endereco.cep}</p>
                      <p><strong>Rua:</strong> {endereco.rua}</p>
                      <p><strong>Número:</strong> {endereco.numero}</p>
                      <p><strong>Bairro:</strong> {endereco.bairro}</p>
                      <p><strong>Cidade:</strong> {endereco.cidade}</p>
                      <p><strong>Estado:</strong> {endereco.estado}</p>
                    </div>
                    <button
                      className={styles.botaoExcluir}
                      onClick={() => handleExcluir(indexGlobal)}
                      disabled={carregandoIndex !== null && carregandoIndex !== indexGlobal}
                    >
                      {carregandoIndex === indexGlobal ? "Excluindo..." : "Excluir"}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button
                onClick={() => setPaginaAtual((p) => Math.max(p - 1, 0))}
                disabled={paginaAtual === 0}
                className={styles.botaoPagina}
              >
                ← Anterior
              </button>
              <span>
                Página {paginaAtual + 1} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas - 1))}
                disabled={paginaAtual >= totalPaginas - 1}
                className={styles.botaoPagina}
              >
                Próximo →
              </button>
            </div>
          </>
        )}

        <button className={styles.botaoCancelar} onClick={onClose} style={{ marginTop: 20 }}>
          Fechar
        </button>
      </div>
    </div>
  );
}
