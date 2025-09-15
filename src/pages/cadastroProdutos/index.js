import React, { useEffect, useState } from "react";
import styles from "./gerenciar-estoque.module.css";
import FormProduto from "../../components/CadastroProdutosForm/index";
import {criarProduto,atualizarProduto,atualizarStatusProduto,excluirProduto,escutarProdutosPorMercado,
} from "../../services/firestore/produtos";
import { useMarket } from "../../Context/MarketContext";
import { useNavigate } from "react-router-dom";

export default function GerenciarEstoquePage() {
  const { market, marketId, loading } = useMarket();
  const [produtos, setProdutos] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [edit, setEdit] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [sort, setSort] = useState("nome");
  const [modoExclusao, setModoExclusao] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  if (!loading && marketId) {
    const unsubscribe = escutarProdutosPorMercado(marketId, (lista) => {
      setProdutos(lista);
    });
    return () => unsubscribe();
  }
}, [marketId, loading]);


  const handleSubmit = async (dados, imagemFile, isToggleDisponivel = false) => {
    try {
      if (isToggleDisponivel) {
        await atualizarStatusProduto(dados.id, dados.disponivel);
      } else {
        if (edit) {
          await atualizarProduto(edit.id, dados, imagemFile);
        } else {
          await criarProduto(dados, imagemFile);
        }
      }
      setOpenForm(false);
      setEdit(null);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Veja console para mais detalhes.");
    }
  };

  const handleToggleDisponivel = async (produto) => {
    try {
      await atualizarStatusProduto(produto.id, !produto.disponivel);
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      alert("Erro ao atualizar status do produto.");
    }
  };

  const handleExcluirSelecionados = async () => {
    if (selecionados.length === 0) {
      setModoExclusao(false);
      return;
    }
    if (
      window.confirm(`Deseja mesmo excluir ${selecionados.length} produto(s)?`) &&
      window.confirm("Tem certeza? Essa ação não pode ser desfeita.")
    ) {
      try {
        await Promise.all(selecionados.map((id) => excluirProduto(id)));
        setSelecionados([]);
        setModoExclusao(false);
      } catch (err) {
        console.error("Erro ao excluir produtos:", err);
        alert("Erro ao excluir produtos. Veja console.");
      }
    }
  };

  const filtered = produtos
    .filter((p) => {
      const busca = queryText.toLowerCase();
      return (
        (p.nome?.toLowerCase().includes(busca) ?? false) ||
        (p.categoria?.toLowerCase().includes(busca) ?? false)
      );
    })
    .sort((a, b) => {
      if (sort === "preco") {
        return Number(a.preco) - Number(b.preco);
      }
      if (a.nome && b.nome) {
        return a.nome.localeCompare(b.nome);
      }
      return 0;
    });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {market?.logoUrl ? (
            <img
              src={market.logoUrl}
              alt={market?.nome}
              className={styles.marketLogo}
            />
          ) : (
            <div className={styles.marketPlaceholder}>
              {market?.nome?.[0] || "M"}
            </div>
          )}
          <div>
            <h2>
              Gerenciar Estoque {market?.nome ? `— ${market.nome}` : ""}
            </h2>
            <small>Adicione, edite ou exclua produtos do seu mercado</small>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/painel-mercado")}
          >
            ← Voltar ao Painel
          </button>

          <input
            placeholder="Pesquisar por nome ou categoria..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className={styles.search}
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={styles.select}
          >
            <option value="nome">Ordenar por nome</option>
            <option value="preco">Ordenar por preço</option>
          </select>

          <button
            className={styles.addButton}
            onClick={() => {
              setEdit(null);
              setOpenForm(true);
            }}
          >
            + Adicionar Produto
          </button>

          <button
            className={modoExclusao ? styles.deleteConfirm : styles.deleteButton}
            onClick={() => {
              if (modoExclusao) {
                handleExcluirSelecionados();
              } else {
                setModoExclusao(true);
                setSelecionados([]);
              }
            }}
          >
            {modoExclusao
              ? `Excluir (${selecionados.length})`
              : "Excluir Produtos"}
          </button>
        </div>
      </header>

      <main>
        <div className={styles.grid}>
          {filtered.map((p) => {
            const isSelected = selecionados.includes(p.id);
            return (
              <article
                key={p.id}
                className={`${styles.card} ${
                  modoExclusao && isSelected ? styles.cardSelected : ""
                }`}
                onClick={() => {
                  if (modoExclusao) {
                    setSelecionados((prev) =>
                      prev.includes(p.id)
                        ? prev.filter((x) => x !== p.id)
                        : [...prev, p.id]
                    );
                  }
                }}
              >
                {modoExclusao && (
                  <div
                    className={`${styles.checkbox} ${
                      isSelected ? styles.checkboxChecked : ""
                    }`}
                  >
                    {isSelected && "✔"}
                  </div>
                )}

                <div className={styles.cardTop}>
                  <img
                    src={p.imagemUrl || "/placeholder.png"}
                    alt={p.nome}
                    className={styles.cardImage}
                  />
                  <div className={styles.badge}>
                    <span
                      className={p.disponivel ? styles.badgeOn : styles.badgeOff}
                    >
                      {p.disponivel ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{p.nome}</h3>
                  <p className={styles.cardSubtitle}>
                    {p.categoria} • {p.marca || ""}
                  </p>

                  <div className={styles.cardMeta}>
                    <div className={styles.price}>
                      {typeof p.preco_final === "number" &&
                      p.preco_final < p.preco ? (
                        <>
                          <span className={styles.oldPrice}>
                            {Number(p.preco).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                          <span className={styles.discountedPrice}>
                            {Number(p.preco_final).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </>
                      ) : (
                        <span className={styles.discountedPrice}>
                          {Number(p.preco).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      )}
                    </div>
                    <div className={styles.qty}>
                      {p.volume} {p.unidade_de_medida}
                    </div>
                  </div>

                  <p className={styles.descricao}>{p.descricao}</p>

                  {!modoExclusao && (
                    <div className={styles.cardActions}>
                      <button
                        className={styles.edit}
                        onClick={() => {
                          setEdit(p);
                          setOpenForm(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className={
                          p.disponivel ? styles.desativar : styles.ativar
                        }
                        onClick={() => handleToggleDisponivel(p)}
                      >
                        {p.disponivel ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {openForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button
              className={styles.close}
              onClick={() => {
                setOpenForm(false);
                setEdit(null);
              }}
            >
              ✕
            </button>
            <FormProduto
              produto={edit}
              onSubmit={handleSubmit}
              onCancel={() => {
                setOpenForm(false);
                setEdit(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}