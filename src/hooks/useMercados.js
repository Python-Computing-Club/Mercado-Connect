import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export default function useMercados() {
  const [mercados, setMercados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMercados = async () => {
      try {
        const colRef = collection(db, "mercados");
        const snapshot = await getDocs(colRef);
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          logoUrl: doc.data().logoUrl || "",
        }));
        setMercados(lista);
      } catch (error) {
        console.error("Erro ao buscar mercados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMercados();
  }, []);

  return mercados;
}
