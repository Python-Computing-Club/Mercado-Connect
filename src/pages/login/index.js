import styles from "./login.module.css";
import { Link } from "react-router-dom";
import cartIcon from "../../assets/teste.png";
import googleIcon from "../../assets/google.png";
import facebookIcon from "../../assets/facebook.png";

export default function Login() {
  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoContainer}>
        <div className={styles.logo}>
          <img src={cartIcon} alt="Logo Mercado Connect" className={styles.cartIcon} />
        </div>
        <div className={styles.title} translate="no">
          <h1>Mercado</h1>
          <h1>Connect</h1>
        </div>
      </Link>

      <input type="email" placeholder="E-mail" className={styles.input} />

      <button className={styles.continueBtn}>Continue</button>

      <div className={styles.divider}>
        <span></span>
        <p>ou</p>
        <span></span>
      </div>

      <button className={styles.googleBtn}>
        <img src={googleIcon} alt="Google" />
        Continue com Google
      </button>

      <button className={styles.facebookBtn}>
        <img src={facebookIcon} alt="Facebook" />
        Continue com Facebook
      </button>

      <p className={styles.signup}>
        Não tem uma conta?{" "}
        <Link to="/cadastro" className={styles.signupLink}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
