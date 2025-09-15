import styles from "./productcard.module.css";

export default function ProductCard({ produto }) {
  const imagemPath = produto.imagemUrl || "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg";

  const hasDiscount =
    typeof produto.preco_final === "number" &&
    produto.preco_final > 0 &&
    produto.preco_final < produto.preco;

  // Monta a string do volume e unidade, ex: (10kg)
  const volumeUnidade = produto.volume && produto.unidade_de_medida
    ? `(${produto.volume}${produto.unidade_de_medida})`
    : "";

  return (
    <div className={styles.card}>
      <img src={imagemPath} alt={produto.nome} className={styles.image} />
      <div className={styles.info}>
        <p className={styles.name}>{produto.nome}</p>
        
        {/* Marca do produto */}
        {produto.marca && <p className={styles.marca}>Marca: {produto.marca}</p>}

        <p className={styles.price}>
          {hasDiscount ? (
            <>
              <span className={styles.oldPrice}>
                R$ {produto.preco.toFixed(2).replace(".", ",")}
              </span>{" "}
              <span className={styles.discountedPrice}>
                R$ {produto.preco_final.toFixed(2).replace(".", ",")}
              </span>
            </>
          ) : (
            <>R$ {produto.preco.toFixed(2).replace(".", ",")}</>
          )}

          {/* Volume + unidade junto do preço */}
          {volumeUnidade && <span className={styles.volumeUnidade}> {volumeUnidade}</span>}
        </p>
      </div>
    </div>
  );
}
