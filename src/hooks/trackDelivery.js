import React, { useEffect, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { trackDelivery } from "../../hooks/trackDelivery";

export default function RastreamentoEntrega({ pedido }) {
  const [statusUber, setStatusUber] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!pedido?.delivery_id) return;

      const result = await trackDelivery(pedido.delivery_id);
      if (result) {
        setStatusUber(result.status);
        setTrackingUrl(result.trackingUrl);
      }
      setLoading(false);
    };

    fetchStatus();
  }, [pedido?.delivery_id]);

  const podeMostrar =
    statusUber === "accepted" ||
    statusUber === "en_route_to_pickup" ||
    statusUber === "delivered";

  return (
    <Card className="mt-3">
      <Card.Body>
        <h5>Entrega em tempo real</h5>

        {loading ? (
          <Spinner animation="border" />
        ) : podeMostrar && trackingUrl ? (
          <Button
            variant="outline-primary"
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver rastreamento da entrega
          </Button>
        ) : (
          <p>
            Estamos aguardando o entregador parceiro aceitar a corrida. Assim que ele estiver a caminho, você poderá acompanhar a entrega em tempo real.
          </p>
        )}
      </Card.Body>
    </Card>
  );
}