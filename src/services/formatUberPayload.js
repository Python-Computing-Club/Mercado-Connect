export function formatUberPayload({ mercado, endereco, valorTotal }) {
  const enderecoMercado = mercado?.endereco;
  const enderecoUsuario = endereco;

  if (!mercado || !enderecoUsuario || !enderecoMercado) {
    console.warn("❌ Payload falhou: objetos principais ausentes.");
    console.log("mercado:", mercado);
    console.log("enderecoUsuario:", enderecoUsuario);
    console.log("enderecoMercado:", enderecoMercado);
    return null;
  }

  const camposObrigatorios = [
    enderecoMercado.lat, enderecoMercado.lng, enderecoMercado.logradouro,
    enderecoMercado.numero, enderecoMercado.bairro, enderecoMercado.cidade,
    enderecoMercado.estado, enderecoMercado.cep,
    enderecoUsuario.lat, enderecoUsuario.lng, enderecoUsuario.rua,
    enderecoUsuario.numero, enderecoUsuario.bairro, enderecoUsuario.cidade,
    enderecoUsuario.estado, enderecoUsuario.cep
  ];

  const camposFaltando = camposObrigatorios.some(campo =>
    campo === undefined || campo === null || campo === ""
  );

  if (camposFaltando) {
    console.warn("❌ Payload falhou: campos obrigatórios ausentes.");
    console.log("Campos recebidos:", { enderecoMercado, enderecoUsuario });
    return null;
  }

  const pickup_address = `${enderecoMercado.logradouro}, ${enderecoMercado.numero}, ${enderecoMercado.bairro}, ${enderecoMercado.cidade}, ${enderecoMercado.estado}, ${enderecoMercado.cep}`;
  const dropoff_address = `${enderecoUsuario.rua}, ${enderecoUsuario.numero}, ${enderecoUsuario.bairro}, ${enderecoUsuario.cidade}, ${enderecoUsuario.estado}, ${enderecoUsuario.cep}`;

  const payload = {
    pickup_address,
    pickup_latitude: enderecoMercado.lat,
    pickup_longitude: enderecoMercado.lng,
    dropoff_address,
    dropoff_latitude: enderecoUsuario.lat,
    dropoff_longitude: enderecoUsuario.lng,
    manifest_total_value: Math.max(parseFloat(valorTotal) || 0, 0),
    external_store_id: mercado.cnpj || "PAULISTA_STORE_01"
  };

  console.log("📦 Payload Uber gerado:", JSON.stringify(payload, null, 2));
  return payload;
}