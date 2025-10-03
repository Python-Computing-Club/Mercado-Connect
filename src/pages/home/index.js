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
  const produtos = useProdutos();
  const { mercados } = useMercados(); // ✅ removido 'loading'
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const { addItem } = useCart();

  const handleCardClick = (produto) => {
    setProdutoSelecionado(produto);
  };

  const handleAddClick = (produto) => {
    setProdutoSelecionado(produto);
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <NavBar />

      <div className={styles.contentArea}>
        <CarouselUniversal
          title="Ofertas em Destaque"
          items={produtos.destaque?.slice(0, 10) || []}
          sectionPath="/produtos/destaque"
          type="produto"
          onCardClick={handleCardClick}
          onAddClick={handleAddClick}
        />

        <CarouselUniversal
          title="Mercados perto de você"
          items={mercados?.slice(0, 10) || []}
          sectionPath="/mercados"
          type="mercado"
        />

        <CarouselUniversal
          title="Produtos Populares"
          items={produtos.popular?.slice(0, 10) || []}
          sectionPath="/produtos/popular"
          type="produto"
          onCardClick={handleCardClick}
          onAddClick={handleAddClick}
        />

        <CarouselUniversal
          title="Todos os Mercados"
          items={mercados?.slice(0, 20) || []}
          sectionPath="/mercados"
          type="mercado"
        />

        {produtos.categorias &&
          Object.entries(produtos.categorias).map(([grupo, lista]) => (
            <CarouselUniversal
              key={grupo}
              title={grupo}
              items={lista}
              sectionPath={`/produtos/${grupo
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
              type="produto"
              onCardClick={handleCardClick}
              onAddClick={handleAddClick}
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