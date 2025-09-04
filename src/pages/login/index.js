import styles from "./login.module.css";
import { Link } from "react-router-dom";
import cartIcon from "../../assets/teste.png";
import facebookIcon from "../../assets/facebook.png";
import useLoginFormLogic from "../../components/LoginForm";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const {
    form,
    step,
    modal,
    tempoRestante,
    handleChange,
    enviarCodigoHandler,
    validarCodigo,
    setForm,
    setModal,
    loginComGoogle,
  } = useLoginFormLogic();

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const userInfo = jwtDecode(token);
      await loginComGoogle(userInfo.email, userInfo.name, userInfo.phone_number || "");
    } catch (error) {
      setModal({
        open: true,
        title: "Erro no login",
        message: "Não foi possível fazer login com o Google.",
      });
    }
  };

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

      {modal.open && (
        <div className={styles.modal}>
          <h2>{modal.title}</h2>
          <p>{modal.message}</p>
          <button onClick={() => setModal({ ...modal, open: false })}>Fechar</button>
        </div>
      )}

      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="E-mail ou telefone"
            className={styles.input}
            value={form.contato}
            onChange={handleChange}
          />
          <button className={styles.continueBtn} onClick={enviarCodigoHandler}>
            Continue
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Digite o código"
            className={styles.input}
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />
          <p className={styles.timer}>Tempo restante: {tempoRestante}s</p>
          <button className={styles.continueBtn} onClick={validarCodigo}>
            Validar código
          </button>
          <button
            className={styles.continueBtn}
            style={{ marginTop: "10px" }}
            onClick={enviarCodigoHandler}
          >
            Reenviar código
          </button>
        </>
      )}

      <div className={styles.divider}>
        <span></span>
        <p>ou</p>
        <span></span>
      </div>

      <div className={styles.socialContainer}>
        <div className={styles.googleBtn}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() =>
              setModal({
                open: true,
                title: "Erro no login",
                message: "Não foi possível fazer login com o Google.",
              })
            }
          />
        </div>

        <button className={styles.facebookBtn}>
          <img src={facebookIcon} alt="Facebook" />
          Continue com Facebook
        </button>
      </div>

      <p className={styles.signup}>
        Não tem uma conta?{" "}
        <Link to="/cadastro" className={styles.signupLink}>
          Cadastre-se
        </Link>
      </p>
      <p className={styles.signup}>
        Quer se tornar um parceiro?{" "}
        <Link to="/cadastro-parceiro" className={styles.signupLink}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}