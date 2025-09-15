import { useState } from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import styles from "./productcarousel.module.css";
import useSliderConfig from "../../hooks/useSliderConfig";
import ProductCard from "../Product Card/ProductCard";
import ProductModal from "../../modal/ProductModal";
import { useCart } from "../../Context/CartContext";

export default function ProductCarousel({ title, products, sectionPath }) {
  const navigate = useNavigate();
  const settings = useSliderConfig();

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const { addItem } = useCart();

  const handleCardClick = (produto) => {
    setProdutoSelecionado(produto);
  };

  const handleFecharModal = () => {
    setProdutoSelecionado(null);
  };

  const handleAdicionarAoCarrinho = (produto, quantidade) => {
    addItem(produto, quantidade);
    console.log("Produto adicionado:", produto.nome, "Quantidade:", quantidade);
  };

  if (!products || products.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <button onClick={() => navigate(sectionPath)} className={styles.verMais}>
          <span className={styles.circle}>›</span>
          <span>Ver mais</span>
        </button>
      </div>

      <Slider {...settings} className={styles.sliderWrapper}>
        {products.map((item) => (
          <div
            key={item.id}
            className={styles.cardWrapper}
            onClick={() => handleCardClick(item)}
          >
            <ProductCard produto={item} />
          </div>
        ))}
      </Slider>

      {produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          onClose={handleFecharModal}
          onAddToCart={handleAdicionarAoCarrinho}
        />
      )}
    </div>
  );
}
