export default async function consultarCEP (cep, showAlert) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      showAlert("ERRO", "CEP não encontrado.");
      console.log(data.erro);
    } else {
        console.log("Endereço encontrado:");
        console.log(`Logradouro: ${data.logradouro}`);
        console.log(`Bairro: ${data.bairro}`);
        console.log(`Cidade: ${data.localidade}`);
        console.log(`Estado: ${data.uf}`);
        return data;
    }
  } catch (error) {
    console.error("Erro ao consultar o CEP:", error);
    console.log(error)
  }
};