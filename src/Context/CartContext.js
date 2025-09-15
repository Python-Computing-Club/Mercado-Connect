import React, { createContext, useContext, useState, useEffect } from "react";

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

  const addItem = (item, quantidade = 1) => {
    setCarrinho((prev) => {
      const existente = prev.find((p) => p.id === item.id);
      const precoFinal = typeof item.preco_final === "number" && item.preco_final < item.preco
        ? item.preco_final
        : item.preco;

      if (existente) {
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantidade: p.quantidade + quantidade }
            : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantidade,
          preco: precoFinal,
          imagem: item.imagemUrl || item.imagem || "",
        },
      ];
    });
  };

  const updateItemQuantity = (id, novaQtd) => {
    if (novaQtd < 1) return;
    setCarrinho((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade: novaQtd } : item
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
