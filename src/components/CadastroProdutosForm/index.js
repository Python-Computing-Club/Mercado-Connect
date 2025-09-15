import { useEffect, useState } from "react";
import { listarCategoriasGlobais } from "../../services/firestore/categorias";
import styles from "./formProdutos.module.css";
import { useMarket } from "../../Context/MarketContext";
import { criarProduto, atualizarProduto } from "../../services/firestore/produtos";

export default function FormProduto({ onCancel, produto }) {
  const { marketId } = useMarket();

  const [form, setForm] = useState({
    id_produto: produto?.id_produto || "",
    nome: produto?.nome || "",
    categoria: produto?.categoria || "",
    descricao: produto?.descricao || "",
    quantidade: produto?.quantidade ?? "",
    preco: produto?.preco ?? "",
    desconto: produto?.desconto ?? 0,
    disponivel: produto?.disponivel ?? true,
    unidade_de_medida: produto?.unidade_de_medida || "un",
    imagemFile: null,
    volume: produto?.volume ?? "",
    imagemUrl: produto?.imagemUrl || null,
    marca: produto?.marca || "",
  });

  const [preview, setPreview] = useState(produto?.imagemUrl || "");
  const [categorias, setCategorias] = useState([]);
  const unidadesPadrao = ["kg", "un", "L", "ml", "g"];
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({
    visible: false,
    message: "",
  });

  const [modalDica, setModalDica] = useState({ visible: false, message: "" });

  const MiniDica = ({ msg }) => (
    <button
      type="button"
      onClick={() => setModalDica({ visible: true, message: msg })}
      style={{
        marginLeft: "5px",
        background: "#eee",
        border: "1px solid #ccc",
        borderRadius: "50%",
        width: "20px",
        height: "20px",
        cursor: "pointer",
        fontSize: "12px",
        lineHeight: "18px",
        textAlign: "center",
      }}
      aria-label="Dica"
    >
      ?
    </button>
  );

  useEffect(() => {
    if (produto) {
      setForm({
        id_produto: produto.id_produto,
        nome: produto.nome,
        categoria: produto.categoria,
        descricao: produto.descricao,
        quantidade: produto.quantidade,
        preco: produto.preco,
        desconto: produto.desconto ?? 0,
        disponivel: produto.disponivel,
        unidade_de_medida: produto.unidade_de_medida || "un",
        imagemFile: null,
        volume: produto.volume ?? "",
        imagemUrl: produto.imagemUrl || null,
        marca: produto?.marca || "",
      });
      setPreview(produto.imagemUrl || "");
    }
  }, [produto]);

  useEffect(() => {
    const loadCats = async () => {
      const cats = await listarCategoriasGlobais();
      setCategorias(cats.map((c) => c.nome));
    };
    loadCats();
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    setForm((s) => ({ ...s, imagemFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validarVolume = (valor, unidade) => {
    const volume = Number(valor);
    const limites = {
      ml: { min: 1, max: 20000 },
      L: { min: 1, max: 20 },
      g: { min: 1, max: 20000 },
      kg: { min: 1, max: 20 },
      un: { min: 1, max: 999 },
    };

    const limite = limites[unidade];
    if (!limite) return { valido: true, valorCorrigido: volume, mensagem: "" };

    if (isNaN(volume)) {
      return { valido: false, valorCorrigido: "", mensagem: `Volume deve ser um número.` };
    }

    if (volume < limite.min) {
      return {
        valido: false,
        valorCorrigido: limite.min,
        mensagem: `O volume para "${unidade}" deve ser no mínimo ${limite.min}.`,
      };
    }

    if (volume > limite.max) {
      return {
        valido: false,
        valorCorrigido: limite.max,
        mensagem: `O volume para "${unidade}" não pode exceder ${limite.max}.`,
      };
    }

    return { valido: true, valorCorrigido: volume, mensagem: "" };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "preco") {
      const numeric = value.replace(/\D/g, "").replace(/^0+/, "");
      const float = (Number(numeric) / 100).toFixed(2);
      setForm((s) => ({ ...s, preco: isNaN(float) ? "" : float }));
    } else if (type === "checkbox") {
      setForm((s) => ({ ...s, [name]: checked }));
    } else if (name === "volume") {
      const unidade = form.unidade_de_medida;
      const { valido, valorCorrigido, mensagem } = validarVolume(value, unidade);

      if (!valido) {
        setNotification({ visible: true, message: mensagem });
        setTimeout(() => setNotification({ visible: false, message: "" }), 3000);
      }

      setForm((s) => ({ ...s, [name]: valorCorrigido }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleDescontoChange = (delta) => {
    setForm((prev) => {
      let novo = prev.desconto + delta;
      if (novo < 0) novo = 0;
      if (novo > 100) novo = 100;
      return { ...prev, desconto: novo };
    });
  };

  const calcularPrecoComDesconto = () => {
    const preco = parseFloat(form.preco);
    const desconto = parseFloat(form.desconto || 0);
    if (isNaN(preco) || isNaN(desconto)) return "";
    return (preco * (1 - desconto / 100)).toFixed(2);
  };

  const formatarValorMonetario = (valor) => {
    if (valor === "") return "R$ 0,00";
    return (
      "R$ " +
      Number(valor)
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    if (!marketId) {
      setNotification({ visible: true, message: "Nenhum mercado selecionado." });
      setTimeout(() => setNotification({ visible: false, message: "" }), 2000);
      return;
    }

    const { valido, valorCorrigido, mensagem } = validarVolume(form.volume, form.unidade_de_medida);
    if (!valido) {
      setNotification({ visible: true, message: mensagem });
      setForm((s) => ({ ...s, volume: valorCorrigido }));
      setTimeout(() => setNotification({ visible: false, message: "" }), 3000);
      return;
    }

    setLoading(true);
    try {
      const imagemFile = form.imagemFile || null;
      const precoFinal =
        form.desconto > 0
          ? Number((form.preco * (1 - form.desconto / 100)).toFixed(2))
          : null;

      const payload = {
        ...form,
        preco: Number(form.preco),
        desconto: Number(form.desconto),
        preco_final: precoFinal,
        quantidade: Number(form.quantidade),
        volume: valorCorrigido,
        imagemUrl: form.imagemUrl || "",
        id_mercado: marketId,
      };

      if (form.id_produto) {
        await atualizarProduto(produto.id, payload, imagemFile);
        setNotification({ visible: true, message: "Produto atualizado com sucesso!" });
      } else {
        await criarProduto(payload, imagemFile);
        setNotification({ visible: true, message: "Produto criado com sucesso!" });
      }

      setTimeout(() => {
        setNotification({ visible: false, message: "" });
        onCancel();
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      setNotification({ visible: true, message: "Erro ao salvar produto." });
      setTimeout(() => setNotification({ visible: false, message: "" }), 2000);
    }
    setLoading(false);
  };

  return (
    <>
      <form className={styles.form} onSubmit={onFormSubmit}>
        <div className={styles.row}>
          <div className={styles.col}>
            <label>
              Código <MiniDica msg="Código único do produto. Geralmente é gerado automaticamente." />
            </label>
            <input type="text" value={form.id_produto || "(gerado)"} disabled />
          </div>
          <div className={styles.col}>
            <label>
              Nome <MiniDica msg="Nome que identifica o produto (ex.: Arroz Integral 1kg)." />
            </label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>
              Categoria <MiniDica msg="Categoria onde o produto será listado (ex.: Bebidas, Higiene, Limpeza)." />
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">— selecione —</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.col}>
            <label>
              Marca <MiniDica msg="Marca do produto (ex.: Nestlé, Colgate, Coca-Cola)." />
            </label>
            <input
              name="marca"
              value={form.marca || ""}
              onChange={handleChange}
              maxLength={100}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>
              Descrição <MiniDica msg="Descrição detalhada do produto." />
            </label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.colInline}>
            <label>Quantidade</label>
            <input
              type="number"
              name="quantidade"
              value={form.quantidade}
              onChange={handleChange}
              min={0}
              disabled={loading}
              style={{ width: "70px" }}
            />

            <label>Unidade</label>
            <select
              name="unidade_de_medida"
              value={form.unidade_de_medida}
              onChange={handleChange}
              disabled={loading}
              style={{ width: "80px" }}
              translate="no"
            >
              {unidadesPadrao.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <label>Volume</label>
            <input
              type="number"
              name="volume"
              value={form.volume}
              onChange={handleChange}
              min={0}
              disabled={loading}
              style={{ width: "80px" }}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>
              Preço <MiniDica msg="Preço base do produto (sem desconto)." />
            </label>
            <input
              type="text"
              name="preco"
              value={form.preco}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="R$ 0,00"
            />
          </div>

          <div className={styles.col}>
            <label>
              Desconto <MiniDica msg="Desconto percentual aplicado sobre o preço." />
            </label>
            <div className={styles.descontoField}>
              <button
                type="button"
                onClick={() => handleDescontoChange(-5)}
                disabled={loading}
                aria-label="Diminuir desconto"
              >
                −
              </button>
              <input
                type="number"
                name="desconto"
                value={form.desconto}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0 && val <= 100) {
                    setForm((s) => ({ ...s, desconto: val }));
                  }
                }}
                min={0}
                max={100}
                disabled={loading}
                style={{ width: "60px", textAlign: "right" }}
              />
              <button
                type="button"
                onClick={() => handleDescontoChange(5)}
                disabled={loading}
                aria-label="Aumentar desconto"
              >
                +
              </button>
              <span className={styles.percent}>%</span>
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>Preço com desconto</label>
            <input
              type="text"
              value={formatarValorMonetario(calcularPrecoComDesconto())}
              disabled
            />
          </div>

          <div className={styles.colFile}>
            <label>Imagem</label>
            <input
              type="file"
              onChange={handleFile}
              accept="image/*"
              disabled={loading}
            />
            {preview && <img src={preview} alt="Preview" className={styles.preview} />}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.colInline}>
            <label>Disponível</label>
            <input
              type="checkbox"
              name="disponivel"
              checked={form.disponivel}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Salvando..." : produto ? "Atualizar" : "Criar"}
          </button>
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>

      {modalDica.visible && (
        <div
          style={{
            position: "fixed",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
            zIndex: 100,
            maxWidth: "300px",
          }}
          onClick={() => setModalDica({ visible: false, message: "" })}
        >
          <p>{modalDica.message}</p>
          <button
            onClick={() => setModalDica({ visible: false, message: "" })}
            style={{
              marginTop: "12px",
              background: "#012e0d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {notification.visible && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#012e0d",
            color: "white",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            zIndex: 100,
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
