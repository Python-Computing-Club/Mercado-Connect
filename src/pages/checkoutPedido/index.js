import { useEffect, useState } from "react";
import { Card, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import styles from './checkout.module.css';

export default function CheckoutPedido() {
    const [enderecos, setEnderecos] = useState([]);
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
    const [pagamentoSelecionado, setPagamento] = useState(null);
    const formas_pagamento = ["PIX", "Cartão de Débito"]

    const totalCarrinho = () => {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

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
        const usuario = JSON.parse(localStorage.getItem('userSession'));
        setEnderecos(usuario.enderecos);
        if (enderecoSelecionado == null) {
            setEnderecoSelecionado(usuario.enderecos[0]);
        } else if (pagamentoSelecionado == null){
            setPagamento("PIX")
        }
    }, []);

    function handleTrocaEndereco() {
        setModal(true);
    }

    function handleSelecionaEndereco(endereco) {
        setEnderecoSelecionado(endereco);
        setModal(false);
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
            <h2 className={styles.resumeTitle}>Forma de pagamento</h2>
            <Card className={styles.selectedPaymentMethod}>
                <Card.Body>
                    <Card.Title>{enderecoSelecionado?.rua}, {enderecoSelecionado?.numero}</Card.Title>
                    <Card.Text>
                        {enderecoSelecionado?.bairro}
                    </Card.Text>
                    <Button variant="success" onClick={handleTrocaEndereco}>Trocar</Button>
                </Card.Body>
            </Card>
            <h2 className={styles.resumeTitle}>Total</h2>
            <h2 className={styles.total}><strong>R$ {total.toFixed(2)}</strong> /{quantidade} itens</h2>
        </>
    );
}