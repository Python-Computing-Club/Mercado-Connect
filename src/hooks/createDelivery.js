export async function createDelivery({ pedido, mercado, enderecoUsuario, quoteId }) {
  if (!quoteId) {
    console.warn("❌ createDelivery: quoteId ausente, entrega não será criada.");
    return null;
  }

  if (!mercado || !mercado.endereco || !enderecoUsuario) {
    console.warn("❌ createDelivery: dados do mercado ou do usuário ausentes.");
    return null;
  }

  const camposMercado = ["logradouro", "numero", "bairro", "cidade", "estado", "cep", "lat", "lng"];
  const camposUsuario = ["rua", "numero", "bairro", "cidade", "estado", "cep", "lat", "lng", "nome", "telefone"];
  const validarCampos = (obj, campos) => campos.filter(campo => !obj[campo] && obj[campo] !== 0);

  const faltandoMercado = validarCampos(mercado.endereco, camposMercado);
  const faltandoUsuario = validarCampos(enderecoUsuario, camposUsuario);

  if (faltandoMercado.length > 0) {
    console.warn("❌ Campos faltando no endereço do mercado:", faltandoMercado);
    return null;
  }

  if (faltandoUsuario.length > 0) {
    console.warn("❌ Campos faltando no endereço do usuário:", faltandoUsuario);
    return null;
  }

  function calcularPeso(volume, unidade) {
    const conversao = {
      kg: 1,
      g: 0.001,
      L: 1,
      ml: 0.001,
      un: 0.5
    };
    return volume * (conversao[unidade] || 1);
  }

  const now = new Date();
  const pickupReady = new Date(now.getTime() + 5 * 60000);
  const pickupDeadline = new Date(now.getTime() + 30 * 60000);
  const dropoffReady = new Date(now.getTime() + 10 * 60000);
  const dropoffDeadline = new Date(dropoffReady.getTime() + 60 * 60000);

  const body = {
    dropoff_address: `${enderecoUsuario.rua}, ${enderecoUsuario.numero}, ${enderecoUsuario.bairro}, ${enderecoUsuario.cidade} - ${enderecoUsuario.estado}`,
    dropoff_name: enderecoUsuario.nome,
    dropoff_phone_number: enderecoUsuario.telefone,

    manifest_items: (pedido.itens || []).map(item => {
      const peso = calcularPeso(item.volume, item.unidade_de_medida);
      return {
        name: item.nome,
        quantity: item.quantidade,
        size: "medium",
        dimensions: { length: 30, height: 20, depth: 10 },
        price: item.preco_unitario,
        must_be_upright: false,
        weight: peso,
        vat_percentage: 12
      };
    }),


    pickup_address: `${mercado.endereco.logradouro}, ${mercado.endereco.numero}, ${mercado.endereco.bairro}, ${mercado.endereco.cidade} - ${mercado.endereco.estado}`,
    pickup_name: mercado.estabelecimento || "Mercado Connect",
    pickup_phone_number: mercado.telefone || "+5511944806873",
    pickup_business_name: mercado.estabelecimento || "Mercado Connect",
    pickup_latitude: mercado.endereco.lat,
    pickup_longitude: mercado.endereco.lng,
    pickup_notes: "Retirar na recepção, informar número do pedido.",
    pickup_verification: {
      signature: false,
      signature_requirement: {
        enabled: false,
        collect_signer_name: false,
        collect_signer_relationship: false
      },
      barcodes: [
        { value: "TS123456789", type: "CODE128" },
        { value: "TS987654321", type: "CODE128" }
      ],
      picture: true
    },

    dropoff_business_name: "Residencial Jardim",
    dropoff_latitude: enderecoUsuario.lat,
    dropoff_longitude: enderecoUsuario.lng,
    dropoff_notes: "Entregar na portaria, código de acesso 4567.",
    dropoff_seller_notes: "Cliente prefere entrega pela manhã.",
    dropoff_verification: {
      signature: false,
      signature_requirement: {
        enabled: false,
        collect_signer_name: false,
        collect_signer_relationship: false
      },
      barcodes: [
        { value: "DL123456789", type: "CODE39" },
        { value: "DL987654321", type: "QR" }
      ],
      pincode: { enabled: true },
      identification: { min_age: 18 },
      picture: true
    },

    deliverable_action: "deliverable_action_meet_at_door",
    manifest_reference: pedido.id || "ORD-20251003-SP",
    manifest_total_value: Number(pedido.valor_total),
    quote_id: quoteId,
    undeliverable_action: "return",
    pickup_ready_dt: pickupReady.toISOString(),
    pickup_deadline_dt: pickupDeadline.toISOString(),
    dropoff_ready_dt: dropoffReady.toISOString(),
    dropoff_deadline_dt: dropoffDeadline.toISOString(),
    requires_dropoff_signature: false,
    requires_id: true,
    tip: 25,
    idempotency_key: `entrega-${pedido.id}`,
    external_store_id: pedido.external_store_id,

    return_verification: {
      signature: true,
      signature_requirement: {
        enabled: true,
        collect_signer_name: true,
        collect_signer_relationship: false
      },
      barcodes: [
        { value: "RT123456789", type: "CODE39" },
        { value: "RT987654321", type: "QR" }
      ],
      picture: true
    },

    external_user_info: {
      merchant_account: {
        account_created_at: "2022-05-10T14:00:00-03:00",
        email: mercado.email || "mercadoconnectoficial@gmail.com"
      },
      device: {
        id: "device_mercado_001"
      }
    },

    external_id: `entrega_${pedido.id}`,
    test_specifications: {
      robo_courier_specification: {
        mode: "auto"
      }
    }
  };

  console.log("📦 Payload enviado para o backend:", JSON.stringify(body, null, 2));

  try {
    const res = await fetch("https://mercado-connect-server.onrender.com/api/uber-delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      mode: "cors",
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok && data.id && data.tracking_url) {
      return {
        deliveryId: data.id,
        trackingUrl: data.tracking_url,
        status: data.status
      };
    } else {
      console.warn("❌ Erro ao criar entrega Uber:", data);
      return null;
    }
  } catch (err) {
    console.error("❌ Erro na criação da entrega Uber:", err);
    return null;
  }
}