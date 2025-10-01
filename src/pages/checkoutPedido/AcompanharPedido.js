import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { atualizarPedido } from "../../services/firestore/pedidos";
import { Container, ProgressBar, Card, Button } from "react-bootstrap";
import styles from "./acompanhar-pedido.module.css";

export default function AcompanhamentoPedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [mercado, setMercado] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const statusEtapas = [
    "Aguardando confirmação da loja",
    "Confirmado",
    "Loja está montando seu pedido",
    "Produto está a caminho",
    "Pedido recusado — reembolso iniciado",
    "Pedido finalizado"
  ];

  useEffect(() => {
    if (!id || typeof id !== "string" || id.trim() === "") {
      setErro("ID do pedido não informado ou inválido.");
      return;
    }

    const pedidoRef = doc(db, "pedidos", id);

    const unsubscribe = onSnapshot(
      pedidoRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const pedidoData = snapshot.data();
          setPedido(pedidoData);
          setUltimaAtualizacao(new Date());

          if (pedidoData.id_mercado) {
            try {
              const mercadoRef = doc(db, "mercados", pedidoData.id_mercado);
              const mercadoSnap = await getDoc(mercadoRef);
              if (mercadoSnap.exists()) {
                setMercado(mercadoSnap.data());
              } else {
                setMercado(null);
              }
            } catch (err) {
              console.error("Erro ao buscar mercado:", err);
              setMercado(null);
            }
          } else {
            setMercado(null);
          }
        } else {
          setPedido(null);
          setMercado(null);
          setUltimaAtualizacao(null);
          setErro("Pedido não encontrado.");
        }
      },
      (snapshotError) => {
        console.error("Erro no snapshot:", snapshotError);
        setErro("Erro ao escutar o pedido.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [id]);

  const progresso = () => {
    if (!pedido || !pedido.status) return 0;
    const index = statusEtapas.indexOf(pedido.status);
    if (index >= 0) {
      return ((index + 1) / statusEtapas.length) * 100;
    }
    return 100;
  };

  const formatarValor = (valor) => {
    if (typeof valor === "number") {
      return `R$ ${valor.toFixed(2)}`;
    }
    if (typeof valor === "string" && !isNaN(valor)) {
      return `R$ ${parseFloat(valor).toFixed(2)}`;
    }
    return "A calcular";
  };

  const podeConfirmarEntrega = pedido?.status === "Produto está a caminho";

  const confirmarEntrega = async () => {
    if (!id) return;
    setConfirmando(true);
    try {
      await atualizarPedido(id, { status: "Pedido finalizado" });
      navigate("/pedidos");
    } catch (error) {
      console.error("Erro ao confirmar entrega:", error);
      alert("Erro ao confirmar entrega.");
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Container className={styles.container}>
      <div className={styles.backButtonWrapper}>
        <Button variant="secondary" onClick={() => navigate("/home")}>
          ← Voltar para Home
        </Button>
      </div>

      <h2 className={styles.title}>Acompanhamento do Pedido</h2>

      {erro ? (
        <p>{erro}</p>
      ) : !pedido ? (
        <p>Buscando pedido...</p>
      ) : (
        <Card className={styles.card}>
          <Card.Body>
            {mercado && (
              <div className={styles.mercadoInfo}>
                <img
                  src={mercado.logo?.url || "https://via.placeholder.com/50"}
                  alt={mercado.estabelecimento || "Logo do mercado"}
                  className={styles.mercadoLogo}
                />
                <div className={styles.mercadoNome}>
                  <strong>{mercado.estabelecimento || "Mercado"}</strong>
                </div>
              </div>
            )}

            <Card.Text>
              <strong>Status atual:</strong> {pedido.status}
            </Card.Text>
            <Card.Text>
              <strong>Valor total:</strong> {formatarValor(pedido.valor_total)}
            </Card.Text>
            <Card.Text>
              <strong>Data do pedido:</strong> {pedido.data_pedido}
            </Card.Text>

            <ProgressBar
              now={progresso()}
              label={`${Math.round(progresso())}%`}
              className={styles.progress}
            />

            <ul className={styles.etapas}>
              {statusEtapas.map((etapa, index) => (
                <li
                  key={index}
                  className={pedido.status === etapa ? styles.ativo : ""}
                >
                  {etapa}
                </li>
              ))}
              {pedido.status && !statusEtapas.includes(pedido.status) && (
                <li className={styles.ativo}>{pedido.status}</li>
              )}
            </ul>

            {podeConfirmarEntrega && (
              <Button
                variant="success"
                className="mt-3"
                onClick={confirmarEntrega}
                disabled={confirmando}
              >
                {confirmando ? "Confirmando..." : "Confirmar entrega"}
              </Button>
            )}

            {ultimaAtualizacao && (
              <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
                Última atualização: {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
              </p>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
