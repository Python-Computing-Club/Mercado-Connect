import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  getDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { uploadParaCloudinary, excluirImagemCloudinary } from "../../hooks/cloudinaryUpload";

export const produtosRef = collection(db, "produtos");

export const listarCategoriasGlobais = async () => {
  try {
    const snapshot = await getDocs(collection(db, "categorias"));
    return snapshot.docs.map((doc) => doc.data().nome);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
};

export const escutarTodosProdutos = (callback) => {
  return onSnapshot(produtosRef, (snapshot) => {
    const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(produtos);
  });
};

export const escutarProdutosPorMercado = (id_mercado, callback) => {
  const q = query(produtosRef, where("id_mercado", "==", id_mercado));
  return onSnapshot(q, (snapshot) => {
    const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(produtos);
  });
};

export const criarProduto = async (dados, imagemFile) => {
  try {
    if (!dados.id_mercado) throw new Error("Produto precisa estar vinculado a um mercado (id_mercado).");
    if (!dados.nome || dados.nome.length > 150) throw new Error("Nome inválido");
    if (!dados.categoria || dados.categoria.length > 50) throw new Error("Categoria inválida");
    if (typeof dados.descricao !== "string") dados.descricao = dados.descricao || "";
    if (!Number.isInteger(Number(dados.quantidade)) || Number(dados.quantidade) < 0) throw new Error("Quantidade inválida");
    if (isNaN(Number(dados.preco)) || Number(dados.preco) <= 0) throw new Error("Preço inválido");
    if (!dados.unidade_de_medida || dados.unidade_de_medida.length > 20) throw new Error("Unidade inválida");
    if (dados.volume && (!Number.isInteger(Number(dados.volume)) || Number(dados.volume) <= 0)) throw new Error("Volume inválido");

    const id_produto = Date.now();

    const q = query(produtosRef, where("id_mercado", "==", dados.id_mercado), where("id_produto", "==", id_produto));
    const res = await getDocs(q);
    if (!res.empty) throw new Error("Conflito de id_produto, tente novamente");

    let imagemUrl = "";
    let imagemId = "";
    if (imagemFile) {
      const imagemData = await uploadParaCloudinary(imagemFile);
      imagemUrl = imagemData?.url || "";
      imagemId = imagemData?.public_id || "";
    }

    const preco = Number(Number(dados.preco).toFixed(2));
    const desconto = Number(dados.desconto || 0);
    const preco_final = desconto > 0 ? Number((preco * (1 - desconto / 100)).toFixed(2)) : null;

    const novoProduto = {
      id_produto,
      nome: dados.nome,
      categoria: dados.categoria,
      descricao: dados.descricao || "",
      quantidade: Number(dados.quantidade),
      preco,
      desconto,
      preco_final,
      disponivel: dados.disponivel === undefined ? true : !!dados.disponivel,
      unidade_de_medida: dados.unidade_de_medida,
      imagemUrl,
      imagemId,
      volume: dados.volume ? Number(dados.volume) : null,
      id_mercado: dados.id_mercado,
      marca: dados.marca || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(produtosRef, novoProduto);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return { success: false, error: error.message || error };
  }
};

export const listarProdutosPorMercado = async (id_mercado) => {
  try {
    const q = query(produtosRef, where("id_mercado", "==", id_mercado));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return [];
  }
};

export const atualizarProduto = async (docId, dados, imagemFile) => {
  try {
    const produtoRef = doc(db, "produtos", docId);
    const snapshot = await getDoc(produtoRef);
    if (!snapshot.exists()) return { success: false, error: "Produto não encontrado" };

    let imagemUrl = snapshot.data().imagemUrl || "";
    let imagemId = snapshot.data().imagemId || "";

    if (imagemFile) {
      if (imagemId) await excluirImagemCloudinary(imagemId);
      const imagemData = await uploadParaCloudinary(imagemFile);
      imagemUrl = imagemData?.url || "";
      imagemId = imagemData?.public_id || "";
    }

    const preco = Number(Number(dados.preco).toFixed(2));
    const desconto = Number(dados.desconto || 0);
    const preco_final = desconto > 0 ? Number((preco * (1 - desconto / 100)).toFixed(2)) : null;

    const updated = {
      nome: dados.nome,
      categoria: dados.categoria,
      descricao: dados.descricao || "",
      quantidade: Number(dados.quantidade),
      preco,
      desconto,
      preco_final,
      disponivel: !!dados.disponivel,
      unidade_de_medida: dados.unidade_de_medida,
      imagemUrl,
      imagemId,
      volume: dados.volume ? Number(dados.volume) : null,
      marca: dados.marca || "",
      updatedAt: serverTimestamp(),
    };

    await updateDoc(produtoRef, updated);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return { success: false, error: error.message || error };
  }
};

export const atualizarStatusProduto = async (docId, disponivel) => {
  try {
    const produtoRef = doc(db, "produtos", docId);
    await updateDoc(produtoRef, { disponivel, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do produto:", error);
    return { success: false, error: error.message || error };
  }
};

export const desativarProduto = async (docId) => {
  return await atualizarStatusProduto(docId, false);
};

export const excluirProduto = async (docId) => {
  try {
    const produtoRef = doc(db, "produtos", docId);
    const snapshot = await getDoc(produtoRef);
    if (!snapshot.exists()) return { success: false, error: "Produto não encontrado" };

    const produto = snapshot.data();

    if (produto.imagemId) {
      await excluirImagemCloudinary(produto.imagemId);
    }

    await deleteDoc(produtoRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return { success: false, error: error.message || error };
  }
};
