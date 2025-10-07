import { useEffect, useState } from "react";
import { Card, Button, Modal, Accordion } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { criarPreferencia } from "../../services/MercadoPago";
import { criarPedido } from "../../services/firestore/pedidos";
import { useCart } from "../../Context/CartContext";
import styles from './checkout.module.css';

import { formatUberPayload } from "../../services/formatUberPayload";
import { generateQuote } from "../../hooks/generateQuote";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function CheckoutPedido() {
  const { clearCart } = useCart();

  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState({});
  const [carrinho, setCarrinho] = useState([]);
  const [cotacaoUber, setCotacaoUber] = useState(null);
  const [retirarNaLoja, setRetirarNaLoja] = useState(false);
  const [cotandoEntrega, setCotandoEntrega] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userStorage = JSON.parse(localStorage.getItem('userSession')) || {};
    const cartStorage = JSON.parse(localStorage.getItem('carrinho')) || [];

    setUsuario(userStorage);
    setCarrinho(cartStorage);

    if (userStorage.enderecos && Array.isArray(userStorage.enderecos)) {
      setEnderecos(userStorage.enderecos);
      setEnderecoSelecionado(prev => prev || userStorage.enderecos[0]);
    }
  }, []);

  useEffect(() => {
    async function cotarEntrega() {
      if (retirarNaLoja) {
        setCotacaoUber(null);
        setCotandoEntrega(false);
        return;
      }

      if (!usuario?.id || !carrinho.length || !enderecoSelecionado) {
        setCotandoEntrega(false);
        return;
      }

      setCotandoEntrega(true);

      try {
        const idMercado = carrinho[0]?.id_mercado;
        if (!idMercado) {
          console.warn("⚠️ Carrinho sem id_mercado.");
          setCotandoEntrega(false);
          return;
        }

        const mercadoRef = doc(db, "mercados", idMercado);
        const mercadoSnap = await getDoc(mercadoRef);
        if (!mercadoSnap.exists()) {
          console.warn("⚠️ Mercado não encontrado no Firestore.");
          setCotandoEntrega(false);
          return;
        }

        const mercado = mercadoSnap.data();

        const { total } = carrinho.reduce(
          (acc, item) => {
            const precoUsado = typeof item.preco_final === "number" && item.preco_final < item.preco
              ? item.preco_final
              : item.preco || 0;
            acc.total += precoUsado * item.quantidade;
            return acc;
          },
          { total: 0 }
        );

        const payload = formatUberPayload({
          usuario,
          endereco: enderecoSelecionado,
          mercado,
          carrinho,
          valorTotal: total
        });

        if (!payload) {
          console.warn("⚠️ Payload inválido para cotação Uber.");
          setCotandoEntrega(false);
          return;
        }

        const cotacao = await generateQuote(payload);
        if (cotacao) {
          setCotacaoUber(cotacao);
        } else {
          setCotacaoUber(null);
          console.warn("⚠️ Cotação Uber falhou ou veio nula.");
        }
      } catch (error) {
        console.error("❌ Erro durante cotação Uber:", error);
        setCotacaoUber(null);
      } finally {
        setCotandoEntrega(false);
      }
    }

    cotarEntrega();
  }, [usuario, carrinho, enderecoSelecionado, retirarNaLoja]);

  const totalCarrinho = () => {
    return carrinho.reduce(
      (acc, item) => {
        const precoUsado = typeof item.preco_final === "number" && item.preco_final < item.preco
          ? item.preco_final
          : item.preco || 0;
        acc.total += precoUsado * item.quantidade;
        acc.quantidade += item.quantidade;
        return acc;
      },
      { total: 0, quantidade: 0 }
    );
  };

  const { total, quantidade } = totalCarrinho();
  const valorEntregaVisual = cotacaoUber?.fee ? cotacaoUber.fee / 100 : 0;
  const totalVisual = total + (retirarNaLoja ? 0 : valorEntregaVisual);

  function handleTrocaEndereco() {
    setModal(true);
  }

  function handleSelecionaEndereco(endereco) {
    setEnderecoSelecionado(endereco);
    setModal(false);
  }

  const handlePagamento = async () => {
    const data_hora = new Date();

    if (!retirarNaLoja && !cotacaoUber?.quoteId) {
      alert("A cotação da entrega via Uber ainda está carregando. Aguarde alguns segundos.");
      return;
    }

    if (!usuario?.nome || !usuario?.telefone) {
      alert("Por favor, preencha seu nome e telefone no perfil antes de continuar com o pedido.");
      return;
    }

    const nomeCliente = String(usuario.nome).trim();
    const telefoneCliente = String(usuario.telefone).trim();

    const produtosPagos = carrinho.filter(item => {
      const preco = typeof item.preco_final === 'number' ? item.preco_final : item.preco;
      return preco > 0;
    });

    const pedido = {
      id_usuario: usuario.id,
      id_mercado: carrinho[0]?.id_mercado || "",
      data_pedido: data_hora.toLocaleString("pt-BR"),
      status: "Aguardando confirmação da loja",
      valor_total: total.toFixed(2),
      quote_id: !retirarNaLoja && cotacaoUber?.quoteId ? cotacaoUber.quoteId : null,
      entrega: retirarNaLoja ? "Retirada na loja" : "Entrega via Uber",
      valor_entrega_visual: !retirarNaLoja && cotacaoUber?.fee ? (cotacaoUber.fee / 100).toFixed(2) : "0.00",
      external_store_id: cotacaoUber?.storeId || "STORE-SP-001",

      nome_cliente: nomeCliente,
      telefone_cliente: telefoneCliente,
      endereco_usuario: {
        ...enderecoSelecionado,
        nome: nomeCliente,
        telefone: telefoneCliente
      },

      itens: carrinho.map(item => ({
        id_produto: item.id,
        nome: item.nome,
        preco_unitario: item.preco_final || item.preco,
        quantidade: item.quantidade,
        imagem: item.imagem || null,
        volume: item.volume || 1,
        unidade_de_medida: item.unidade_de_medida || "un"
      }))
    };

    try {
      const idDoPedido = await criarPedido(pedido);
      clearCart();

      if (produtosPagos.length === 0) {
        navigate(`/acompanhar-pedido/${idDoPedido}`);
        return;
      }

      setLoading(true);
      const urlPagamento = await criarPreferencia(produtosPagos, usuario.email);
      window.location.href = urlPagamento;

    } catch (error) {
      alert('Erro ao iniciar pagamento.');
      console.error("❌ Erro ao criar pedido ou iniciar pagamento:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {modal && (
        <div className={styles.modalOverlay}>
          <Modal.Dialog className={styles.modalDialog}>
            <Modal.Header>
              <Modal.Title>Selecione seu endereço</Modal.Title>
              <Button variant="close" onClick={() => setModal(false)} />
            </Modal.Header>
            <Modal.Body>
              {enderecos.map((endereco, index) => (
                <Card key={index} className="m-2">
                  <Card.Body>
                    <Card.Title>{endereco.rua}, {endereco.numero}</Card.Title>
                    <Card.Text>{endereco.bairro}</Card.Text>
                    <Button variant="success" onClick={() => handleSelecionaEndereco(endereco)}>
                      Selecionar
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </Modal.Body>
          </Modal.Dialog>
        </div>
      )}

      <div className={styles.headerContainer}>
        <h1 className={styles.title}>
          <button className={styles.voltarHomeBtn} onClick={() => navigate("/")}>
            ← Voltar
          </button>
          Confirmação de Pedido
        </h1>
      </div>

      <h2 className={styles.resumeTitle}>Entregar no endereço</h2>
      {enderecoSelecionado ? (
        <Card className={styles.selectedAddress}>
          <Card.Body>
            <Card.Title>{enderecoSelecionado.rua}, {enderecoSelecionado.numero}</Card.Title>
            <Card.Text>{enderecoSelecionado.bairro}</Card.Text>
            <Button variant="success" onClick={handleTrocaEndereco}>Trocar</Button>
          </Card.Body>
        </Card>
      ) : (
        <p>Nenhum endereço selecionado.</p>
      )}

      <h2 className={styles.resumeTitle}>Opções de entrega</h2>

      <div className={styles.entregaOptions}>
        <Button
          variant={retirarNaLoja ? "success" : "outline-success"}
          onClick={() => setRetirarNaLoja(true)}
        >
          Retirar na loja
        </Button>
        <Button
          variant={!retirarNaLoja ? "success" : "outline-success"}
          onClick={() => setRetirarNaLoja(false)}
        >
          Entrega via Uber
        </Button>
      </div>

      {!retirarNaLoja && cotacaoUber && (
        <Card className={styles.selectedAddress}>
          <Card.Body>
            <Card.Title>Entrega via Uber</Card.Title>
            <Card.Text>
              Valor: <strong>R$ {valorEntregaVisual.toFixed(2)}</strong><br />
              Estimativa de chegada: {new Date(cotacaoUber.eta).toLocaleTimeString("pt-BR")}
            </Card.Text>
          </Card.Body>
        </Card>
      )}

      {cotandoEntrega && !retirarNaLoja && (
        <p style={{ color: 'orange', marginTop: '10px' }}>
          Cotando valor de entrega via Uber...
        </p>
      )}

      <Accordion className={styles.totalAccordion}>
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <h2 className={styles.resumeTitle}>Total</h2>
            <h2 className={styles.total}>
              <strong>R$ {totalVisual.toFixed(2)}</strong> /{quantidade} itens
            </h2>
          </Accordion.Header>
          <Accordion.Body>
            {carrinho.map((item, index) => (
              <div key={item.id || index} className={styles.itemsContainer}>
                <img src={item.imagem} width={100} alt={item.nome || "Imagem do produto"} />
                <div className={styles.infoItemContainer}>
                  <p className={styles.itemNome}>{item.nome}</p>
                  <p>R$ {item.preco_final}</p>
                  <p>Quantidade: {item.quantidade}</p>
                </div>
              </div>
            ))}
            {!retirarNaLoja && cotacaoUber && (
              <div className={styles.entregaResumo}>
                <p>Entrega via Uber: <strong>R$ {valorEntregaVisual.toFixed(2)}</strong></p>
              </div>
            )}
            {retirarNaLoja && (
              <div className={styles.entregaResumo}>
                <p>Entrega: <strong>Retirada na loja</strong></p>
              </div>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <Button
        variant="success"
        className={styles.btnPagamento}
        onClick={handlePagamento}
        disabled={loading || (!retirarNaLoja && (cotandoEntrega || !cotacaoUber?.quoteId))}
      >
        {loading ? 'Redirecionando ...' : (cotandoEntrega ? 'Cotando valor de entrega...' : 'Realizar Pagamento')}
      </Button>
    </>
  );
}
