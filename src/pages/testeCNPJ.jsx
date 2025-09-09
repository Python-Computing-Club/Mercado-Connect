import React, { useState } from 'react';
import verificaCNPJ from '../hooks/verificaCNPJ';

export default function TesteCNPJ() {
  const [cnpj, setCnpj] = useState('');
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleVerificar = async () => {
    setMensagem('');
    setErro('');

    const resultado = await verificaCNPJ(
      cnpj,
      cpf,
      (titulo, msg) => setMensagem(`${titulo}: ${msg}`),
      (titulo, msg) => setErro(`${titulo}: ${msg}`),
      nome
    );

    if (resultado === true) {
      console.log("✅ CPF e nome verificados");
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>🔍 Teste de Verificação de CNPJ</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>CNPJ:</label><br />
        <input
          type="text"
          value={cnpj}
          onChange={e => setCnpj(e.target.value)}
          placeholder="Digite o CNPJ"
          style={{ width: '300px', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>CPF:</label><br />
        <input
          type="text"
          value={cpf}
          onChange={e => setCpf(e.target.value)}
          placeholder="Digite o CPF"
          style={{ width: '300px', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Nome:</label><br />
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Digite o nome completo"
          style={{ width: '300px', padding: '0.5rem' }}
        />
      </div>

      <button onClick={handleVerificar} style={{ padding: '0.5rem 1rem' }}>
        Verificar
      </button>

      {mensagem && <p style={{ color: 'green', marginTop: '1rem' }}>{mensagem}</p>}
      {erro && <p style={{ color: 'red', marginTop: '1rem' }}>{erro}</p>}
    </div>
  );
}