import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import {
  FaAppleAlt,
  FaUtensils,
  FaShoppingBasket,
  FaWineBottle,
  FaChild,
  FaDog,
  FaBacon,
  FaDrumstickBite,
} from "react-icons/fa";
import useProdutos from "../../hooks/useProdutos";
import useMercados from "../../hooks/useMercados";
import CardHome from "../../components/Cards/CardHome";
import ProductModal from "../../modal/ProductModal";
import NavBar from "../../components/NavegationBar/navbar";
import styles from "./buscar.module.css";

export default function BuscarPage() {
  const navigate = useNavigate();
  const produtos = useProdutos();
  const { mercados } = useMercados();
  const [query, setQuery] = useState("");
  const [sugestoesMercados, setSugestoesMercados] = useState([]);

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const produtosLista = useMemo(() => {
    return Object.values(produtos.categorias || {}).flat();
  }, [produtos]);

  const fuse = useMemo(() => {
    return new Fuse(produtosLista, {
      keys: ["nome"],
      threshold: 0.3,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, [produtosLista]);

  const resultados = useMemo(() => {
    if (query.length < 2) return [];
    const fuseResults = fuse.search(query);
    return fuseResults.map(({ item }) => item);
  }, [query, fuse]);

  const categorias = [
    { nome: "Hortifruti & Padaria", icone: <FaAppleAlt />, cor: "#4CAF50" },
    { nome: "Mercearia & Congelados", icone: <FaShoppingBasket />, cor: "#FF9800" },
    { nome: "Beleza & Higiene", icone: <FaUtensils />, cor: "#E91E63" },
    { nome: "Infantil & Saúde", icone: <FaChild />, cor: "#3F51B5" },
    { nome: "Pet & Utilidades", icone: <FaDog />, cor: "#795548" },
    { nome: "Bebidas & Especiais", icone: <FaWineBottle />, cor: "#9C27B0" },
    {
      nome: "Carnes & Aves",
      icone: (
        <>
          <FaBacon />
          <FaDrumstickBite />
        </>
      ),
      cor: "#ff0000c2",
    },
  ];

  const getMercadoById = (id_mercado) => mercados.find((m) => m.id === id_mercado);

  const handleCardClick = (produto) => setProdutoSelecionado(produto);

  const handleAddClick = (produto) => setProdutoSelecionado(produto);

  const sortearSugestoes = useCallback(() => {
    if (!mercados || mercados.length === 0) {
      setSugestoesMercados([]);
      return;
    }
    const quantidadeParaMostrar = 3;
    const copia = [...mercados];
    const sugeridos = [];
    for (let i = 0; i < quantidadeParaMostrar && copia.length > 0; i++) {
      const idx = Math.floor(Math.random() * copia.length);
      sugeridos.push(copia.splice(idx, 1)[0]);
    }
    setSugestoesMercados(sugeridos);
  }, [mercados]);

  useEffect(() => {
    sortearSugestoes();
    const interval = setInterval(() => {
      sortearSugestoes();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sortearSugestoes]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backButtonWrapper}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          ← Voltar para Home
        </button>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="O que vai pedir hoje?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar produtos"
          autoFocus
        />
      </div>

      {!query && (
        <>
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

          {sugestoesMercados.length > 0 && (
            <div className={styles.sugestoesContainer}>
              <h3>Sugestões de mercados</h3>
              <div className={styles.sugestoesLista}>
                {sugestoesMercados.map((m) => (
                  <div
                    key={m.id}
                    className={styles.sugestaoItem}
                    onClick={() => navigate(`/mercado/${m.id}`)}
                  >
                    <img
                      src={
                        m.logo?.url ||
                        "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg"
                      }
                      alt={m.nome}
                      className={styles.sugestaoImage}
                    />
                    <div className={styles.sugestaoInfo}>
                      <div className={styles.sugestaoNome}>{m.estabelecimento}</div>
                      <div className={styles.sugestaoNota}>⭐ {m.nota?.toFixed(1) || "Sem nota"}</div>
                      <div className={styles.localizacao}>
                        {m.endereco?.cidade}, {m.endereco?.estado}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {query && (
        <div className={styles.resultados}>
          {resultados.length > 0 ? (
            resultados.map((p) => {
              const mercado = getMercadoById(p.id_mercado);
              return (
                <div key={p.id} style={{ marginBottom: "32px" }}>
                  <CardHome
                    item={p}
                    type="produto"
                    onClick={() => handleCardClick(p)}
                    onAddClick={() => handleAddClick(p)}
                  />

                  {mercado && (
                    <div
                      className={styles.marketCardWrapper}
                      onClick={() => navigate(`/mercado/${mercado.id}`)}
                      style={{ cursor: "pointer", marginTop: "12px" }}
                    >
                      <img
                        src={
                          mercado.logo?.url ||
                          "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg"
                        }
                        alt={mercado.nome}
                        className={styles.marketCardImage}
                      />
                      <div className={styles.marketCardInfo}>
                        <div className={styles.marketName}>{mercado.estabelecimento}</div>
                        <div className={styles.label}>
                          Mercado que possui o produto pesquisado
                        </div>
                        <div className={styles.nota}>
                          ⭐ {mercado.nota || "Sem nota"}
                        </div>
                        <div className={styles.localizacao}>
                          {mercado.endereco?.cidade}, {mercado.endereco?.estado}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>Nenhum produto encontrado.</p>
          )}
        </div>
      )}

      {produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onAddToCart={(produto, quantidade) => {
            console.log("Adicionado ao carrinho:", produto, "x", quantidade);
            setProdutoSelecionado(null);
          }}
        />
      )}

      <NavBar />
    </div>
  );
}
