const { CnpjaOpen } = require('@cnpja/sdk');

export default async function verificaCNPJ(cnpj, cpf, nome, onError) {
    const cnpja = new CnpjaOpen();
    const office = await cnpja.office.read({ taxId: cnpj });
    if (office) {
        if (verificaProprietario(office, cpf, nome)) {
            return true;
        } else {
            onError("Proprietário Não Encontrado", "Proprietário não vinculado ao CNPJ, insira um CPF válido e seu nome completo.");
            return false;
        }
    } else {
        onError("CNPJ Não Encontrado", "Insira um CNPJ válido.");
        return false;
    }
}

function verificaProprietario(empresa, cpf, nome) {
  const membros = empresa.company?.members || [];
  const cpfSegmento = cpf.slice(3, 9);
  const nomeLimpo = nome.trim().toUpperCase();

  return membros.some(membro => {
    const taxId = membro.person?.taxId;
    const memberName = membro.person?.name?.trim().toUpperCase();
    if (!taxId || taxId.length < 9) return false;

    const taxIdSegmento = taxId.slice(3, 9);
    return taxIdSegmento === cpfSegmento && memberName === nomeLimpo;
  });
}