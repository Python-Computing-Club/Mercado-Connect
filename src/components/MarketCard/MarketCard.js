import styles from "./marketcard.module.css";
import { useNavigate } from "react-router-dom";

export default function MarketCard({ mercado }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/mercado/${mercado.id}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <img
        src={mercado.logoUrl || "/placeholder.png"}
        alt={mercado.nome}
        className={styles.logo}
      />
      <p className={styles.name}>{mercado.nome}</p>
    </div>
  );
}
