import axios from 'axios';

const ACCESS_TOKEN = process.env.REACT_APP_MERCADOPAGO_ACCESS_TOKEN;

export async function criarPreferencia(carrinho, email) {
  const items = carrinho
    .filter(item => {
      const preco = typeof item.preco_final === 'number' && item.preco_final > 0
        ? item.preco_final
        : (typeof item.preco === 'number' ? item.preco : 0);
      return preco > 0;
    })
    .map(item => ({
      title: item.nome,
      quantity: item.quantidade,
      unit_price: typeof item.preco_final === 'number' && item.preco_final > 0
        ? item.preco_final
        : item.preco,
    }));

  if (items.length === 0) {
    throw new Error("Nenhum item pago para processar no Mercado Pago.");
  }

  const body = {
    items,
    payer: { email },
    back_urls: {
      success: 'https://mercado-connect.vercel.app/pagamento-sucesso',
      failure: 'https://mercado-connect.vercel.app/pagamento-erro',
      pending: 'https://mercado-connect.vercel.app/pagamento-pendente',
    },
    auto_return: 'approved',
  };

  try {
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
  } catch (error) {
    console.error("Erro ao criar preferência: ", error);
    throw error;
  }
}

export async function Pix({ valor, descricao, email, nome }) {
  try {
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
        headers: {
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
  } catch (error) {
    console.error('Erro ao criar pagamento PIX: ', error);
    throw error;
  }
}

export async function criarReembolso(payment_id, valor = null) {

  const body = valor
    ? { amount: valor }
    : {};

  try {
    const response = await axios.post(
      `https://api.mercadopago.com/v1/payments/${payment_id}/refunds`,
      body,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao criar reembolso:", error.response?.data || error.message);
    throw error;
  }
}
