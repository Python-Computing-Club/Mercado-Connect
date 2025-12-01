import React, { useState, useEffect, useRef } from "react";
import { useCart } from "../../Context/CartContext";
import useProdutos from "../../hooks/useProdutos";
import Header from "../../components/Header/header";
import NavBar from "../../components/NavegationBar/navbar";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./cartpage.module.css";

const DEFAULT_IMAGE = "/placeholder.png";

function CartPage() {
  const {
    carrinho,
    updateItemQuantity,
    removeItem,
    addItem,
    clearCart,
  } = useCart();
  const produtos = useProdutos();
  const navigate = useNavigate();
  const location = useLocation();

  const pedidoParaRecompra = location.state?.pedidoParaRecompra;
  const fromReorder = location.state?.fromReorder === true;

  const [mensagemErro, setMensagemErro] = useState({});
  const [valoresInputs, setValoresInputs] = useState({});
  const [avisoRecompra, setAvisoRecompra] = useState("");
  const [recompraEmAndamento, setRecompraEmAndamento] = useState(
    !!fromReorder && !!pedidoParaRecompra?.itens?.length
  );

  const [modalInfo, setModalInfo] = useState({
    show: false,
    message: "",
    pedido: null,
    mercadoPedido: null,
    nomeMercadoPedido: "",
    pedidoId: null,
  });

  const valoresRef = useRef({});
  const jaRecomprouRef = useRef(false);

  console.log("STATE NO CARRINHO:", location.state);
  console.log("PEDIDO PARA RECOMPRA:", pedidoParaRecompra);

  const adicionarItensDesdePedido = (
    pedido,
    mercadoPedido,
    nomeMercadoPedido,
    pedidoId
  ) => {
    if (!pedido?.itens || pedido.itens.length === 0) return;

    const semId = [];
    let adicionouAlgo = false;

    pedido.itens.forEach((item) => {
      const possibleIdKeys = [
        "produtoId",
        "idProduto",
        "id_produto",
        "idProdutoLoja",
        "id",
        "produto_id",
      ];
      let idProduto = null;
      for (const key of possibleIdKeys) {
        if (item[key]) {
          idProduto = item[key];
          break;
        }
      }

      if (!idProduto) {
        semId.push(item.nome || JSON.stringify(item));
        return;
      }

      const quantidade =
        item.quantidade ??
        item.qtd ??
        item.qty ??
        item.quantity ??
        1;

      const precoBase =
        item.preco ??
        item.preco_unitario ??
        item.valor_unitario ??
        item.preco_final ??
        0;

      const imagem =
        item.imagemUrl ||
        item.imagem ||
        item.imageUrl ||
        item.foto ||
        "";

      const nome = item.nome || item.titulo || "Produto";

      const estoqueBase =
        item.estoque ??
        item.quantidade ??
        item.qtd ??
        item.qty ??
        99;

      addItem(
        {
          id: idProduto,
          nome,
          preco: precoBase,
          preco_final: item.preco_final,
          imagem,
          estoque: estoqueBase,
          id_mercado: mercadoPedido,
          external_store_id: pedido.external_store_id,
          pedidoOrigemId: pedidoId,
          nomeMercado: nomeMercadoPedido,
        },
        quantidade
      );

      adicionouAlgo = true;
    });

    if (semId.length > 0) {
      setAvisoRecompra(
        `Alguns itens não puderam ser adicionados por não terem um ID de produto: ${semId.join(
          ", "
        )}.`
      );
    }

    if (!adicionouAlgo) {
      setAvisoRecompra(
        "Nenhum item desse pedido pôde ser adicionado ao carrinho."
      );
    }
  };

  // Recompra: só roda automaticamente se veio de "Comprar novamente"
  useEffect(() => {
    if (!fromReorder) return;
    if (jaRecomprouRef.current) return;

    const itens = pedidoParaRecompra?.itens;
    if (!itens || itens.length === 0) {
      setRecompraEmAndamento(false);
      return;
    }

    const mercadoPedido =
      pedidoParaRecompra?.id_mercado ||
      pedidoParaRecompra?.external_store_id ||
      null;

    const nomeMercadoPedido =
      pedidoParaRecompra?.nome_mercado ||
      pedidoParaRecompra?.market_name ||
      pedidoParaRecompra?.external_store_id ||
      "este mercado";

    const pedidoId = pedidoParaRecompra?.id;

    // Se já tem itens no carrinho, valida 1 mercado / 1 pedido
    if (carrinho.length > 0) {
      const primeiro = carrinho[0];

      const mercadoAtual =
        primeiro.id_mercado || primeiro.external_store_id || null;
      const pedidoOrigemAtual = primeiro.pedidoOrigemId || null;

      // 1) Mercado diferente
      if (mercadoAtual && mercadoPedido && mercadoAtual !== mercadoPedido) {
        setModalInfo({
          show: true,
          message: `Você já tem itens do mercado ${primeiro.nomeMercado ||
            mercadoAtual} no carrinho. Limpe o carrinho para comprar nesse local.`,
          pedido: pedidoParaRecompra,
          mercadoPedido,
          nomeMercadoPedido,
          pedidoId,
        });
        jaRecomprouRef.current = true;
        setRecompraEmAndamento(false);
        return;
      }

      // 2) Mesmo mercado, mas outro pedido
      if (pedidoOrigemAtual && pedidoId && pedidoOrigemAtual !== pedidoId) {
        setModalInfo({
          show: true,
          message:
            "Você já tem itens de uma compra diferente no carrinho. Limpe o carrinho para recomprar outro pedido.",
          pedido: pedidoParaRecompra,
          mercadoPedido,
          nomeMercadoPedido,
          pedidoId,
        });
        jaRecomprouRef.current = true;
        setRecompraEmAndamento(false);
        return;
      }

      // 3) Itens normais no carrinho (sem origem de pedido)
      if (!pedidoOrigemAtual) {
        setModalInfo({
          show: true,
          message:
            "Seu carrinho já possui itens. Limpe o carrinho para usar a função de comprar novamente.",
          pedido: pedidoParaRecompra,
          mercadoPedido,
          nomeMercadoPedido,
          pedidoId,
        });
        jaRecomprouRef.current = true;
        setRecompraEmAndamento(false);
        return;
      }
    }

    // Sem conflito: adiciona direto
    adicionarItensDesdePedido(
      pedidoParaRecompra,
      mercadoPedido,
      nomeMercadoPedido,
      pedidoId
    );

    jaRecomprouRef.current = true;
    setRecompraEmAndamento(false);
    navigate("/carrinho", { replace: true, state: null });
  }, [
    fromReorder,
    pedidoParaRecompra,
    carrinho,
    addItem,
    navigate,
  ]);

  const handleModalCancelar = () => {
    setModalInfo((prev) => ({ ...prev, show: false }));
    navigate("/carrinho", { replace: true, state: null });
  };

  const handleModalLimparERecomprar = () => {
    if (!modalInfo.pedido) {
      setModalInfo((prev) => ({ ...prev, show: false }));
      return;
    }

    clearCart();
    adicionarItensDesdePedido(
      modalInfo.pedido,
      modalInfo.mercadoPedido,
      modalInfo.nomeMercadoPedido,
      modalInfo.pedidoId
    );

    setModalInfo({
      show: false,
      message: "",
      pedido: null,
      mercadoPedido: null,
      nomeMercadoPedido: "",
      pedidoId: null,
    });

    navigate("/carrinho", { replace: true, state: null });
  };

  // Sincroniza inputs de quantidade com o carrinho
  useEffect(() => {
    const novosValores = {};
    carrinho.forEach((item) => {
      novosValores[item.id] = item.quantidade;
    });

    const mudou =
      JSON.stringify(novosValores) !== JSON.stringify(valoresRef.current);

    if (mudou) {
      valoresRef.current = novosValores;
      setValoresInputs(novosValores);
    }
  }, [carrinho]);

  // Atualiza dados visuais com produtos, se existirem
  const carrinhoComProdutos = carrinho.map((itemCarrinho) => {
    const todos = produtos.todos || [];
    const produtoAtual = todos.find((p) => p.id === itemCarrinho.id);
    return produtoAtual
      ? {
          ...itemCarrinho,
          nome: produtoAtual.nome,
          preco: produtoAtual.preco,
          preco_final: produtoAtual.preco_final,
          imagem: produtoAtual.imagemUrl || produtoAtual.imagem || "",
          estoqueDisponivel:
            produtoAtual.quantidade ??
            itemCarrinho.estoque ??
            itemCarrinho.quantidade ??
            1,
        }
      : {
          ...itemCarrinho,
          estoqueDisponivel:
            itemCarrinho.estoque ??
            itemCarrinho.quantidade ??
            1,
        };
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

  const handleChangeQuantidade = (valorDigitado, id, estoque) => {
    let value = parseInt(valorDigitado, 10);

    if (isNaN(value) || value < 1) {
      value = 1;
      setMensagemErro((prev) => ({
        ...prev,
        [id]: "A quantidade mínima é 1",
      }));
    } else if (value > estoque) {
      value = estoque;
      setMensagemErro((prev) => ({
        ...prev,
        [id]: `Quantidade máxima disponível é ${estoque}`,
      }));
    } else {
      setMensagemErro((prev) => ({ ...prev, [id]: "" }));
    }

    setValoresInputs((prev) => ({ ...prev, [id]: value }));
    updateItemQuantity(id, value, estoque);
  };

  if (carrinho.length === 0 && !recompraEmAndamento) {
    return (
      <>
        <Header />
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

        {modalInfo.show && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Atenção</h3>
              <p>{modalInfo.message}</p>
              <div className={styles.modalButtons}>
                <button
                  className={styles.modalPrimary}
                  onClick={handleModalLimparERecomprar}
                >
                  Limpar carrinho
                </button>
                <button
                  className={styles.modalSecondary}
                  onClick={handleModalCancelar}
                >
                  Deixar para lá
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Header />
      <NavBar />

      <div className={styles.cartContainer}>
        <h2>Meu Carrinho</h2>

        {avisoRecompra && (
          <p className={styles.recompraAviso}>{avisoRecompra}</p>
        )}

        <div className={styles.cartItems}>
          {carrinhoComProdutos.map(
            ({
              id,
              nome,
              preco,
              preco_final,
              quantidade,
              imagem,
              estoqueDisponivel,
            }) => {
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
                        max={estoqueDisponivel}
                        value={valoresInputs[id] ?? quantidade}
                        onChange={(e) =>
                          handleChangeQuantidade(
                            e.target.value,
                            id,
                            estoqueDisponivel
                          )
                        }
                      />
                      <span className={styles.estoqueInfo}>
                        (máx: {estoqueDisponivel})
                      </span>
                    </div>

                    {mensagemErro[id] && (
                      <p className={styles.errorMessage}>
                        {mensagemErro[id]}
                      </p>
                    )}

                    <p>
                      Subtotal:{" "}
                      <strong>
                        R$ {(precoUsado * quantidade).toFixed(2)}
                      </strong>
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
              onClick={() => navigate("/checkout-pedido")}
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

      {modalInfo.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Atenção</h3>
            <p>{modalInfo.message}</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalPrimary}
                onClick={handleModalLimparERecomprar}
              >
                Limpar carrinho
              </button>
              <button
                className={styles.modalSecondary}
                onClick={handleModalCancelar}
              >
                Deixar para lá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CartPage;
