import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./navbar.module.css";
import {
  FaHome,
  FaSearch,
  FaPlusSquare,
  FaHeart,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext";
import PainelDadosCadastrais from "../PainelUser/PainelDadosCadastrais";
import PainelEnderecos from "../PainelUser/PainelEnderecos";

export default function NavBar({ usuario }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [mostrarPainelDados, setMostrarPainelDados] = useState(false);
  const [mostrarPainelEnderecos, setMostrarPainelEnderecos] = useState(false);

  const toggleMenu = () => setShowMenu((prev) => !prev);
  const handleOptionClick = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  const abrirPainelDados = () => {
    setMostrarPainelDados(true);
    setShowMenu(false);
  };

  const abrirPainelEnderecos = () => {
    setMostrarPainelEnderecos(true);
    setShowMenu(false);
  };

  const fecharPainelDados = () => setMostrarPainelDados(false);
  const fecharPainelEnderecos = () => setMostrarPainelEnderecos(false);

  return (
    <div className={styles.wrapper}>
      <nav className={styles.navbar}>
        <button onClick={() => navigate("/")} className={styles.icon}>
          <FaHome />
        </button>
        <button onClick={() => navigate("/buscar")} className={styles.icon}>
          <FaSearch />
        </button>
        <button onClick={() => navigate("/novo")} className={styles.icon}>
          <FaPlusSquare />
        </button>
        <button onClick={() => navigate("/favoritos")} className={styles.icon}>
          <FaHeart />
        </button>

        <div className={styles.userMenu}>
          <button onClick={toggleMenu} className={styles.icon}>
            <FaUserCircle />
          </button>

          {showMenu && (
            <div className={styles.dropdown}>
              <button onClick={abrirPainelDados}>Dados cadastrais</button>
              <button onClick={abrirPainelEnderecos}>Endereços</button>
              <button onClick={() => handleOptionClick("/ajuda")}>Ajuda</button>
              <button onClick={() => handleOptionClick("/configuracoes")}>Configurações</button>
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
              >
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </nav>

      {mostrarPainelDados && (
        <div className={styles.painelOverlay}>
          <PainelDadosCadastrais usuario={usuario} onClose={fecharPainelDados} />
        </div>
      )}

      {mostrarPainelEnderecos && (
        <div className={styles.painelOverlay}>
          <PainelEnderecos usuario={usuario} onClose={fecharPainelEnderecos} />
        </div>
      )}
    </div>
  );
}
