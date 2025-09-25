import { createContext, useContext, useState } from "react";

const FavoritosContext = createContext();

export function FavoritosProvider({ children }) {
  const [favoritosProdutos, setFavoritosProdutos] = useState([]);
  const [favoritosMercados, setFavoritosMercados] = useState([]);

  const toggleFavoritoProduto = (item) => {
    const existe = favoritosProdutos.some(p => p.id === item.id);
    setFavoritosProdutos(existe
      ? favoritosProdutos.filter(p => p.id !== item.id)
      : [...favoritosProdutos, item]
    );
  };

  const toggleFavoritoMercado = (item) => {
    const existe = favoritosMercados.some(m => m.id === item.id);
    setFavoritosMercados(existe
      ? favoritosMercados.filter(m => m.id !== item.id)
      : [...favoritosMercados, item]
    );
  };

  const isFavoritoProduto = (id) => favoritosProdutos.some(p => p.id === id);
  const isFavoritoMercado = (id) => favoritosMercados.some(m => m.id === id);

  return (
    <FavoritosContext.Provider value={{
      favoritosProdutos,
      favoritosMercados,
      toggleFavoritoProduto,
      toggleFavoritoMercado,
      isFavoritoProduto,
      isFavoritoMercado
    }}>
      {children}
    </FavoritosContext.Provider>
  );
}

export const useFavoritos = () => useContext(FavoritosContext);