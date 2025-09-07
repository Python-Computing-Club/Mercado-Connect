import React, { useState, useEffect } from "react";
import DadosConta from "../AtualizarDadosUser/DadosConta";
import ExcluirConta from "../ExcluirDadosUser/ExcluirConta";
import styles from "./PainelCadastral.module.css";

export default function PainelDadosCadastrais({ usuario, onClose }) {
  const [mostrarDados, setMostrarDados] = useState(false);
  const [mostrarExcluir, setMostrarExcluir] = useState(false);

  useEffect(() => {
    if (!onClose) return;
    return () => {
      setMostrarDados(false);
      setMostrarExcluir(false);
    };
  }, [onClose]);

  const fecharTudo = () => {
    setMostrarDados(false);
    setMostrarExcluir(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={fecharTudo}>
      {!mostrarDados && !mostrarExcluir && (
        <div
          className={styles.botoesContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={fecharTudo}>
            &times;
          </button>

          <button
            className={styles.botaoPrincipal}
            onClick={() => setMostrarDados(true)}
          >
            Editar dados da conta
          </button>

          <button
            className={styles.botaoExcluir}
            onClick={() => setMostrarExcluir(true)}
          >
            Excluir conta
          </button>
        </div>
      )}

      {mostrarDados && (
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={fecharTudo}>
            &times;
          </button>
          <DadosConta usuario={usuario} onClose={fecharTudo} />
        </div>
      )}

      {mostrarExcluir && (
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={fecharTudo}>
            &times;
          </button>
          <ExcluirConta usuario={usuario} onClose={fecharTudo} />
        </div>
      )}
    </div>
  );
}
