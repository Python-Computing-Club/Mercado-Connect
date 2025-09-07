import styles from "./header.module.css";
import logo from "../../assets/teste.png";
import { useAuth } from "../../Context/AuthContext";

export default function Header() {
  const { usuario } = useAuth();
  const nome = usuario?.nome?.split(" ")[0] || "usuário";

  return (
    <header className={styles.header}>
      <div className={styles.logoArea}>
        <img src={logo} alt="Logo Mercado Connect" className={styles.logo} />
        <span className={styles.marketName}>Mercado<br />Connect</span>
      </div>
      <div className={styles.userArea}>
        <span className={styles.greeting}>Olá, {nome}!</span>
      </div>
    </header>
  );
}