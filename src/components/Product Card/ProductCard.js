import styles from "./productcard.module.css";

export default function ProductCard({ produto }) {
  const imagemPath =
    produto.imagemUrl ||
    "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg";

  const hasDiscount =
    typeof produto.preco_final === "number" &&
    produto.preco_final > 0 &&
    produto.preco_final < produto.preco;

  const volumeUnidade =
    produto.volume && produto.unidade_de_medida
      ? `(${produto.volume}${produto.unidade_de_medida})`
      : "";

  const descricaoCurta =
    produto.descricao && produto.descricao.length > 60
      ? produto.descricao.slice(0, 60) + "..."
      : produto.descricao;

  return (
    <div className={styles.card}>
      <img src={imagemPath} alt={produto.nome} className={styles.image} />
      <div className={styles.info}>
        <p className={styles.name}>{produto.nome}</p>
        {produto.marca && <p className={styles.marca}>{produto.marca}</p>}
        {descricaoCurta && (
          <p className={styles.description}>{descricaoCurta}</p>
        )}

        <div className={styles.priceBlock}>
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
            <span className={styles.normalPrice}>
              R$ {produto.preco.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>

        {volumeUnidade && (
          <span className={styles.volumeUnidade}>{volumeUnidade}</span>
        )}
      </div>
      <button className={styles.addButton}>+</button>
    </div>
  );
}