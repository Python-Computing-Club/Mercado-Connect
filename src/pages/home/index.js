import Header from "../../components/Header/header";
import NavBar from "../../components/Navegation Bar/navbar";
import ProductCarousel from "../../components/Product Carousel/ProductCarousel";
import styles from "./home.module.css";
import useProdutos from "../../hooks/useProdutos";

export default function Home() {
  const produtos = useProdutos();

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.topBar}>
        <Header />
        <NavBar />
      </div>

      <div className={styles.contentArea}>
        <ProductCarousel
          title="Ofertas em Destaque"
          products={produtos.destaque}
          sectionPath="/produtos/destaque"
        />

        <ProductCarousel
          title="Produtos Populares"
          products={produtos.popular}
          sectionPath="/produtos/popular"
        />
      </div>
    </div>
  );
}