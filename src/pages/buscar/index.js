import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaAppleAlt, FaUtensils, FaShoppingBasket, FaWineBottle, FaChild, FaDog, FaBacon, FaDrumstickBite } from "react-icons/fa";
import useProdutos from "../../hooks/useProdutos";
import NavBar from "../../components/Navegation Bar/navbar";
import styles from "./buscar.module.css";

export default function BuscarPage() {
  const navigate = useNavigate();
  const produtos = useProdutos();
  const [query, setQuery] = useState("");

  const resultados = query
    ? Object.values(produtos.categorias || {})
        .flat()
        .filter((p) =>
          p.nome?.toLowerCase().includes(query.toLowerCase())
        )
    : [];

  const categorias = [
    { nome: "Hortifruti & Padaria", icone: <FaAppleAlt />, cor: "#4CAF50" },
    { nome: "Mercearia & Congelados", icone: <FaShoppingBasket />, cor: "#FF9800" },
    { nome: "Beleza & Higiene", icone: <FaUtensils />, cor: "#E91E63" },
    { nome: "Infantil & Saúde", icone: <FaChild />, cor: "#3F51B5" },
    { nome: "Pet & Utilidades", icone: <FaDog />, cor: "#795548" },
    { nome: "Bebidas & Especiais", icone: <FaWineBottle />, cor: "#9C27B0" },
    { nome: "Bebidas & Especiais", icone: (<><FaBacon /><FaDrumstickBite /></>), cor: "#ff0000c2" },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="O que vai pedir hoje?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query && (
        <div className={styles.categorias}>
          {categorias.map((cat) => (
            <div
              key={cat.nome}
              className={styles.card}
              style={{ backgroundColor: cat.cor }}
              onClick={() =>
                navigate(`/produtos/${cat.nome.toLowerCase().replace(/\s+/g, "-")}`)
              }
            >
              <div className={styles.icone}>{cat.icone}</div>
              <div className={styles.nome}>{cat.nome}</div>
            </div>
          ))}
        </div>
      )}

      {query && (
        <div className={styles.resultados}>
          {resultados.length > 0 ? (
            resultados.map((p) => (
              <div key={p.id} className={styles.resultadoItem}>
                <img src={p.imagemUrl || "/placeholder.png"} alt={p.nome} />
                <div className={styles.resultadoInfo}>
                  <h3>{p.nome}</h3>
                  <div className={styles.marketName}>
                    {p.mercado || "Mercado Exemplo"}
                  </div>
                  <div className={styles.preco}>
                    R$ {p.preco_final?.toFixed(2) || p.preco?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum produto encontrado.</p>
          )}
        </div>
      )}

      <NavBar />
    </div>
  );
}
