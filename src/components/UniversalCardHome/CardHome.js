import { useNavigate } from "react-router-dom";
import styles from "./cardhome.module.css";
import { FiPlus } from "react-icons/fi";

export default function CardHome({ item, type, onClick, onAddClick }) {
  const navigate = useNavigate();

  // Proteção contra item indefinido
  if (!item) {
    return (
      <div className={styles.card}>
        <img
          src="https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg"
          alt="Carregando..."
          className={styles.image}
        />
        <div className={styles.info}>
          <p className={styles.name}>Carregando...</p>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (type === "produto") {
      onClick?.(item);
    } else {
      navigate(`/mercado/${item.id}`);
    }
  };

  const imagemSrc =
    type === "produto"
      ? item.imagemUrl || "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg"
      : item.logo?.url || "/placeholder.png";

  const altText =
    type === "produto"
      ? item.nome || "Produto"
      : `Logo de ${item.estabelecimento || "Mercado"}`;

  return (
    <div className={styles.card} onClick={handleClick}>
      {type === "produto" && (
        <button
          className={styles.addButton}
          onClick={(e) => {
            e.stopPropagation();
            onAddClick?.(item);
          }}
        >
          <FiPlus />
        </button>
      )}

      <img src={imagemSrc} alt={altText} className={styles.image} />

      <div className={styles.info}>
        {type === "produto" ? (
          <>
            <p className={styles.name}>{item.nome || "Produto sem nome"}</p>
            {item.marca && <p className={styles.marca}>{item.marca}</p>}
            {item.descricao && (
              <p className={styles.description}>
                {item.descricao.length > 60
                  ? item.descricao.slice(0, 60) + "..."
                  : item.descricao}
              </p>
            )}
            <div className={styles.priceBlock}>
              {item.preco_final &&
              item.preco_final > 0 &&
              item.preco_final < item.preco ? (
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
          </>
        ) : (
          <>
            <p className={styles.name}>
              {item.estabelecimento || "Mercado sem nome"}
            </p>
            <p className={styles.local}>
              {item.endereco?.cidade || "Cidade desconhecida"},{" "}
              {item.endereco?.estado || "Estado"}
            </p>
            <p className={styles.nota}>
              ⭐{" "}
              {item.nota
                ? item.nota.toFixed(1)
                : <span className={styles.semNota}>Sem nota</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
}