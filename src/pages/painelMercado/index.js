import HeaderMercado from '../../components/HeaderMercado';
import { Card, Container } from 'react-bootstrap';
import { useState } from 'react';
import styles from './painel-mercado.module.css';

const usuario = JSON.parse(localStorage.getItem("entidade"));

export default function PainelMercado() {

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const handleMostrarFormulario = () => {
        setMostrarFormulario(true);
    }

    const resetarPainel = () => {
        setMostrarFormulario(false);
    }

    return (
        <>
            <HeaderMercado onResetar={resetarPainel} />
            <div className={styles.banner}>
                <h1 className={styles.bannerTitle}>Bem-vindo, {usuario.estabelecimento}</h1>
            </div>

            {mostrarFormulario ? (
                <Container className={styles.formContainer}>
                    <h2 className={styles.titles}>Informações da Loja</h2>
                    <form className={styles.formLoja}>
                        <div className={styles.formGroup}>
                            <label>Nome do Mercado</label>
                            <input type="text" value={usuario.estabelecimento} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>CEP</label>
                            <input type="text" value={usuario.endereco.cep} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Logradouro</label>
                            <input type="text" value={usuario.endereco.logradouro} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Bairro</label>
                            <input type="text" value={usuario.endereco.bairro} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cidade</label>
                            <input type="text" value={usuario.endereco.cidade} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Estado</label>
                            <input type="text" value={usuario.endereco.estado} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Número</label>
                            <input type="text" value={usuario.endereco.numero} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Complemento</label>
                            <input type="text" value={usuario.endereco.complemento} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Telefone</label>
                            <input type="text" value={usuario.telefone} readOnly />
                        </div>
                        <div className={styles.formGroup}>
                            <label>E-mail</label>
                            <input type="email" value={usuario.email} readOnly />
                        </div>
                        <Container className='d-flex justify-content-end gap-3 pb-3'>
                            <button type="submit" className={styles.submitButton}>Salvar Alterações</button>
                            <button type="button" className={styles.cancelButton} onClick={resetarPainel}>Cancelar</button>
                            <button type="button" className={styles.deleteButton} onClick={resetarPainel}>Deletar Loja</button>
                        </Container>
                    </form>
                </Container>
            ) : (
                <>
                    <h2 className={styles.titles}>Tudo que você precisa em um só lugar!</h2>
                    <Container className={styles.cardContainer}>
                        <Card style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title className={styles.cardTitle}>Acompanhar Pedidos</Card.Title>
                                <Card.Subtitle className={`mb-2 text-muted ${styles.cardSubtitle}`}>Acompanhe todos seus pedidos</Card.Subtitle>
                                <Card.Text>
                                    Gerencie seus pedidos em tempo real, veja o status de cada um e mantenha seus clientes informados.
                                </Card.Text>
                                <Card.Link className={styles.buttonCard} as="button" href="#">Gerenciar Pedidos</Card.Link>
                            </Card.Body>
                        </Card>

                        <Card style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title className={styles.cardTitle}>Estoque</Card.Title>
                                <Card.Subtitle className={`mb-2 text-muted ${styles.cardSubtitle}`}>Gerencie seus produtos</Card.Subtitle>
                                <Card.Text>
                                    Gerencie seu estoque de produtos, adicione novos itens e mantenha o controle de disponibilidade.
                                </Card.Text>
                                <Card.Link className={styles.buttonCard} as="button" href="#">Gerenciar Estoque</Card.Link>
                            </Card.Body>
                        </Card>

                        <Card style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title className={styles.cardTitle}>Minha Loja</Card.Title>
                                <Card.Subtitle className={`mb-2 text-muted ${styles.cardSubtitle}`}>Gerencie sua loja</Card.Subtitle>
                                <Card.Text>
                                    Edite suas informações e mantenha seu cadastro sempre atualizado.
                                </Card.Text>
                                <Card.Link className={styles.buttonCard} as="button" onClick={handleMostrarFormulario}>Gerenciar Loja</Card.Link>
                            </Card.Body>
                        </Card>
                    </Container>
                </>)}
        </>
    );
}