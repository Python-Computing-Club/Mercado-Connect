import styles from "./productcard.module.css";

export default function ProductCard({ produto }) {
  const nomeImagem = produto.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "") + ".jpeg";

  let imagemPath;
  try {
    imagemPath = require(`../../assets/produtos/${nomeImagem}`);
  } catch {
    imagemPath = require(`../../assets/produtos/placeholder.jpeg`);
  }

  return (
    <div className={styles.card}>
      <img src={imagemPath} alt={produto.nome} className={styles.image} />
      <div className={styles.info}>
        <p className={styles.name}>{produto.nome}</p>
        <p className={styles.price}>R$ {produto.preco.toFixed(2)}</p>
      </div>
    </div>
  );
}