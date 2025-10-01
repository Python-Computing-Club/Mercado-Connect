import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Spinner,
  Tabs,
  Tab
} from "react-bootstrap";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../services/firebase";
import PedidoCard from "../../components/Cards/PedidoCards";
import styles from "./gerenciar-pedido.module.css";
import { criarReembolso } from "../../services/MercadoPago";

export default function GerenciarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [activeTab, setActiveTab] = useState("ativos");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const mercado = JSON.parse(localStorage.getItem("entidade"));

  useEffect(() => {
    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, where("id_mercado", "==", mercado.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPedidos(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mercado.id]);

  useEffect(() => {
    const historicos = pedidos.filter((pedido) =>
      pedido.status === "Produto está a caminho" ||
      pedido.status === "Pedido recusado — reembolso iniciado" ||
      pedido.status === "Entregue" ||
      pedido.status === "Pedido finalizado"
    );
    setHistorico(historicos);
  }, [pedidos]);

  const atualizarStatus = async (idPedido, novoStatus) => {
    try {
      const pedidoRef = doc(db, "pedidos", idPedido);
      await updateDoc(pedidoRef, { status: novoStatus });
      console.log(`Pedido ${idPedido} status atualizado para: ${novoStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status no Firestore:", error);
    }
  };

  const handleAceitar = async (pedido) => {
    try {
      console.log("Clicou aceitar:", pedido.id, pedido.status);
      if (pedido.status === "Aguardando confirmação" || pedido.status === "Aguardando confirmação da loja") {
        await atualizarStatus(pedido.id, "Confirmado");
      } else if (pedido.status === "Confirmado") {
        await atualizarStatus(pedido.id, "Loja está montando seu pedido");
      } else if (pedido.status === "Loja está montando seu pedido") {
        await atualizarStatus(pedido.id, "Produto está a caminho");
      }
    } catch (error) {
      console.error("Erro no handleAceitar:", error);
    }
  };

  const handleRecusar = async (pedido) => {
    try {
      console.log("Clicou recusar:", pedido.id, pedido.status);
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

  const pedidosAtivos = pedidos.filter((pedido) =>
    pedido.status !== "Produto está a caminho" &&
    pedido.status !== "Pedido recusado — reembolso iniciado" &&
    pedido.status !== "Pedido finalizado" &&
    pedido.status !== "Entregue"
  );

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
            historico.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} historico />
            ))
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}
