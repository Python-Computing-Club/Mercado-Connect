import React from "react";
import { useCart } from "../../Context/CartContext";
import useProdutos from "../../hooks/useProdutos";
import NavBar from "../../components/Navegation Bar/navbar";
import { useNavigate } from "react-router-dom";
import styles from "./cartpage.module.css";

const DEFAULT_IMAGE = "/placeholder.png";

function CartPage() {
  const { carrinho, updateItemQuantity, removeItem } = useCart();
  const produtos = useProdutos();
  const navigate = useNavigate();

  // Mapeia os itens do carrinho com os dados atualizados dos produtos
  const carrinhoComProdutos = carrinho.map((itemCarrinho) => {
    const produtoAtual = produtos.todos?.find((p) => p.id === itemCarrinho.id);
    return produtoAtual
      ? {
          ...itemCarrinho,
          nome: produtoAtual.nome,
          preco: produtoAtual.preco,
          preco_final: produtoAtual.preco_final,
          imagem: produtoAtual.imagemUrl || produtoAtual.imagem || "",
        }
      : itemCarrinho; // fallback se não encontrar
  });

  const getTotal = () => {
    return carrinhoComProdutos.reduce((total, item) => {
      const precoUsado =
        typeof item.preco_final === "number" && item.preco_final < item.preco
          ? item.preco_final
          : item.preco || 0;
      return total + precoUsado * item.quantidade;
    }, 0);
  };

  if (carrinho.length === 0) {
    return (
      <>
        <NavBar />
        <div className={styles.cartContainerEmpty}>
          <p className={styles.cartEmpty}>Seu carrinho está vazio.</p>
          <button
            className={styles.voltarHomeBtn}
            onClick={() => navigate("/")}
          >
            ← Voltar para a Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />

      <div className={styles.cartContainer}>
        <h2>Meu Carrinho</h2>

        <div className={styles.cartItems}>
          {carrinhoComProdutos.map(
            ({ id, nome, preco, preco_final, quantidade, imagem }) => {
              const precoUsado =
                typeof preco_final === "number" && preco_final < preco
                  ? preco_final
                  : preco;

              const temDesconto =
                typeof preco_final === "number" && preco_final < preco;

              return (
                <div key={id} className={styles.cartItem}>
                  <div className={styles.cartItemImg}>
                    <img
                      src={imagem || DEFAULT_IMAGE}
                      alt={nome}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                      className={styles.cartItemImgImage}
                    />
                  </div>

                  <div className={styles.cartItemInfo}>
                    <h4>{nome}</h4>

                    <p className={styles.priceRow}>
                      Preço:
                      {temDesconto ? (
                        <>
                          <span className={styles.oldPrice}>
                            R$ {preco.toFixed(2)}
                          </span>
                          <span className={styles.discountedPrice}>
                            R$ {preco_final.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <strong>R$ {preco.toFixed(2)}</strong>
                      )}
                    </p>

                    <div className={styles.cartQty}>
                      <label>Qtd:</label>
                      <input
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) =>
                          updateItemQuantity(id, parseInt(e.target.value, 10))
                        }
                      />
                    </div>

                    <p>
                      Subtotal:{" "}
                      <strong>R$ {(precoUsado * quantidade).toFixed(2)}</strong>
                    </p>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div className={styles.cartFooter}>
          <h3>Total: R$ {getTotal().toFixed(2)}</h3>

          <div className={styles.cartFooterButtons}>
            <button
              className={styles.checkoutBtn}
              onClick={() => alert("Finalizando compra!")}
            >
              Finalizar Compra
            </button>

            <button
              className={styles.voltarHomeBtn}
              onClick={() => navigate("/")}
            >
              ← Continuar comprando
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CartPage;
