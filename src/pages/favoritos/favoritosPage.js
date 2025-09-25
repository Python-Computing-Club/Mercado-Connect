import { useState } from "react";
import { useFavoritos } from "../../Context/FavoritosContext";
import { useCart } from "../../Context/CartContext";
import { useAuth } from "../../Context/AuthContext";

import CardHome from "../../components/Cards/CardHome";
import Header from "../../components/Header/header";
import NavBar from "../../components/Navegation Bar/navbar";
import ProductModal from "../../modal/ProductModal";

export default function FavoritosPage() {
  const { favoritosProdutos, favoritosMercados } = useFavoritos();
  const { addItem } = useCart();
  const { usuario } = useAuth();

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const abrirModalProduto = (produto) => {
    setProdutoSelecionado(produto);
  };

  const fecharModalProduto = () => {
    setProdutoSelecionado(null);
  };

  const adicionarAoCarrinho = (produto, quantidade) => {
    addItem(produto, quantidade);
    fecharModalProduto();
  };

  return (
    <div className="pageWrapper">
      <Header />

      <div style={{ padding: "20px", paddingBottom: "80px" }}>
        <h2>❤️ Meus Favoritos</h2>

        <section style={{ marginBottom: "30px" }}>
          <h3>🛒 Mercados Favoritos</h3>
          {favoritosMercados.length === 0 ? (
            <p>Nenhum mercado favoritado.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {favoritosMercados.map((item) => (
                <CardHome key={item.id} item={item} type="mercado" />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>📦 Produtos Favoritos</h3>
          {favoritosProdutos.length === 0 ? (
            <p>Nenhum produto favoritado.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {favoritosProdutos.map((item) => (
                <CardHome
                  key={item.id}
                  item={item}
                  type="produto"
                  onClick={() => abrirModalProduto(item)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          onClose={fecharModalProduto}
          onAddToCart={adicionarAoCarrinho}
        />
      )}

      <NavBar usuario={usuario} />
    </div>
  );
}