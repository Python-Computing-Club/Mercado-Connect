import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import styles from "../../pages/painelMercado/gerenciar-pedido.module.css";

export default function PedidoCard({ pedido, historico = false, onAceitar, onRecusar }) {
  const [tempo, setTempo] = useState(10);
  const [removido, setRemovido] = useState(false);

  const statusLower = pedido.status?.toLowerCase().trim() || "";
  const deveRemover = statusLower.includes("recusado");

  useCodigoTimer({
    active: deveRemover,
    duration: 10,
    setTime: setTempo,
    onExpire: async () => {
      try {
        await deleteDoc(doc(db, "pedidos", pedido.id));
        setRemovido(true);
      } catch (error) {
        console.error("Erro ao deletar pedido:", error);
      }
    }
  });

  if (removido) return null;

  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title className={styles.cardTitle}>Pedido de {pedido.id_usuario}</Card.Title>
        <Card.Text><strong>Status:</strong> {pedido.status}</Card.Text>
        <Card.Text>
          <strong>Valor:</strong> R${" "}
          {typeof pedido.valor_total === "number"
            ? pedido.valor_total.toFixed(2)
            : pedido.valor_total}
        </Card.Text>
        <Card.Text><strong>Data:</strong> {pedido.data_pedido}</Card.Text>

        {!historico && (
          <>
            {(statusLower === "aguardando confirmação" || statusLower === "aguardando confirmação da loja") && (
              <>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => onAceitar?.(pedido)}
                >
                  Aceitar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onRecusar?.(pedido)}
                >
                  Recusar
                </Button>
              </>
            )}

            {statusLower === "confirmado" && (
              <Button
                variant="primary"
                onClick={() => onAceitar?.(pedido)}
              >
                Montar Pedido
              </Button>
            )}

            {statusLower === "loja está montando seu pedido" && (
              <Button
                variant="primary"
                onClick={() => onAceitar?.(pedido)}
              >
                Enviar Pedido
              </Button>
            )}

            {statusLower === "aguardando aceite do entregador" && (
              <p className={styles.aguardando}>
                Pedido enviado à Uber. Aguardando aceite do entregador.
              </p>
            )}

            {statusLower === "produto está a caminho" && (
              <>
                <p className={styles.finalizado}>
                  Pedido finalizado e a caminho do cliente.
                </p>
            {pedido.tracking_url && (
                  <div className="mt-3">
                    <h6>Entrega em tempo real:</h6>
                    <Button
                      variant="outline-primary"
                      href={pedido.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkEntrega}
                    >
                      Ver rastreamento da entrega
                    </Button>
                  </div>
                )}
              </>
            )}

            {deveRemover && (
              <p className={styles.recusado}>
                Pedido recusado. Reembolso em andamento.<br />
                Removendo em {tempo} segundos...
              </p>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}