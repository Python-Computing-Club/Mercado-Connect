import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarPedidos } from "../../services/firestore/pedidos";
import { Container, Card, Button } from "react-bootstrap";
import styles from "./pedidos.module.css";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const irParaAcompanhamento = (id) => {
    navigate(`/acompanhar-pedido/${id}`);
  };

  const voltarParaHome = () => {
    navigate("/home");
  };

  const podeAcompanhar = (status) => {
    const statusBloqueados = [
      "Pedido recusado — reembolso iniciado",
      "Pedido recusado",
      "Produto entregue",
      "Entregue",
      "Pedido finalizado",
      "Pedido concluído"
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

      <h2>Meus Pedidos</h2>

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        pedidos.map((pedido) => (
          <Card key={pedido.id} className={styles.card}>
            <Card.Body>
              <Card.Title>ID: {pedido.id}</Card.Title>
              <Card.Text><strong>Status:</strong> {pedido.status}</Card.Text>
              <Card.Text><strong>Valor Total:</strong> R$ {typeof pedido.valor_total === "number" ? pedido.valor_total.toFixed(2) : pedido.valor_total}</Card.Text>

              {podeAcompanhar(pedido.status) ? (
                <Button
                  variant="primary"
                  onClick={() => irParaAcompanhamento(pedido.id)}
                >
                  Acompanhar Pedido
                </Button>
              ) : (
                <p style={{ color: "gray", fontStyle: "italic" }}>
                  Acompanhamento indisponível para este pedido.
                </p>
              )}
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
}
