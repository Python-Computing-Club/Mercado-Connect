import { useState } from "react";
import styles from "./productmodal.module.css";

export default function ProductModal({ produto, onClose, onAddToCart }) {
  const [quantidade, setQuantidade] = useState(1);
  const estoqueDisponivel = produto.quantidade || 1;

  const handleChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > estoqueDisponivel) {
      setQuantidade(estoqueDisponivel);
    } else if (value < 1 || isNaN(value)) {
      setQuantidade(1);
    } else {
      setQuantidade(value);
    }
  };

  const handleAdicionar = () => {
    onAddToCart(produto, quantidade);
    onClose();
  };

  const hasDiscount =
    typeof produto.preco_final === "number" &&
    produto.preco_final > 0 &&
    produto.preco_final < produto.preco;

  const volumeUnidade =
    produto.volume && produto.unidade_de_medida
      ? `(${produto.volume}${produto.unidade_de_medida})`
      : "";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <img
          src={produto.imagemUrl || "https://via.placeholder.com/300"}
          alt={produto.nome}
          className={styles.image}
        />

        <h2>{produto.nome}</h2>

        {produto.marca && (
          <p className={styles.details}>
            <strong>Marca:</strong> {produto.marca}
          </p>
        )}

        <div className={styles.price}>
          {hasDiscount ? (
            <>
              <span className={styles.oldPrice}>
                R$ {produto.preco.toFixed(2).replace(".", ",")}
              </span>
              <span className={styles.discountedPrice}>
                R$ {produto.preco_final.toFixed(2).replace(".", ",")}
              </span>
            </>
          ) : (
            <span>
              R$ {produto.preco.toFixed(2).replace(".", ",")}
            </span>
          )}
          {volumeUnidade && (
            <span className={styles.volumeUnidade}>{volumeUnidade}</span>
          )}
        </div>

        {produto.categoria && (
          <p className={styles.details}>
            <strong>Categoria:</strong> {produto.categoria}
          </p>
        )}

        {produto.descricao && (
          <p className={styles.details}>
            <strong>Descrição:</strong> {produto.descricao}
          </p>
        )}

        <div className={styles.controls}>
          <label htmlFor="quantidade">Quantidade:</label>
          <input
            id="quantidade"
            type="number"
            min="1"
            max={estoqueDisponivel}
            value={quantidade}
            onChange={handleChange}
          />
          <button className={styles.addButton} onClick={handleAdicionar}>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}