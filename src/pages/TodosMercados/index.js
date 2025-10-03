import { useEffect, useState, useMemo } from "react";
import { listarMercados } from "../../services/firestore/mercados";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import Header from "../../components/Header/header";
import NavBar from "../../components/NavegationBar/navbar";
import styles from "./todaslojas.module.css";

export default function TodasLojas() {
  const [mercados, setMercados] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const carregar = async () => {
      const lista = await listarMercados();
      setMercados(lista);
    };
    carregar();
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(mercados, {
      keys: ["estabelecimento"],
      threshold: 0.25,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, [mercados]);

  const mercadosFiltrados = useMemo(() => {
    if (query.length < 2) {
      return mercados;
    }
    const resultados = fuse.search(query);
    return resultados.map(({ item }) => item);
  }, [query, fuse, mercados]);

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <NavBar />

      <div className={styles.backButtonWrapper}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          ← Voltar para Home
        </button>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar por mercados..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar por mercados"
        />
      </div>

      <div className={styles.resultados}>
        {mercadosFiltrados.length > 0 ? (
          mercadosFiltrados.map((mercado) => (
            <div
              key={mercado.id}
              className={styles.resultadoItem}
              onClick={() => navigate(`/mercado/${mercado.id}`)}
            >
              <img
                src={
                  mercado.logo?.url ||
                  "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg"
                }
                alt={mercado.estabelecimento || mercado.nome}
              />
              <div className={styles.resultadoInfo}>
                <h3>{mercado.estabelecimento || mercado.nome}</h3>
                <div className={styles.marketName}>
                  {mercado.endereco?.cidade}, {mercado.endereco?.estado}
                </div>
                <div className={styles.preco}>⭐ {mercado.nota || "N/A"}</div>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhum mercado encontrado.</p>
        )}
      </div>
    </div>
  );
}
