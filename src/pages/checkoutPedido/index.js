import { useEffect, useState } from "react";
import { Card, Button, Modal, Accordion } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { criarPreferencia } from "../../services/MercadoPago";
import { criarPedido } from "../../services/firestore/pedidos";
import styles from './checkout.module.css';

export default function CheckoutPedido() {
    const [enderecos, setEnderecos] = useState([]);
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);

    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const usuario = JSON.parse(localStorage.getItem('userSession'));

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


    useEffect(() => {
        setEnderecos(usuario.enderecos);
        if (enderecoSelecionado == null) {
            setEnderecoSelecionado(usuario.enderecos[0]);
        }
    }, []);

    function handleTrocaEndereco() {
        setModal(true);
    }

    function handleSelecionaEndereco(endereco) {
        setEnderecoSelecionado(endereco);
        setModal(false);
    }

    const handlePagamento = async () => {
        const data_hora = new Date()
        const pedido = {
            id_usuario: usuario.id,
            id_mercado: carrinho[0].id_mercado,
            data_pedido: data_hora.toLocaleString(),
            status: "Confirmado",
            valor_total: total.toFixed(2)
        }
        await criarPedido(pedido);
        setLoading(true);
        try {
            const urlPagamento = await criarPreferencia(carrinho, usuario);
            window.location.href = urlPagamento;
        } catch (error) {
            alert('Erro ao iniciar pagamento');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {modal && (
                <div
                    className={styles.modalOverlay}
                >
                    <Modal.Dialog className={styles.modalDialog}>
                        <Modal.Header>
                            <Modal.Title>Selecione seu endereço</Modal.Title>
                            <Button variant="close" onClick={() => setModal(false)} />
                        </Modal.Header>

                        <Modal.Body>
                            {enderecos.map((endereco) => (
                                <Card className="m-2">
                                    <Card.Body>
                                        <Card.Title>{endereco.rua}, {endereco.numero}</Card.Title>
                                        <Card.Text>
                                            {endereco.bairro}
                                        </Card.Text>
                                        <Button variant="success" onClick={() => handleSelecionaEndereco(endereco)}>Selecionar</Button>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Modal.Body>
                    </Modal.Dialog>
                </div>
            )}<div className={styles.headerContainer}>
                <h1 className={styles.title}>
                    <button className={styles.voltarHomeBtn} onClick={() => navigate("/")}>
                        ← Voltar
                    </button>
                    Confirmação de Pedido
                </h1>
            </div>
            <h2 className={styles.resumeTitle}>Entregar no endereço</h2>
            <Card className={styles.selectedAddress}>
                <Card.Body>
                    <Card.Title>{enderecoSelecionado?.rua}, {enderecoSelecionado?.numero}</Card.Title>
                    <Card.Text>
                        {enderecoSelecionado?.bairro}
                    </Card.Text>
                    <Button variant="success" onClick={handleTrocaEndereco}>Trocar</Button>
                </Card.Body>
            </Card>
            <h2 className={styles.resumeTitle}>Opções de entrega</h2>
            <Accordion className={styles.totalAccordion}>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>
                        <h2 className={styles.resumeTitle}>Total</h2>
                        <h2 className={styles.total}><strong>R$ {total.toFixed(2)}</strong> /{quantidade} itens</h2>
                    </Accordion.Header>
                    <Accordion.Body>
                        {carrinho.map((item) => (
                            <div className={styles.itemsContainer}>
                                <img src={item.imagem} width={100}/>
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
            <Button variant="success" className={styles.btnPagamento} onClick={handlePagamento} disabled={loading}>
                {loading ? 'Redirecionando ...' : 'Realizar Pagamento'}
            </Button>
        </>
    );
}