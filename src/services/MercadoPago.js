import axios from 'axios';

const ACCESS_TOKEN = process.env.REACT_APP_MERCADOPAGO_ACCESS_TOKEN;

// Criando a preferência para pagamento no mercado pago
export async function criarPreferencia(carrinho, email){
    const items = carrinho.map(item => ({
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco_final,
    }));

    const body = {
        items, 
        payer: {email},
        back_urls: {
            success: 'https://mercado-connect.vercel.app/pagamento-sucesso',
            failure: 'https://mercado-connect.vercel.app/pagamento-erro',
            pending: 'https://mercado-connect.vercel.app/pagamento-pendente',
        },
        auto_return: 'approved',
    };

    try{
        const response = await axios.post(
            'https://api.mercadopago.com/checkout/preferences',
            body,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data.init_point;
    } catch (error){
        console.error("Erro ao criar preferência: ", error);
        throw error;
    }
}

//Cria pagamento PIX no Backend
export async function Pix({valor, descricao, email, nome}){
    try{
        const response = await axios.post(
            'https://api.mercadopago.com/v1/payments',
            {
                transaction_amount: valor,
                description: descricao,
                payment_method_id: 'pix',
                payer: {
                    email, 
                    first_name: nome,
                },
            },
            {
                headers:{
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        return {
            qrCode: response.data.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: response.data.point_of_interaction.transaction_data.qr_code_base64,
            status: response.data.status,
            id: response.data.id,
        };
    } catch (error){
        console.error('Erro ao criar pagamento PIX: ', error);
        throw error;
    }
}

