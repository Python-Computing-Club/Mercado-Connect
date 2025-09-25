import { FiPlus, FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import styles from "./cardcategoria.module.css";
import { useFavoritos } from "../../Context/FavoritosContext";

export default function CardCategoria({ item, onClick }) {
  const { toggleFavoritoProduto, isFavoritoProduto } = useFavoritos();

  if (!item) return null;

  const imagemSrc =
    item.imagemUrl ||
    "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg";

  return (
    <div className={styles.card} onClick={() => onClick?.(item)}>
      <button
        className={styles.favoriteButton}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavoritoProduto(item);
        }}
      >
        {isFavoritoProduto(item.id) ? <FaHeart color="red" /> : <FiHeart color="gray" />}
      </button>

      <button
        className={styles.addButton}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(item);
        }}
      >
        <FiPlus />
      </button>

      <img src={imagemSrc} alt={item.nome || "Produto"} className={styles.image} />

      <div className={styles.info}>
        <p className={styles.name}>{item.nome || "Produto sem nome"}</p>

        {item.descricao && (
          <p className={styles.description}>
            {item.descricao.length > 60 ? item.descricao.slice(0, 60) + "..." : item.descricao}
          </p>
        )}

        <div className={styles.priceBlock}>
          {item.preco_final && item.preco_final < item.preco ? (
            <>
              <span className={styles.oldPrice}>
                R$ {item.preco?.toFixed(2).replace(".", ",")}
              </span>
              <span className={styles.discountedPrice}>
                R$ {item.preco_final?.toFixed(2).replace(".", ",")}
              </span>
            </>
          ) : (
            <span className={styles.normalPrice}>
              R$ {item.preco?.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}