import React, { useState, useEffect } from "react";
import DadosEndereco from "../AtualizarDadosUser/DadosEndereco";
import ExcluirEndereco from "../ExcluirDadosUser/ExcluirEndereco";
import ReverEnderecos from "../AtualizarDadosUser/ReverEnderecos";
import styles from "./PainelCadastral.module.css";

export default function PainelEnderecos({ usuario, onClose }) {
  const [modalAberto, setModalAberto] = useState(null);

  useEffect(() => {
    if (!onClose) return;
    return () => {
      setModalAberto(null);
    };
  }, [onClose]);

  const fecharTudo = () => {
    setModalAberto(null);
    onClose();
  };

  return (
    <>
      {!modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharTudo}>
          <div className={styles.botoesContainer} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={fecharTudo}>
              &times;
            </button>

            <button className={styles.botaoPrincipal} onClick={() => setModalAberto("rever")}>
              Ver endereços cadastrados
            </button>

            <button className={styles.botaoPrincipal} onClick={() => setModalAberto("dados")}>
              Adicionar novo endereço
            </button>

            <button className={styles.botaoExcluir} onClick={() => setModalAberto("excluir")}>
              Excluir endereço
            </button>
          </div>
        </div>
      )}

      {modalAberto === "rever" && (
        <ReverEnderecos usuario={usuario} onClose={fecharTudo} />
      )}

      {modalAberto === "dados" && (
        <DadosEndereco usuario={usuario} onClose={fecharTudo} />
      )}

      {modalAberto === "excluir" && (
        <ExcluirEndereco usuario={usuario} onClose={fecharTudo} />
      )}
    </>
  );
}
