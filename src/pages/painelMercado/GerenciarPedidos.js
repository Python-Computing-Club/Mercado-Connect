import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Spinner,
  Tabs,
  Tab,
  Card,
  Button
} from "react-bootstrap";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDoc
} from "firebase/firestore";
import { db } from "../../services/firebase";
import styles from "./gerenciar-pedido.module.css";
import { criarReembolso } from "../../services/MercadoPago";
import { createDelivery } from "../../hooks/createDelivery";
import { consultarEntregaUber } from "../../hooks/consultarEntregaUber";
import { atualizarPedido } from "../../services/firestore/pedidos";

export default function GerenciarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [activeTab, setActiveTab] = useState("ativos");
  const [loading, setLoading] = useState(true);
  const [mercado, setMercado] = useState(null);
  const [entregasEmCriacao, setEntregasEmCriacao] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const entidadeRaw = localStorage.getItem("entidade");
    if (!entidadeRaw) return;

    try {
      const entidade = JSON.parse(entidadeRaw);
      if (!entidade?.id) return;

      const mercadoRef = doc(db, "mercados", entidade.id);
      getDoc(mercadoRef).then((snapshot) => {
        if (snapshot.exists()) {
          const mercadoData = snapshot.data();
          setMercado({ id: snapshot.id, ...mercadoData });
        }
      });
    } catch (err) {
      console.error("Erro ao carregar mercado:", err);
    }
  }, []);

  useEffect(() => {
    if (!mercado?.id) return;

    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, where("id_mercado", "==", mercado.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPedidos(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mercado?.id]);

  useEffect(() => {
    const historicos = pedidos.filter((pedido) =>
      pedido.delivery_id ||
      pedido.status === "Pedido recusado — reembolso iniciado" ||
      pedido.status === "Entregue" ||
      pedido.status === "Pedido finalizado"
    );
    setHistorico(historicos);
  }, [pedidos]);

  useEffect(() => {
    const sincronizarTodosPedidosUber = async () => {
      const statusMap = {
        accepted: "Entregador aceitou a corrida",
        en_route_to_pickup: "Entregador saiu para entrega",
        delivered: "Pedido finalizado"
      };

      const pedidosUber = pedidos.filter(p =>
        p.entrega === "Entrega via Uber" &&
        p.delivery_id &&
        p.status !== "Pedido finalizado"
      );

      for (const pedido of pedidosUber) {
        const statusUber = await consultarEntregaUber(pedido.delivery_id);
        if (!statusUber || !statusMap[statusUber]) continue;

        const statusTraduzido = statusMap[statusUber];
        if (statusTraduzido !== pedido.status) {
          await atualizarPedido(pedido.id, { status: statusTraduzido });
        }
      }
    };

    if (pedidos.length > 0) {
      sincronizarTodosPedidosUber();
    }
  }, [pedidos]);

  const atualizarStatus = async (idPedido, novoStatus) => {
    try {
      const pedidoRef = doc(db, "pedidos", idPedido);
      await updateDoc(pedidoRef, { status: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const validarCampos = (obj, campos) => {
    return campos.filter(campo => {
      const valor = obj[campo];
      if (typeof valor === "number") return isNaN(valor);
      return valor === undefined || valor === null || valor === "";
    });
  };

  const handleAceitar = async (pedido) => {
    try {
      if (pedido.status === "Aguardando confirmação" || pedido.status === "Aguardando confirmação da loja") {
        await atualizarStatus(pedido.id, "Confirmado");
      } else if (pedido.status === "Confirmado") {
        await atualizarStatus(pedido.id, "Loja está montando seu pedido");
      } else if (pedido.status === "Loja está montando seu pedido" && !pedido.delivery_id) {
        setEntregasEmCriacao(prev => [...prev, pedido.id]);

        const enderecoUsuario = pedido.endereco_usuario;
        if (!mercado || !mercado.endereco || !enderecoUsuario || !pedido.quote_id) return;

        const camposUsuario = ["lat", "lng", "rua", "numero", "bairro", "cidade", "estado", "cep"];
        const camposMercado = ["logradouro", "numero", "bairro", "cidade", "estado", "cep", "lat", "lng"];

        if (!mercado.endereco.logradouro && mercado.endereco.endereco) {
          mercado.endereco.logradouro = mercado.endereco.endereco;
        }

        const faltandoUsuario = validarCampos(enderecoUsuario, camposUsuario);
        const faltandoMercado = validarCampos(mercado.endereco, camposMercado);
        if (faltandoUsuario.length || faltandoMercado.length) return;

        const entrega = await createDelivery({
          pedido,
          mercado,
          enderecoUsuario,
          quoteId: pedido.quote_id
        });

        if (entrega) {
          await updateDoc(doc(db, "pedidos", pedido.id), {
            delivery_id: entrega.deliveryId,
            tracking_url: entrega.trackingUrl,
            status_entrega: entrega.status
          });
        }

        setEntregasEmCriacao(prev => prev.filter(id => id !== pedido.id));
      }
    } catch (error) {
      console.error("Erro no handleAceitar:", error);
    }
  };

  const handleRecusar = async (pedido) => {
    try {
      if (pedido.status === "Aguardando confirmação" || pedido.status === "Aguardando confirmação da loja") {
        if (pedido.payment_id) {
          await criarReembolso(pedido.payment_id);
        }
        await atualizarStatus(pedido.id, "Pedido recusado — reembolso iniciado");
      }
    } catch (error) {
      console.error("Erro no handleRecusar:", error);
    }
  };

  const pedidosAtivos = pedidos.filter((pedido) => {
    const status = pedido.status?.toLowerCase();
    const statusUber = [
      "entregador aceitou a corrida",
      "entregador saiu para entrega",
      "pedido finalizado",
      "entregue"
    ];
    return (
      !statusUber.includes(status) &&
      status !== "pedido recusado — reembolso iniciado" &&
      !pedido.delivery_id
    );
  });

  const statusMensagens = {
    "Entregador aceitou a corrida": "O entregador parceiro aceitou a corrida.",
    "Entregador saiu para entrega": "O entregador saiu para buscar o pedido.",
    "Produto está a caminho": "O pedido está a caminho do cliente.",
    "Pedido finalizado": "O cliente recebeu o pedido com sucesso.",
    "Pedido recusado — reembolso iniciado": "O pedido foi recusado e o reembolso está em andamento.",
    "Entregue": "O pedido foi entregue."
  };

  return (
    <Container className={styles.container}>
      <div className={styles.backButtonWrapper}>
        <button onClick={() => navigate("/painel-mercado")} className={styles.backButton}>
          ← Voltar para Painel do Mercado
        </button>
      </div>

      <h2 className={styles.title}>Gerenciar Pedidos</h2>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="ativos" title="Pedidos Ativos">
          {loading ? (
            <Spinner animation="border" />
          ) : pedidosAtivos.length === 0 ? (
            <p>Nenhum pedido ativo no momento.</p>
          ) : (
            pedidosAtivos.map((pedido) => (
              <Card key={pedido.id} className={styles.card}>
                <Card.Body>
                  <Card.Title>Pedido de {pedido.id_usuario}</Card.Title>
                  <Card.Text><strong>Status:</strong> {pedido.status}</Card.Text>
                  <Card.Text><strong>Valor:</strong> R$ {pedido.valor_total?.toFixed(2)}</Card.Text>
                  <Button
                    variant="success"
                    onClick={() => handleAceitar(pedido)}
                    disabled={entregasEmCriacao.includes(pedido.id)}
                  >
                    {entregasEmCriacao.includes(pedido.id)
                      ? "Chamando o motorista..."
                      : "Pedir entrega"}
                  </Button>
                  </Card.Body>
                  </Card>
                  ))
                  )}
                  </Tab>

                  <Tab eventKey="historico" title="Histórico">
                    {historico.length === 0 ? (
                      <p>Sem pedidos finalizados ou em entrega.</p>
                    ) : (
                      historico.map((pedido) => {
                        const status = pedido.status;
                        const resumo = statusMensagens[status] || "Status não identificado.";

                        return (
                          <Card key={pedido.id} className={styles.card}>
                            <Card.Body>
                              <Card.Title className={styles.cardTitle}>
                                Pedido de {pedido.id_usuario}
                              </Card.Title>
                              <Card.Text>
                                <strong>Status:</strong> {status}
                              </Card.Text>
                              <Card.Text>
                                <strong>Resumo:</strong> {resumo}
                              </Card.Text>
                              <Card.Text>
                                <strong>Data:</strong> {pedido.data_pedido}
                              </Card.Text>
                              <Card.Text>
                                <strong>Valor:</strong>{" "}
                                {typeof pedido.valor_total === "number"
                                  ? `R$ ${pedido.valor_total.toFixed(2)}`
                                  : pedido.valor_total}
                              </Card.Text>
                            </Card.Body>
                          </Card>
                        );
                      })
                    )}
                </Tab>
           </Tabs>
    </Container>
  );
}