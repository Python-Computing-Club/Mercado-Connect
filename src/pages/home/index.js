import { useState } from "react";
import Header from "../../components/Header/header";
import NavBar from "../../components/NavegationBar/navbar";
import CarouselUniversal from "../../components/Cards/CarouselUniversal";
import ProductModal from "../../modal/ProductModal";
import styles from "./home.module.css";
import useProdutos from "../../hooks/useProdutos";
import useMercados from "../../hooks/useMercados";
import { useCart } from "../../Context/CartContext";

export default function Home() {
  const produtos = useProdutos() || {};
  const { mercados = [] } = useMercados() || {}; // garantia de array padrão
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const { addItem } = useCart();

  // Função única para selecionar produto (substitui handleCardClick e handleAddClick)
  const handleSelectProduto = (produto) => {
    setProdutoSelecionado(produto);
  };

  // Criando variáveis para slices dos arrays (evita fazer slice direto no JSX)
  const destaques = produtos.destaque?.slice(0, 10) || [];
  const produtosPopulares = produtos.popular?.slice(0, 10) || [];
  const mercadosPerto = mercados.slice(0, 10);
  const todosMercados = mercados.slice(0, 20);

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <NavBar />

      <div className={styles.contentArea}>
        <CarouselUniversal
          title="Ofertas em Destaque"
          items={destaques}
          sectionPath="/produtos/destaque"
          type="produto"
          onCardClick={handleSelectProduto}
          onAddClick={handleSelectProduto}
        />

        <CarouselUniversal
          title="Mercados perto de você"
          items={mercadosPerto}
          sectionPath="/mercados"
          type="mercado"
        />

        <CarouselUniversal
          title="Produtos Populares"
          items={produtosPopulares}
          sectionPath="/produtos/popular"
          type="produto"
          onCardClick={handleSelectProduto}
          onAddClick={handleSelectProduto}
        />

        <CarouselUniversal
          title="Todos os Mercados"
          items={todosMercados}
          sectionPath="/mercados"
          type="mercado"
        />

        {produtos.categorias &&
          Object.entries(produtos.categorias).map(([grupo, lista]) => (
            <CarouselUniversal
              key={grupo}
              title={grupo}
              items={lista}
              sectionPath={`/produtos/${grupo.toLowerCase().replace(/\s+/g, "-")}`}
              type="produto"
              onCardClick={handleSelectProduto}
              onAddClick={handleSelectProduto}
            />
          ))}
      </div>

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
    </div>
  );
}
