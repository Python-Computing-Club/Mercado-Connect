import React, { createContext, useContext, useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [carrinho, setCarrinho] = useState(() => {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinho");
      return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
    } catch {
      return [];
    }
  });

  const [produtosAtualizados, setProdutosAtualizados] = useState({});

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    const atualizarProdutos = async () => {
      const novosDados = {};

      for (const item of carrinho) {
        try {
          const ref = doc(db, "produtos", item.id);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();

            novosDados[item.id] = {
              nome: data.nome,
              preco:
                typeof data.preco_final === "number" && data.preco_final < data.preco
                  ? data.preco_final
                  : data.preco,
              preco_final: data.preco_final,
              imagem: data.imagemUrl || data.imagem || "",
              disponivel: data.disponivel ?? true,
              estoque: data.quantidade ?? 99,
            };
          }
        } catch (e) {
          console.error("Erro ao atualizar produto:", item.id, e);
        }
      }

      setProdutosAtualizados(novosDados);
    };

    atualizarProdutos();

    const intervalo = setInterval(atualizarProdutos, 60000);

    return () => clearInterval(intervalo);
  }, [carrinho]);

  useEffect(() => {
    setCarrinho((prev) => {
      let mudou = false;
      const atualizado = prev.map((item) => {
        const atualizado = produtosAtualizados[item.id];
        if (!atualizado) return item;

        const novoItem = {
          ...item,
          nome: atualizado.nome || item.nome,
          preco: atualizado.preco || item.preco,
          preco_final: atualizado.preco_final,
          imagem: atualizado.imagem || item.imagem,
          disponivel: atualizado.disponivel ?? item.disponivel,
          estoque: atualizado.estoque ?? item.estoque,
        };

        if (JSON.stringify(item) !== JSON.stringify(novoItem)) {
          mudou = true;
          return novoItem;
        }

        return item;
      });

      return mudou ? atualizado : prev;
    });
  }, [produtosAtualizados]);

  const addItem = (item, quantidade = 1) => {
    setCarrinho((prev) => {
      const existente = prev.find((p) => p.id === item.id);
      const precoFinal =
        typeof item.preco_final === "number" && item.preco_final < item.preco
          ? item.preco_final
          : item.preco;

      const estoqueAtual = item.quantidade ?? item.estoque ?? 99;

      if (existente) {
        const novaQtd = Math.min(existente.quantidade + quantidade, estoqueAtual);
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantidade: novaQtd } : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantidade: Math.min(quantidade, estoqueAtual),
          preco: precoFinal,
          imagem: item.imagemUrl || item.imagem || "",
          estoque: estoqueAtual,
        },
      ];
    });
  };

  const updateItemQuantity = (id, novaQtd, estoqueMax) => {
    if (novaQtd < 1) return;

    setCarrinho((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: Math.min(
                novaQtd,
                estoqueMax ?? item.estoque ?? item.quantidade ?? 1
              ),
            }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCarrinho((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCarrinho([]);
  };

  const getTotal = () => {
    return carrinho.reduce(
      (total, item) => total + item.preco * item.quantidade,
      0
    );
  };

  const getQuantidadeTotal = () => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  };

  return (
    <CartContext.Provider
      value={{
        carrinho,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        getTotal,
        getQuantidadeTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
