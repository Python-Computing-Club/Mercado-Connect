import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { escutarProdutosPorMercado } from "../../services/firestore/produtos";
import { buscarMercadoPorId } from "../../services/firestore/mercados";
import { useCart } from "../../Context/CartContext";
import CardHome from "../../components/Cards/CardCategoria";
import ProductModal from "../../modal/ProductModal";
import NavBar from "../../components/NavegationBar/navbar";
import Header from "../../components/Header/header";
import styles from "./catalogo.module.css";

const grupos = {
  "Hortifruti & Padaria": ["Hortifruti", "Padaria & Confeitaria"],
  "Mercearia & Congelados": ["Mercearia", "Congelados & Resfriados", "Alimentícios"],
  "Beleza & Higiene": ["Beleza", "Produtos de Higiene Pessoal", "Produtos de Limpeza"],
  "Infantil & Saúde": ["Infantil / Bebê", "Farmácia / Saúde"],
  "Pet & Utilidades": ["Pet Shop (animais)", "Utilidades Domésticas"],
  "Açougue & Frios": ["Açougue & Peixaria", "Frios & Laticínios"],
  "Bebidas & Especiais": ["Bebida", "Saudáveis & Especiais"],
};

export default function CatalogoMercado() {
  const { id } = useParams();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [mercado, setMercado] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [query, setQuery] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    buscarMercadoPorId(id).then(setMercado);
    const unsubscribe = escutarProdutosPorMercado(id, setProdutos);
    return () => unsubscribe();
  }, [id]);

  const produtosFiltrados = useMemo(() => {
    if (!query) return produtos;
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, produtos]);

  const produtosPorSessao = useMemo(() => {
    const resultado = {};

    Object.entries(grupos).forEach(([nomeGrupo, categorias]) => {
      const filtrados = produtosFiltrados.filter((p) =>
        categorias.some((cat) => p.categoria?.includes(cat))
      );
      if (filtrados.length > 0) {
        resultado[nomeGrupo] = filtrados;
      }
    });

    return resultado;
  }, [produtosFiltrados]);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <div className={styles.header}>
        <div className={styles.backButtonWrapper}>
          <button onClick={() => navigate("/")} className={styles.backButton}>
            ⬅ Voltar para Home
          </button>
        </div>

        {mercado && (
          <div className={styles.marketInfo}>
            <img
              src={
                mercado.logo?.url ||
                "https://res.cloudinary.com/dwkrozkp2/image/upload/v1757609252/lje3rzkfbneourao4nhk.jpg"
              }
              alt={mercado.nome}
              className={styles.logo}
            />
            <h2 className={styles.marketName}>{mercado.estabelecimento}</h2>
            <p className={styles.marketNota}>
              ⭐ {mercado.nota?.toFixed(1) || "Sem nota"}
            </p>
          </div>
        )}
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar no catálogo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {Object.keys(produtosPorSessao).length > 0 ? (
        Object.entries(produtosPorSessao).map(([nomeGrupo, lista]) => (
          <div key={nomeGrupo} className={styles.categoriaSection}>
            <h3 className={styles.categoriaTitulo}>{nomeGrupo}</h3>
            <div className={styles.grid}>
              {lista.map((produto) => (
                <CardHome
                  key={produto.id}
                  item={produto}
                  type="produto"
                  onClick={() => setProdutoSelecionado(produto)}
                  onAddClick={() => setProdutoSelecionado(produto)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className={styles.empty}>Nenhum produto disponível neste mercado.</p>
      )}

        {produtoSelecionado && (
         <ProductModal
           produto={produtoSelecionado}
           onClose={() => setProdutoSelecionado(null)}
           onAddToCart={(produto, quantidade) => {
             addItem(produto, quantidade);
             setProdutoSelecionado(null);
           }}
         />
       )}

      <NavBar />
    </div>
  );
}