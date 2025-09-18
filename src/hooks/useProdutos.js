import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { produtosRef } from "../services/firestore/produtos";
import { useMarket } from "../Context/MarketContext";

const escutarTodosProdutos = (callback) => {
  return onSnapshot(produtosRef, (snapshot) => {
    const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(produtos);
  });
};

export default function useProdutos() {
  const { loading } = useMarket();
  const [produtos, setProdutos] = useState({
    destaque: [],
    popular: [],
    categorias: {},
  });

  useEffect(() => {
    if (loading) return;

    const unsubscribe = escutarTodosProdutos((todos) => {
      if (!todos || todos.length === 0) {
        setProdutos({ destaque: [], popular: [], categorias: {} });
        return;
      }

      const disponiveis = todos.filter(p => p.disponivel);

      const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

      const atualizarProdutos = () => {
        const destaque = shuffle(
          disponiveis.filter(p => typeof p.preco_final === "number" && p.preco_final > 0 && p.preco_final < p.preco)
        ).slice(0, 15);

        const popularesOrdenados = [...disponiveis].sort((a, b) => (b.qtdVendida || 0) - (a.qtdVendida || 0));
        const popular = shuffle(popularesOrdenados.slice(0, 50)).slice(0, 15);

        const grupos = {
          "Hortifruti & Padaria": ["Hortifruti", "Padaria & Confeitaria"],
          "Mercearia & Congelados": ["Mercearia", "Congelados & Resfriados", "Alimentícios"],
          "Beleza & Higiene": ["Beleza", "Produtos de Higiene Pessoal", "Produtos de Limpeza"],
          "Infantil & Saúde": ["Infantil / Bebê", "Farmácia / Saúde"],
          "Pet & Utilidades": ["Pet Shop (animais)", "Utilidades Domésticas"],
          "Açougue & Frios": ["Açougue & Peixaria", "Frios & Laticínios"],
          "Bebidas & Especiais": ["Bebida", "Saudáveis & Especiais"],
        };

        const categorias = {};
        for (const [grupo, cats] of Object.entries(grupos)) {
          const candidatos = disponiveis.filter(p =>
            cats.some(cat => p.categoria?.includes(cat))
          );
          categorias[grupo] = shuffle(candidatos).slice(0, 15);
        }

        setProdutos({ destaque, popular, categorias });
      };

      atualizarProdutos();

      const interval = setInterval(atualizarProdutos, 1800000);

      return () => clearInterval(interval);
    });

    return () => unsubscribe();
  }, [loading]);

  return produtos;
}
