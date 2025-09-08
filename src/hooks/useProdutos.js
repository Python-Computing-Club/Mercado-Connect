export default function useProdutos() {
  const produtos = {
    destaque: [
      { id: 1, nome: "Arroz", preco: 30.0 },
      { id: 2, nome: "Feijão", preco: 8.0 },
      { id: 3, nome: "Leite", preco: 4.0 },
    ],
    popular: [
      { id: 4, nome: "Pão", preco: 3.0 },
      { id: 5, nome: "Café", preco: 10.0 },
    ],
  };

  return produtos;
}