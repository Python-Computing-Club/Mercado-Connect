import { useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import useCodigoTimer from "../../hooks/useCodigoTimer";
import styles from "../../pages/painelMercado/gerenciar-pedido.module.css";

export default function PedidoCard({ pedido, historico = false, onAceitar, onRecusar, chamandoMotorista = false }) {
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
                  disabled={chamandoMotorista}
                >
                  Aceitar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onRecusar?.(pedido)}
                  disabled={chamandoMotorista}
                >
                  Recusar
                </Button>
              </>
            )}

            {statusLower === "confirmado" && (
              <Button
                variant="primary"
                onClick={() => onAceitar?.(pedido)}
                disabled={chamandoMotorista}
              >
                Montar Pedido
              </Button>
            )}

            {statusLower === "loja está montando seu pedido" && (
              <Button
                variant="primary"
                onClick={() => onAceitar?.(pedido)}
                disabled={chamandoMotorista}
              >
                {chamandoMotorista ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Chamando o motorista...
                  </>
                ) : (
                  "Pedir Corrida"
                )}
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
