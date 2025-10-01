import { useState } from 'react';
import { Card, Container, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import HeaderMercado from '../../components/HeaderMercado';
import Modal from '../../modal/modal';
import styles from './painel-mercado.module.css';

import FormatCEP from '../../hooks/FormatCEP';
import consultarCEP from '../../hooks/useValidarEndereco';
import useFormatTelefone from '../../hooks/useFormatTelefone';
import useEmailCodigo from '../../hooks/useEmailCodigo';
import { useTextBeeSms } from '../../hooks/useTextBeeSms';
import { atualizarMercado, deletarMercado } from '../../services/firestore/mercados';
import { autenticar } from '../../services/authService';
import { uploadParaCloudinary, excluirImagemCloudinary } from '../../hooks/cloudinaryUpload';

let usuario = JSON.parse(localStorage.getItem("entidade"));

export default function PainelMercado() {
    const navigate = useNavigate();

    const [dadosMercado, setDadosMercado] = useState(
        usuario || {
            estabelecimento: "",
            email: "",
            telefone: "",
            logo: { url: "", public_id: "" },
            endereco: {
                cep: "",
                logradouro: "",
                bairro: "",
                cidade: "",
                estado: "",
                numero: "",
                complemento: ""
            }
        }
    );

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [modal, setModal] = useState({ open: false, title: "", message: "" });
    const [showToast, setShowToast] = useState(false);
    const [deleteMercado, setDeleteMercado] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const toggleDeleteMercado = () => setDeleteMercado(!deleteMercado);
    const toggleShowToast = () => setShowToast(!showToast);
    const showAlert = (title, message) => setModal({ open: true, title, message });

    const { formatTelefone } = useFormatTelefone();
    const { enviarCodigo } = useEmailCodigo();
    const { sendVerificationCode } = useTextBeeSms();

    const handleMostrarFormulario = async () => {
        if (!usuario?.email) return;
        usuario = await autenticar("mercados", usuario.email, "email");
        setDadosMercado(usuario);
        setMostrarFormulario(true);
    };

    const resetarPainel = async () => {
        if (!usuario?.email) return;
        usuario = await autenticar("mercados", usuario.email, "email");
        setDadosMercado(usuario);
        setMostrarFormulario(false);
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleChange = async ({ target: { name, value } }) => {
        const [grupo, campo] = name.includes('.') ? name.split('.') : [null, name];

        if (campo === "telefone") {
            const onlyNumbers = value.replace(/\D/g, "");
            setDadosMercado((prev) => ({ ...prev, telefone: formatTelefone(onlyNumbers) }));
            return;
        }

        if (campo === "cep") {
            const cepFormatado = FormatCEP(value);
            const cepLimpo = value.replace(/\D/g, "");
            const novoEndereco = { ...dadosMercado.endereco, cep: cepFormatado };

            if (cepLimpo.length === 8) {
                const endereco = await consultarCEP(cepLimpo, showAlert);
                if (endereco && !endereco.erro) {
                    Object.assign(novoEndereco, {
                        logradouro: endereco.logradouro || "",
                        bairro: endereco.bairro || "",
                        cidade: endereco.localidade || "",
                        estado: endereco.uf || ""
                    });
                } else {
                    Object.assign(novoEndereco, { logradouro: "", bairro: "", cidade: "", estado: "" });
                }
            }
            setDadosMercado((prev) => ({ ...prev, endereco: novoEndereco }));
            return;
        }

        if (grupo === "endereco") {
            setDadosMercado((prev) => ({
                ...prev,
                endereco: { ...prev.endereco, [campo]: value }
            }));
        } else {
            setDadosMercado((prev) => ({ ...prev, [campo]: value }));
        }
    };
    
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!dadosMercado.estabelecimento?.trim().length || !dadosMercado.endereco?.cep?.trim() || !dadosMercado.endereco?.numero || !dadosMercado.email) {
            showAlert("Preencha todos os campos!", "Preencha todos os campos obrigatórios!");
            return;
        }

        let dadosParaSalvar = { ...dadosMercado };

        if (logoFile) {
            showAlert("Aguarde", "Enviando sua nova logo...");
            const uploadInfo = await uploadParaCloudinary(logoFile);

            if (uploadInfo) {
                if (dadosMercado.logo?.public_id) {
                    await excluirImagemCloudinary(dadosMercado.logo.public_id);
                }
                dadosParaSalvar.logo = { url: uploadInfo.url, public_id: uploadInfo.public_id };
            } else {
                showAlert("Erro de Upload", "Não foi possível enviar sua logo. Tente novamente.");
                return;
            }
        }
        
        const codigoEmail = await enviarCodigo(dadosParaSalvar.email, "email", showAlert, showAlert);
        const codigoSMS = await sendVerificationCode(dadosParaSalvar.telefone);

        if (!codigoEmail || !codigoSMS) {
            return showAlert("Erro", "Não foi possível enviar os códigos de verificação");
        }

        setDadosMercado({
            ...dadosParaSalvar,
            codigoEmailGerado: codigoEmail,
            codigoSMSGerado: codigoSMS,
            etapaVerificacao: true,
            codigoEmail: "",
            codigoSMS: ""
        });

        setMostrarFormulario(false);
        toggleShowToast();
    };


    const handleDelete = async () => {
        showAlert("Esta ação irá deletar todos os dados do mercado!", "Serão enviados códigos de confirmação para seu email e telefone");
        toggleDeleteMercado();

        const codigoEmail = await enviarCodigo(dadosMercado.email, "email", showAlert, showAlert);
        const codigoSMS = await sendVerificationCode(dadosMercado.telefone);

        if (!codigoEmail || !codigoSMS) {
            return showAlert("Erro", "Não foi possível enviar os códigos de verificação");
        }

        setDadosMercado((prev) => ({
            ...prev,
            codigoEmailGerado: codigoEmail,
            codigoSMSGerado: codigoSMS,
            etapaVerificacao: true,
            codigoEmail: "",
            codigoSMS: ""
        }));

        setMostrarFormulario(false);
        toggleShowToast();
    };

    const validarCodigos = async () => {
        if (
            dadosMercado.codigoEmail === dadosMercado.codigoEmailGerado &&
            dadosMercado.codigoSMS === dadosMercado.codigoSMSGerado
        ) {
            showAlert("Verificação concluída", "Seus dados foram confirmados com sucesso.");
            if (deleteMercado) {
                const exclusao = await deletarMercado(dadosMercado.id);
                if (exclusao) {
                    showAlert("Mercado deletado", "Seus dados foram deletados com sucesso. Saindo...");
                    setTimeout(() => navigate("/"), 3000);
                    return;
                } else {
                    navigate("/painel-mercado");
                }
            }

            const dadosParaAtualizar = {
                estabelecimento: dadosMercado.estabelecimento,
                email: dadosMercado.email,
                telefone: dadosMercado.telefone,
                "logo.url": dadosMercado.logo?.url || "",
                "logo.public_id": dadosMercado.logo?.public_id || "",
                "endereco.cep": dadosMercado.endereco.cep,
                "endereco.logradouro": dadosMercado.endereco.logradouro,
                "endereco.cidade": dadosMercado.endereco.cidade,
                "endereco.estado": dadosMercado.endereco.estado,
                "endereco.bairro": dadosMercado.endereco.bairro,
                "endereco.numero": dadosMercado.endereco.numero,
                "endereco.complemento": dadosMercado.endereco.complemento ?? ""
            };

            const updateMercado = await atualizarMercado(usuario.id, dadosParaAtualizar);

            if (updateMercado) {
                showAlert("Dados atualizados", "Seus dados foram atualizados com sucesso");
                setTimeout(async () => {
                    usuario = await autenticar("mercados", usuario.email, "email");
                    setDadosMercado({ ...usuario, etapaVerificacao: false });
                    setLogoFile(null);
                    setLogoPreview(null);
                }, 1500);
            } else {
                showAlert("Erro na atualização", "Erro ao atualizar os dados cadastrais");
            }
        } else {
            showAlert("Código inválido", "Verifique os códigos digitados e tente novamente.");
        }
    };

    return (
        <>
            <HeaderMercado onResetar={resetarPainel} />
            <div className={styles.banner}>
                <h1 className={styles.bannerTitle}>
                    Bem-vindo, {dadosMercado?.estabelecimento || "Mercado"}
                </h1>
            </div>

            {modal.open && (
                <Modal
                    title={modal.title}
                    message={modal.message}
                    onClose={() => setModal((m) => ({ ...m, open: false }))}
                />
            )}

            {dadosMercado.etapaVerificacao && (
                <div className={styles.verificacaoContainer}>
                    <h3>Confirme seus dados</h3>
                    <div className={styles.formVerificacao}>
                        <label>Código enviado por Email</label>
                        <input
                            type="text"
                            name="codigoEmail"
                            value={dadosMercado?.codigoEmail || ""}
                            onChange={handleChange}
                            placeholder="Digite o código do email"
                        />
                    </div>
                    <div className={styles.formVerificacao}>
                        <label>Código enviado por SMS</label>
                        <input
                            type="text"
                            name="codigoSMS"
                            value={dadosMercado?.codigoSMS || ""}
                            onChange={handleChange}
                            placeholder="Digite o código do SMS"
                        />
                    </div>
                    <button type="button" onClick={validarCodigos} className={styles.submitButton}>
                        Confirmar Verificação
                    </button>
                    <ToastContainer position="bottom-end" className="p-3">
                        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000}>
                            <Toast.Header>
                                <strong className="me-auto text-success">Finalize sua verificação!</strong>
                            </Toast.Header>
                            <Toast.Body>Os códigos de verificação foram enviados para seu e-mail e telefone!</Toast.Body>
                        </Toast>
                    </ToastContainer>
                </div>
            )}

            {mostrarFormulario && !dadosMercado.etapaVerificacao ? (
                <Container className={styles.formContainer}>
                    <h2 className={styles.titles}>Informações da Loja</h2>
                    
                    <div className={styles.logoContainer}>
                        <label>Logo do Mercado</label>
                        <img 
                            src={logoPreview || dadosMercado.logo?.url || 'https://via.placeholder.com/150?text=Logo'} 
                            alt="Prévia da logo" 
                            className={styles.logoPreview} 
                        />
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleLogoChange}
                        />
                    </div>
                    
                    <form className={styles.formLoja}>
                        <div className={styles.formGroup}>
                            <label>Nome do Mercado</label>
                            <input
                                type="text"
                                name="estabelecimento"
                                value={dadosMercado?.estabelecimento || ""}
                                onChange={handleChange}
                                placeholder="Nome do Mercado"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>CEP</label>
                            <input
                                type="text"
                                name="endereco.cep"
                                maxLength="9"
                                value={dadosMercado?.endereco?.cep || ""}
                                onChange={handleChange}
                                placeholder="CEP"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Logradouro</label>
                            <input
                                type="text"
                                name="endereco.logradouro"
                                value={dadosMercado?.endereco?.logradouro || ""}
                                disabled
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Bairro</label>
                            <input
                                type="text"
                                name="endereco.bairro"
                                value={dadosMercado?.endereco?.bairro || ""}
                                disabled
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cidade</label>
                            <input
                                type="text"
                                name="endereco.cidade"
                                value={dadosMercado?.endereco?.cidade || ""}
                                disabled
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Estado</label>
                            <input
                                type="text"
                                name="endereco.estado"
                                value={dadosMercado?.endereco?.estado || ""}
                                disabled
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Número</label>
                            <input
                                type="number"
                                name="endereco.numero"
                                value={dadosMercado?.endereco?.numero || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Complemento</label>
                            <input
                                type="text"
                                name="endereco.complemento"
                                value={dadosMercado?.endereco?.complemento || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Telefone</label>
                            <input
                                type="text"
                                name="telefone"
                                value={dadosMercado?.telefone || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>E-mail</label>
                            <input
                                type="email"
                                name="email"
                                value={dadosMercado?.email || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <Container className="d-flex justify-content-end gap-3 pb-3">
                            <button type="button" className={styles.submitButton} onClick={handleSubmit}>
                                Salvar Alterações
                            </button>
                            <button type="button" className={styles.cancelButton} onClick={resetarPainel}>
                                Cancelar
                            </button>
                            <button type="button" className={styles.deleteButton} onClick={handleDelete}>
                                Deletar
                            </button>
                        </Container>
                    </form>
                </Container>
            ) : !dadosMercado.etapaVerificacao ? (
                <>
                    <h2 className={styles.titles}>Tudo que você precisa em um só lugar!</h2>
                    <Container className={styles.cardContainer}>
                        <Card style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title className={styles.cardTitle}>Acompanhar Pedidos</Card.Title>
                                <Card.Subtitle className={`mb-2 text-muted ${styles.cardSubtitle}`}>
                                    Acompanhe todos seus pedidos
                                </Card.Subtitle>
                                <Card.Text>
                                    Gerencie seus pedidos em tempo real, veja o status de cada um e mantenha seus clientes informados.
                                </Card.Text>
                                <Card.Link
                                    as="button"
                                    className={styles.buttonCard}
                                    onClick={() => navigate("/painel-mercado/pedidos")}
                                >
                                    Gerenciar Pedidos
                                </Card.Link>

                            </Card.Body>
                        </Card>
                        <Card style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title className={styles.cardTitle}>Estoque</Card.Title>
                                <Card.Subtitle className={`mb-2 text-muted ${styles.cardSubtitle}`}>
                                    Gerencie seus produtos
                                </Card.Subtitle>
                                <Card.Text>
                                    Gerencie seu estoque de produtos, adicione novos itens e mantenha o controle de disponibilidade.
                                </Card.Text>
                                <Card.Link
                                    as="button"
                                    className={styles.buttonCard}
                                    onClick={() => navigate("/painel-mercado/estoque")}
                                >
                                    Gerenciar Estoque
                                </Card.Link>
                            </Card.Body>
                        </Card>
                        <Card style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title className={styles.cardTitle}>Minha Loja</Card.Title>
                                <Card.Subtitle className={`mb-2 text-muted ${styles.cardSubtitle}`}>
                                    Gerencie sua loja
                                </Card.Subtitle>
                                <Card.Text>
                                    Edite suas informações e mantenha seu cadastro sempre atualizado.
                                </Card.Text>
                                <Card.Link
                                    className={styles.buttonCard}
                                    as="button"
                                    onClick={handleMostrarFormulario}
                                >
                                    Gerenciar Loja
                                </Card.Link>
                            </Card.Body>
                        </Card>
                    </Container>
                </>
            ) : null}
        </>
    );
}