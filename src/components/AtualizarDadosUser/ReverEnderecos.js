import React, { useState, useEffect, useMemo } from "react";
import styles from "./ReverEnderecos.module.css";
import { useAuth } from "../../Context/AuthContext";

const ENDERECOS_POR_PAGINA = 3;

export default function ReverEnderecos({ onClose }) {
  const { usuario } = useAuth();

  // ✅ useMemo garante que "enderecos" só muda quando usuario.enderecos mudar
  const enderecos = useMemo(
    () => (Array.isArray(usuario?.enderecos) ? usuario.enderecos : []),
    [usuario?.enderecos]
  );

  const [paginaAtual, setPaginaAtual] = useState(0);

  // ✅ Agora o ESLint não reclama, pois dependemos de usuario?.enderecos
  useEffect(() => {
    setPaginaAtual(0);
  }, [usuario?.enderecos]);

  const totalPaginas = Math.ceil(enderecos.length / ENDERECOS_POR_PAGINA);
  const inicio = paginaAtual * ENDERECOS_POR_PAGINA;
  const fim = inicio + ENDERECOS_POR_PAGINA;
  const enderecosPagina = enderecos.slice(inicio, fim);

  const fecharModal = (e) => {
    if (e.target.classList.contains(styles.overlay)) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={fecharModal}>
      <div className={styles.painel} onClick={(e) => e.stopPropagation()}>
        <h2>Endereços Cadastrados</h2>

        {enderecos.length === 0 ? (
          <p>Nenhum endereço cadastrado.</p>
        ) : (
          <>
            <ul className={styles.listaEnderecos}>
              {enderecosPagina.map((endereco, index) => (
                <li key={inicio + index} className={styles.cardEndereco}>
                  <p><strong>CEP:</strong> {endereco.cep}</p>
                  <p>
                    <strong>Rua:</strong> {endereco.rua}, <strong>Nº:</strong> {endereco.numero}
                  </p>
                  <p><strong>Bairro:</strong> {endereco.bairro}</p>
                  <p>
                    <strong>Cidade:</strong> {endereco.cidade} - <strong>Estado:</strong> {endereco.estado}
                  </p>
                </li>
              ))}
            </ul>

            <div className={styles.paginacao}>
              <button
                className={styles.botaoPagina}
                disabled={paginaAtual === 0 || enderecos.length === 0}
                onClick={() => setPaginaAtual(paginaAtual - 1)}
              >
                ← Anterior
              </button>

              <span>
                Página {totalPaginas === 0 ? 0 : paginaAtual + 1} de {totalPaginas}
              </span>

              <button
                className={styles.botaoPagina}
                disabled={paginaAtual >= totalPaginas - 1 || enderecos.length === 0}
                onClick={() => setPaginaAtual(paginaAtual + 1)}
              >
                Próximo →
              </button>
            </div>
          </>
        )}

        <button className={styles.botaoFechar} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}