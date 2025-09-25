import React, { createContext, useContext, useState, useEffect } from "react";
import { onSnapshot, doc } from "firebase/firestore";
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

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    if (carrinho.length === 0) return;

    const unsubscribes = carrinho.map((item) =>
      onSnapshot(doc(db, "produtos", item.id), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          setCarrinho((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    nome: data.nome || p.nome,
                    preco:
                      typeof data.preco_final === "number" &&
                      data.preco_final < data.preco
                        ? data.preco_final
                        : data.preco,
                    preco_final: data.preco_final,
                    imagem: data.imagemUrl || data.imagem || p.imagem,
                    disponivel: data.disponivel ?? p.disponivel,
                    estoque: data.quantidade ?? p.estoque,
                  }
                : p
            )
          );
        }
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [carrinho]);

  const addItem = (item, quantidade = 1) => {
    setCarrinho((prev) => {
      const existente = prev.find((p) => p.id === item.id);
      const precoFinal =
        typeof item.preco_final === "number" && item.preco_final < item.preco
          ? item.preco_final
          : item.preco;

      const estoqueAtual = item.quantidade ?? item.estoque ?? 99;

      if (existente) {
        const novaQtd = Math.min(
          existente.quantidade + quantidade,
          estoqueAtual
        );
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
