import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Spinner,
  Tabs,
  Tab,
  Card
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
import PedidoCard from "../../components/Cards/PedidoCards";
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

  const navigate = useNavigate();

  useEffect(() => {
    const entidadeRaw = localStorage.getItem("entidade");

    if (!entidadeRaw) {
      console.warn("⚠️ Entidade não encontrada no localStorage.");
      setLoading(false);
      return;
    }

    try {
      const entidade = JSON.parse(entidadeRaw);

      if (!entidade?.id) {
        console.warn("⚠️ ID da entidade ausente.");
        setLoading(false);
        return;
      }

      const mercadoRef = doc(db, "mercados", entidade.id);

      getDoc(mercadoRef).then((snapshot) => {
        if (snapshot.exists()) {
          const mercadoData = snapshot.data();
          setMercado({ id: snapshot.id, ...mercadoData });
        } else {
          console.warn("⚠️ Mercado não encontrado no Firestore.");
          setMercado(null);
        }
      }).catch((err) => {
        console.error("❌ Erro ao buscar mercado do Firestore:", err);
      }).finally(() => {
        setLoading(false);
      });

    } catch (err) {
      console.error("❌ Erro ao parsear entidade:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mercado?.id) return;

    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, where("id_mercado", "==", mercado.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("📦 Pedidos recebidos do Firestore:", lista);
      setPedidos(lista);
      setLoading(false);
    }, (error) => {
      console.error("❌ Erro ao escutar pedidos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mercado?.id]);

  useEffect(() => {
    const historicos = pedidos.filter((pedido) =>
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

        if (!statusUber || !statusMap[statusUber]) {
          console.log(`🔒 Status da Uber ignorado: ${statusUber}`);
          continue;
        }

        const statusTraduzido = statusMap[statusUber];

        if (statusTraduzido !== pedido.status) {
          await atualizarPedido(pedido.id, { status: statusTraduzido });
          console.log(`🔄 Pedido ${pedido.id} sincronizado: ${statusUber} → ${statusTraduzido}`);
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
      console.log(`✅ Pedido ${idPedido} atualizado para: ${novoStatus}`);
    } catch (error) {
      console.error("❌ Erro ao atualizar status no Firestore:", error);
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
      console.log("🟢 Aceitar pedido:", pedido.id, pedido.status);

      if (pedido.status === "Aguardando confirmação" || pedido.status === "Aguardando confirmação da loja") {
        await atualizarStatus(pedido.id, "Confirmado");
      } else if (pedido.status === "Confirmado") {
        await atualizarStatus(pedido.id, "Loja está montando seu pedido");
      } else if (pedido.status === "Loja está montando seu pedido") {
        const enderecoUsuario = pedido.endereco_usuario;

        if (!mercado || !mercado.endereco || !enderecoUsuario) {
          console.warn("❌ Dados ausentes: mercado ou endereço do cliente não disponíveis.");
          return;
        }

        if (!pedido.quote_id) {
          console.warn("❌ Pedido não possui quote_id, entrega não será criada.");
          return;
        }

        const camposUsuario = ["lat", "lng", "rua", "numero", "bairro", "cidade", "estado", "cep"];
        const camposMercado = ["logradouro", "numero", "bairro", "cidade", "estado", "cep", "lat", "lng"];

        if (!mercado.endereco.logradouro && mercado.endereco.endereco) {
          mercado.endereco.logradouro = mercado.endereco.endereco;
        }

        const faltandoUsuario = validarCampos(enderecoUsuario, camposUsuario);
        const faltandoMercado = validarCampos(mercado.endereco, camposMercado);

        if (faltandoUsuario.length || faltandoMercado.length) {
          console.warn("❌ Endereço incompleto:");
          if (faltandoUsuario.length) console.warn("Cliente:", faltandoUsuario);
          if (faltandoMercado.length) console.warn("Mercado:", faltandoMercado);
          return;
        }

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
          console.log("🚚 Entrega criada com sucesso:", entrega);
        } else {
          console.warn("❌ Falha ao criar entrega Uber.");
        }
      }
    } catch (error) {
      console.error("❌ Erro no handleAceitar:", error);
    }
  };

  const handleRecusar = async (pedido) => {
    try {
      console.log("🔴 Recusar pedido:", pedido.id, pedido.status);

      if (pedido.status === "Aguardando confirmação" || pedido.status === "Aguardando confirmação da loja") {
        if (pedido.payment_id) {
          await criarReembolso(pedido.payment_id);
          console.log("💸 Reembolso iniciado para:", pedido.payment_id);
        }
        await atualizarStatus(pedido.id, "Pedido recusado — reembolso iniciado");
      }
    } catch (error) {
      console.error("❌ Erro no handleRecusar:", error);
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
      status !== "pedido recusado — reembolso iniciado"
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
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAceitar={handleAceitar}
                onRecusar={handleRecusar}
              />
            ))
          )}
        </Tab>

        <Tab eventKey="historico" title="Histórico">
          {historico.length === 0 ? (
            <p>Sem pedidos finalizados ou recusados.</p>
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