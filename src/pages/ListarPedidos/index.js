import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarPedidos } from "../../services/firestore/pedidos";
import { buscarMercadoPorId } from "../../services/firestore/mercados";
import { Container, Card, Button } from "react-bootstrap";
import styles from "./pedidos.module.css";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mercados, setMercados] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        const dados = await listarPedidos();
        setPedidos(dados || []);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  useEffect(() => {
    const carregarMercados = async () => {
      const ids = [
        ...new Set(
          pedidos
            .map((p) => p.id_mercado)
            .filter(Boolean)
        ),
      ];

      if (ids.length === 0) return;

      try {
        const resultados = await Promise.all(
          ids.map((id) => buscarMercadoPorId(id))
        );

        const map = {};
        resultados.forEach((mercado, index) => {
          if (mercado) {
            map[ids[index]] = mercado;
          }
        });

        setMercados(map);
      } catch (e) {
        console.error("Erro ao carregar mercados dos pedidos:", e);
      }
    };

    if (pedidos.length > 0) {
      carregarMercados();
    }
  }, [pedidos]);

  const irParaAcompanhamento = (id) => {
    navigate(`/acompanhar-pedido/${id}`);
  };

  const voltarParaHome = () => {
    navigate("/home");
  };

  const recomprarPedido = (pedido) => {
    navigate("/carrinho", {
      state: {
        pedidoParaRecompra: pedido,
        fromReorder: true,
      },
    });
  };

  const podeAcompanhar = (status) => {
    const statusBloqueados = [
      "Pedido recusado — reembolso iniciado",
      "Pedido recusado",
      "Produto entregue",
      "Entregue",
      "Pedido finalizado",
      "Pedido concluído",
    ];
    return !statusBloqueados.includes(status);
  };

  return (
    <Container className={styles.container}>
      <div className={styles.backButtonWrapper}>
        <Button variant="secondary" onClick={voltarParaHome}>
          ← Voltar para Home
        </Button>
      </div>

      <h2 className={styles.title}>Meus Pedidos</h2>

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        pedidos.map((pedido) => {
          const primeiroItem = pedido.itens && pedido.itens[0];
          const imagemProduto =
            primeiroItem?.imagemUrl ||
            primeiroItem?.imagem ||
            primeiroItem?.imageUrl ||
            primeiroItem?.foto;

          const mercadoDoPedido = pedido.id_mercado
            ? mercados[pedido.id_mercado]
            : null;

          const nomeEstabelecimento =
            pedido.estabelecimento ||
            mercadoDoPedido?.estabelecimento ||
            mercadoDoPedido?.nome ||
            mercadoDoPedido?.nome_fantasia ||
            mercadoDoPedido?.razao_social ||
            "Estabelecimento";

          return (
            <Card key={pedido.id} className={styles.card}>
              <Card.Body>
                <div className={styles.headerRow}>
                  <Card.Title className={styles.cardTitle}>
                    {`Pedido de ${nomeEstabelecimento}`}
                  </Card.Title>
                  <span className={styles.statusBadge}>
                    {pedido.status}
                  </span>
                </div>

                <p className={styles.orderId}>ID: {pedido.id}</p>

                <Card.Text className={styles.cardText}>
                  <strong>Valor Total:</strong>{" "}
                  R{"$ "}
                  {typeof pedido.valor_total === "number"
                    ? pedido.valor_total.toFixed(2)
                    : pedido.valor_total}
                </Card.Text>

                {primeiroItem && (
                  <div className={styles.productThumbWrapper}>
                    {imagemProduto && (
                      <img
                        src={imagemProduto}
                        alt={primeiroItem.nome || "Produto do pedido"}
                        className={styles.productThumb}
                      />
                    )}
                    <div className={styles.productThumbInfo}>
                      <span className={styles.productThumbName}>
                        {primeiroItem.nome || "Produto do pedido"}
                      </span>
                      {pedido.itens.length > 1 && (
                        <span className={styles.productThumbExtra}>
                          + {pedido.itens.length - 1} item(s)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.actions}>
                  {podeAcompanhar(pedido.status) ? (
                    <Button
                      variant="success"
                      className={styles.actionButton}
                      onClick={() => irParaAcompanhamento(pedido.id)}
                    >
                      Acompanhar Pedido
                    </Button>
                  ) : (
                    <p className={styles.acompanhamentoIndisponivel}>
                      Acompanhamento indisponível para este pedido.
                    </p>
                  )}

                  <Button
                    variant="success"
                    className={`${styles.actionButton} ${styles.reorderButton}`}
                    onClick={() => recomprarPedido(pedido)}
                  >
                    Comprar novamente
                  </Button>
                </div>
              </Card.Body>
            </Card>
          );
        })
      )}
    </Container>
  );
}
