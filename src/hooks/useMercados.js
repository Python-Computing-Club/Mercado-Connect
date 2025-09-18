import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

export default function useMercados() {
  const [mercados, setMercados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, "mercados");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMercados(lista);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar mercados:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { mercados, loading };
}
