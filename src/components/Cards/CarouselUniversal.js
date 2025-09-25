import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import { MdArrowCircleRight } from "react-icons/md";
import CardHome from "./CardHome";
import styles from "./carouseluniversal.module.css";
import useSliderConfig from "../../hooks/useSliderConfig";

export default function CarouselUniversal({
  title,
  items,
  sectionPath,
  type,
  onCardClick,
  onAddClick,
}) {
  const navigate = useNavigate();
  const settings = useSliderConfig(items?.length || 0);

  if (!items || items.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {sectionPath && (
          <button
            onClick={() => navigate(sectionPath)}
            className={styles.verMais}
            aria-label="Ver mais"
          >
            <span>Ver mais</span>
            <MdArrowCircleRight className={styles.icon} />
          </button>
        )}
      </div>

      <Slider {...settings} className={styles.sliderWrapper}>
        {items.map((item) => (
          <div key={item.id} className={styles.cardWrapper}>
            <CardHome
              item={item}
              type={type}
              onClick={() => onCardClick?.(item)}
              onAddClick={onAddClick}
            />
          </div>
        ))}
      </Slider>
    </div>
  );
}
