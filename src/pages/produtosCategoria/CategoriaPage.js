import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { escutarProdutosPorMercado } from "../../services/firestore/produtos";
import { useMarket } from "../../Context/MarketContext";
import { useCart } from "../../Context/CartContext";
import CardCategoria from "../../components/Cards/CardCategoria";
import ProductModal from "../../modal/ProductModal";
import NavBar from "../../components/Navegation Bar/navbar";
import Header from "../../components/Header/header";
import styles from "./categoria.module.css";

const grupos = {
  "hortifruti-&-padaria": ["Hortifruti", "Padaria & Confeitaria"],
  "mercearia-&-congelados": ["Mercearia", "Congelados & Resfriados", "Alimentícios"],
  "beleza-&-higiene": ["Beleza", "Produtos de Higiene Pessoal", "Produtos de Limpeza"],
  "infantil-&-saúde": ["Infantil / Bebê", "Farmácia / Saúde"],
  "pet-&-utilidades": ["Pet Shop (animais)", "Utilidades Domésticas"],
  "açougue-&-frios": ["Açougue & Peixaria", "Frios & Laticínios"],
  "bebidas-&-especiais": ["Bebida", "Saudáveis & Especiais"],
  "destaque": ["__destaque__"],
  "popular": ["__popular__"],
};

export default function CategoriaPage() {
  const { marketId, loading } = useMarket();
  const { categoriaSlug } = useParams();
  const { addItem } = useCart();

  const [produtos, setProdutos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [query, setQuery] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const porPagina = 20;

  useEffect(() => {
    if (loading || !marketId) return;

    const unsubscribe = escutarProdutosPorMercado(marketId, (todos) => {
      if (!todos || todos.length === 0) {
        setProdutos([]);
        return;
      }

      let disponiveis = todos.filter((p) => p.disponivel);
      const categoriasAlvo = grupos[categoriaSlug];

      if (categoriaSlug === "destaque") {
        disponiveis = disponiveis.filter(
          (p) => p.preco_final && p.preco_final < p.preco
        );
      } else if (categoriaSlug === "popular") {
        disponiveis = disponiveis.sort(
          (a, b) => (b.qtdVendida || 0) - (a.qtdVendida || 0)
        );
      } else if (categoriasAlvo) {
        disponiveis = disponiveis.filter((p) =>
          categoriasAlvo.some((cat) => p.categoria?.includes(cat))
        );
      }

      setProdutos(disponiveis);
      setPagina(1);
    });

    return () => unsubscribe();
  }, [marketId, loading, categoriaSlug]);

  const produtosFiltrados = useMemo(() => {
    if (!query) return produtos;
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, produtos]);

  const inicio = (pagina - 1) * porPagina;
  const fim = inicio + porPagina;
  const paginaAtual = produtosFiltrados.slice(inicio, fim);
  const totalPaginas = Math.ceil(produtosFiltrados.length / porPagina);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <div className={styles.backButtonWrapper}>
        <Link to="/" className={styles.backButton}>
          ⬅ Voltar para Home
        </Link>
      </div>

      <h1 className={styles.title}>
        {categoriaSlug.replace(/-/g, " ").toUpperCase()}
      </h1>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar nesta categoria..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {paginaAtual.length === 0 ? (
        <p className={styles.emptyMessage}>Nenhum produto disponível nesta categoria.</p>
      ) : (
        <div className={styles.grid}>
          {paginaAtual.map((produto) => (
            <CardCategoria
              key={produto.id}
              item={produto}
              onClick={() => setProdutoSelecionado(produto)}
            />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            ⬅ Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima ➡
          </button>
        </div>
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