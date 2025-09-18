import { useState } from "react";
import Header from "../../components/Header/header";
import NavBar from "../../components/Navegation Bar/navbar";
import CarouselUniversal from "../../components/UniversalCardHome/CarouselUniversal";
import CardUniversal from "../../components/UniversalCardHome/CardHome";
import ProductModal from "../../modal/ProductModal";
import { useNavigate } from "react-router-dom";
import styles from "./home.module.css";
import useProdutos from "../../hooks/useProdutos";
import useMercados from "../../hooks/useMercados";
import { MdArrowCircleRight } from "react-icons/md";
import { useCart } from "../../Context/CartContext";

export default function Home() {
  const produtos = useProdutos();
  const { mercados, loading } = useMercados();
  const navigate = useNavigate();

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
          items={produtos.destaque.slice(0, 10)}
          sectionPath="/produtos/destaque"
          type="produto"
          onCardClick={handleCardClick}
          onAddClick={handleAddClick}
        />

        <CarouselUniversal
          title="Mercados perto de você"
          items={mercados.slice(0, 10)}
          sectionPath="/mercados"
          type="mercado"
        />

        <CarouselUniversal
          title="Produtos Populares"
          items={produtos.popular.slice(0, 10)}
          sectionPath="/produtos/popular"
          type="produto"
          onCardClick={handleCardClick}
          onAddClick={handleAddClick}
        />

        <div className={styles.lojasSection}>
          <div className={styles.header}>
            <h2>Todos os Mercados</h2>
            <button
              onClick={() => navigate("/mercados")}
              className={styles.verMais}
            >
              <span>Ver mais</span>
              <MdArrowCircleRight className={styles.icon} />
            </button>
          </div>

          <div className={styles.grid}>
            {loading ? (
              <p>Carregando mercados...</p>
            ) : (
              mercados.slice(0, 20).map((mercado) => (
                <CardUniversal
                  key={mercado.id}
                  item={mercado}
                  type="mercado"
                />
              ))
            )}
          </div>
        </div>

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
