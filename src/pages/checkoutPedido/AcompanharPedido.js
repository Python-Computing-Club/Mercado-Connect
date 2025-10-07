import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { atualizarPedido } from "../../services/firestore/pedidos";
import { Container, ProgressBar, Card, Button } from "react-bootstrap";
import { useTextBeeSms } from "../../hooks/useTextBeeSms";
import styles from "./acompanhar-pedido.module.css";
import emailjs from "@emailjs/browser";
import emiteNFE from "../../utils/emiteNFE";
import { consultarEntregaUber } from "../../hooks/consultarEntregaUber";

export default function AcompanhamentoPedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [mercado, setMercado] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("userSession"));
  const { sendSms } = useTextBeeSms();

  // Status base da loja (Firebase)
  const statusEtapasBase = [
    "Aguardando confirmação da loja",
    "Confirmado",
    "Loja está montando seu pedido"
  ];

  const statusUberParaUsuario = {
    pending: "Aguardando aceitação do entregador",
    accepted: "Entregador aceitou a corrida",
    pickup: "Entregador está retirando seu pedido",
    dropoff: "Entregador está entregando seu pedido",
    delivered: "Pedido entregue"
  };

  const statusEtapas = pedido?.reembolso
    ? [
        ...statusEtapasBase,
        ...Object.values(statusUberParaUsuario),
        "Pedido recusado — reembolso iniciado"
      ]
    : [...statusEtapasBase, ...Object.values(statusUberParaUsuario)];

  const enviarAtualizacaoPedido = async (status) => {
    let contato = "";
    if (usuario.email === "") {
      contato = usuario.telefone;
      sendSms(contato, status);
    } else if (usuario.telefone === "") {
      contato = usuario.email;
      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          { to_email: contato, status },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
      } catch (err) {
        console.error(err);
      }
    } else {
      contato = usuario.telefone;
      sendSms(contato, status);
    }
    console.log("Atualização de status de pedido enviada ao usuário!");
  };

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

          let mensagem = "";
          switch (pedidoData.status) {
            case "Confirmado":
              mensagem = "Seu pedido já foi confirmado pela loja!";
              emiteNFE(pedidoData, snapshot.id);
              enviarAtualizacaoPedido(mensagem);
              break;
            case "Loja está montando seu pedido":
              mensagem = "Seu pedido já está sendo preparado!";
              enviarAtualizacaoPedido(mensagem);
              break;
            case "Produto está a caminho":
              mensagem = "Seu pedido já está pronto e está a caminho!";
              enviarAtualizacaoPedido(mensagem);
              break;
            case "Pedido recusado — reembolso iniciado":
              mensagem = "Já recebemos a recusa de seu pedido e estamos aplicando o reembolso";
              enviarAtualizacaoPedido(mensagem);
              break;
            case "Pedido finalizado":
              mensagem = "Seu pedido foi entregue! Obrigado por comprar com Mercado Connect :)";
              break;
          }

          if (pedidoData.id_mercado) {
            try {
              const mercadoRef = doc(db, "mercados", pedidoData.id_mercado);
              const mercadoSnap = await getDoc(mercadoRef);
              setMercado(mercadoSnap.exists() ? mercadoSnap.data() : null);
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

  useEffect(() => {
    if (
      !pedido ||
      pedido.entrega !== "Entrega via Uber" ||
      !pedido.delivery_id ||
      pedido.status === "Pedido finalizado" ||
      pedido.status === "Pedido recusado — reembolso iniciado"
    )
      return;

    let ativo = true;

    const polling = async () => {
      if (!ativo) return;
      try {
        const statusUber = await consultarEntregaUber(pedido.delivery_id);

        if (!statusUber) return;

        const statusLoja = statusUberParaUsuario[statusUber];

        if (!statusLoja) {
          console.log(`🔒 Status Uber ignorado no mapeamento: ${statusUber}`);
          return;
        }

        if (statusLoja !== pedido.status) {
          await atualizarPedido(id, { status: statusLoja });
          console.log(`🔄 Status sincronizado com Uber: ${statusUber} → ${statusLoja}`);
        }
      } catch (err) {
        console.error("Erro ao consultar status Uber:", err);
      }
    };

    polling();
    const intervalId = setInterval(polling, 10000);

    return () => {
      ativo = false;
      clearInterval(intervalId);
    };
  }, [pedido, id]);

  const progresso = () => {
    if (!pedido || !pedido.status) return 0;
    const index = statusEtapas.indexOf(pedido.status);
    return index >= 0 ? ((index + 1) / statusEtapas.length) * 100 : 100;
  };

  const formatarValor = (valor) => {
    if (typeof valor === "number") return `R$ ${valor.toFixed(2)}`;
    if (typeof valor === "string" && !isNaN(valor)) return `R$ ${parseFloat(valor).toFixed(2)}`;
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
                <li key={index} className={pedido.status === etapa ? styles.ativo : ""}>
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

            {pedido.tracking_url &&
              [
                "Aguardando aceitação do entregador",
                "Entregador aceitou a corrida",
                "Entregador está retirando seu pedido",
                "Entregador está entregando seu pedido",
                "Pedido entregue"
              ].includes(pedido.status) && (
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
