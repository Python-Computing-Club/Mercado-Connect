import Header from "../../components/Header/header";  
import NavBar from "../../components/Navegation Bar/navbar";
import ProductCarousel from "../../components/Product Carousel/ProductCarousel";
import styles from "./home.module.css";
import useProdutos from "../../hooks/useProdutos";

export default function Home() {
  const produtos = useProdutos();

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <NavBar />

      <div className={styles.contentArea}>
        <ProductCarousel
          title="Ofertas em Destaque"
          products={produtos.destaque.length ? produtos.destaque : [{ nome: "Nenhum produto disponível", preco: 0, imagemUrl: "" }]}
          sectionPath="/produtos/destaque"
        />

        <ProductCarousel
          title="Produtos Populares"
          products={produtos.popular.length ? produtos.popular : [{ nome: "Nenhum produto disponível", preco: 0, imagemUrl: "" }]}
          sectionPath="/produtos/popular"
        />

        {produtos.categorias &&
          Object.entries(produtos.categorias).map(([grupo, lista]) => (
            <ProductCarousel
              key={grupo}
              title={grupo}
              products={lista.length ? lista : [{ nome: "Nenhum produto disponível", preco: 0, imagemUrl: "" }]}
              sectionPath={`/produtos/${grupo.toLowerCase().replace(/\s+/g, "-")}`}
            />
          ))}
      </div>
    </div>
  );
}
