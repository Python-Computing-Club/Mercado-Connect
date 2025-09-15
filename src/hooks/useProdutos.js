import { useEffect, useState } from "react";
import { escutarProdutosPorMercado } from "../services/firestore/produtos";
import { useMarket } from "../Context/MarketContext";

export default function useProdutos() {
  const { marketId, loading } = useMarket();
  const [produtos, setProdutos] = useState({
    destaque: [],
    popular: [],
  });

  useEffect(() => {
    if (loading || !marketId) return;

    const unsubscribe = escutarProdutosPorMercado(marketId, (todos) => {
      if (!todos || todos.length === 0) {
        setProdutos({ destaque: [], popular: [] });
        return;
      }

      const destaque = todos.filter(p => p.disponivel).slice(0, 10);
      const popular = todos.filter(p => p.disponivel).slice(0, 10);

      setProdutos({ destaque, popular });
    });

    return () => unsubscribe();
  }, [marketId, loading]);

  return produtos;
}
