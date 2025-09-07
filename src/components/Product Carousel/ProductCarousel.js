import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import styles from "./productcarousel.module.css";
import useSliderConfig from "../../hooks/useSliderConfig";
import ProductCard from "../Product Card/ProductCard";

export default function ProductCarousel({ title, products, sectionPath }) {
  const navigate = useNavigate();
  const settings = useSliderConfig();

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <button onClick={() => navigate(sectionPath)} className={styles.verMais}>
          <span className={styles.circle}>›</span>
          <span>Ver mais</span>
        </button>
      </div>

      <Slider {...settings}>
        {products.map((item) => (
          <ProductCard key={item.id} produto={item} />
        ))}
      </Slider>
    </div>
  );
}