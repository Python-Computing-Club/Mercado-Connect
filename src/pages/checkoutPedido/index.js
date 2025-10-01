import { useEffect, useState } from "react";
import { Card, Button, Modal, Accordion } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { criarPreferencia } from "../../services/MercadoPago";
import { criarPedido } from "../../services/firestore/pedidos";
import { useCart } from "../../Context/CartContext"; // ✅ Importa o contexto
import styles from './checkout.module.css';

export default function CheckoutPedido() {
  const { clearCart } = useCart(); // ✅ Usa a função de limpar o carrinho

  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState({});
  const [carrinho, setCarrinho] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const userStorage = JSON.parse(localStorage.getItem('userSession')) || {};
    const cartStorage = JSON.parse(localStorage.getItem('carrinho')) || [];

    setUsuario(userStorage);
    setCarrinho(cartStorage);

    if (userStorage.enderecos && Array.isArray(userStorage.enderecos)) {
      setEnderecos(userStorage.enderecos);

      if (!enderecoSelecionado && userStorage.enderecos.length > 0) {
        setEnderecoSelecionado(userStorage.enderecos[0]);
      }
    }
  }, []);

  const totalCarrinho = () => {
    return carrinho.reduce(
      (acc, item) => {
        const precoUsado =
          typeof item.preco_final === "number" && item.preco_final < item.preco
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

  function handleTrocaEndereco() {
    setModal(true);
  }

  function handleSelecionaEndereco(endereco) {
    setEnderecoSelecionado(endereco);
    setModal(false);
  }

  const handlePagamento = async () => {
    const data_hora = new Date();

    const pedido = {
      id_usuario: usuario.id,
      id_mercado: carrinho[0]?.id_mercado || "",
      data_pedido: data_hora.toLocaleString("pt-BR"),
      status: "Aguardando confirmação da loja",
      valor_total: total.toFixed(2),
    };

    try {
      const idDoPedido = await criarPedido(pedido);

      // ✅ Limpa o carrinho global/contexto
      clearCart();

      const produtosPagos = carrinho.filter(item => {
        const preco = typeof item.preco_final === 'number' ? item.preco_final : item.preco;
        return preco > 0;
      });

      if (produtosPagos.length === 0) {
        navigate(`/acompanhar-pedido/${idDoPedido}`);
        return;
      }

      setLoading(true);
      const urlPagamento = await criarPreferencia(produtosPagos, usuario.email);
      window.location.href = urlPagamento;

    } catch (error) {
      alert('Erro ao iniciar pagamento.');
      console.error(error);
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
      <Accordion className={styles.totalAccordion}>
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <h2 className={styles.resumeTitle}>Total</h2>
            <h2 className={styles.total}><strong>R$ {total.toFixed(2)}</strong> /{quantidade} itens</h2>
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
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <Button
        variant="success"
        className={styles.btnPagamento}
        onClick={handlePagamento}
        disabled={loading}
      >
        {loading ? 'Redirecionando ...' : 'Realizar Pagamento'}
      </Button>
    </>
  );
}
