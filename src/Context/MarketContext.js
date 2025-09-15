import React, { createContext, useContext, useEffect, useState } from "react";
import { buscarMercadoPorId, listarMercados } from "../services/firestore/mercados";

const MarketContext = createContext();

export const useMarket = () => useContext(MarketContext);

export const MarketProvider = ({ children }) => {
  const [marketId, setMarketId] = useState(() => localStorage.getItem("marketId") || null);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        let id = marketId;
        if (!id) {
          const mercados = await listarMercados();
          if (mercados.length) {
            id = mercados[0].id;
            localStorage.setItem("marketId", id);
            setMarketId(id);
          }
        }
        if (id) {
          const m = await buscarMercadoPorId(id);
          setMarket(m);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [marketId]);

  const changeMarket = async (newId) => {
    localStorage.setItem("marketId", newId);
    setMarketId(newId);
    const m = await buscarMercadoPorId(newId);
    setMarket(m);
  };

  return (
    <MarketContext.Provider value={{ marketId, market, setMarketId: changeMarket, loading }}>
      {children}
    </MarketContext.Provider>
  );
};
