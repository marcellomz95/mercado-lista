import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Minha Lista de Compras" },
      {
        name: "description",
        content:
          "Controle suas compras e orçamento de forma simples e intuitiva.",
      },
      { property: "og:title", content: "Minha Lista de Compras" },
      {
        property: "og:description",
        content:
          "Controle suas compras e orçamento de forma simples e intuitiva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Category =
  | "Hortifruti"
  | "Carnes e Frios"
  | "Padaria"
  | "Laticínios"
  | "Mercearia"
  | "Bebidas"
  | "Limpeza"
  | "Higiene"
  | "Utilidades"
  | "Pet Shop"
  | "Bebê"
  | "Saúde"
  | "Doces e Snacks"
  | "Outros";

interface Product {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unitPrice: number;
}

interface PersistedData {
  initialBalance: number;
  products: Product[];
}

const CATEGORIES: Category[] = [
  "Hortifruti",
  "Carnes e Frios",
  "Padaria",
  "Laticínios",
  "Mercearia",
  "Bebidas",
  "Limpeza",
  "Higiene",
  "Utilidades",
  "Pet Shop",
  "Bebê",
  "Saúde",
  "Doces e Snacks",
  "Outros",
];

const STORAGE_KEY = "minha-lista-compras-v1";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(value: string) {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  return parseFloat(normalized) || 0;
}

function currencyInputToNumber(value: string) {
  return parseCurrencyInput(value);
}

function Index() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialBalance, setInitialBalance] = useState(0);
  const [initialBalanceInput, setInitialBalanceInput] = useState("0,00");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "value">("name");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedData = JSON.parse(saved);
        const balance = parsed.initialBalance || 0;
        setInitialBalance(balance);
        setInitialBalanceInput(formatCurrency(balance));
        setProducts(parsed.products || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados salvos:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const data: PersistedData = { initialBalance, products };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [initialBalance, products, isLoaded]);

  const totalPurchases = useMemo(
    () => products.reduce((sum, product) => sum + product.quantity * product.unitPrice, 0),
    [products]
  );

  const remainingBalance = initialBalance - totalPurchases;
  const isPositive = remainingBalance >= 0;

  const totalItems = useMemo(
    () => products.reduce((sum, product) => sum + product.quantity, 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = term
      ? products.filter((product) => product.name.toLowerCase().includes(term))
      : [...products];

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort(
        (a, b) =>
          b.quantity * b.unitPrice - a.quantity * a.unitPrice
      );
    }
    return list;
  }, [products, search, sortBy]);

  const calculatedTotal =
    (parseInt(quantity, 10) || 0) * currencyInputToNumber(unitPrice);

  function resetForm() {
    setEditingId(null);
    setName("");
    setQuantity("");
    setUnitPrice("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = parseInt(quantity, 10) || 0;
    const price = currencyInputToNumber(unitPrice);

    if (!name.trim() || qty <= 0 || price <= 0) return;

    if (editingId) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingId
            ? { ...product, name: name.trim(), quantity: qty, unitPrice: price }
            : product
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          quantity: qty,
          unitPrice: price,
        },
      ]);
    }
    resetForm();
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setQuantity(product.quantity.toString());
    setUnitPrice(formatCurrency(product.unitPrice));
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((product) => product.id !== id));
    if (editingId === id) resetForm();
  }

  function handleInitialBalanceChange(value: string) {
    const numeric = currencyInputToNumber(value);
    setInitialBalance(numeric);
    setInitialBalanceInput(formatCurrency(numeric));
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink font-sans text-foreground antialiased">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-16 size-[440px] rounded-full bg-mint/20 blur-[120px]" />
        <div className="absolute left-1/3 -top-24 size-[420px] rounded-full bg-rose/15 blur-[120px]" />
        <div className="absolute -right-16 top-0 size-[420px] rounded-full bg-aurora/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header / Dashboard */}
        <header className="sticky top-0 z-20 -mx-4 px-4 pt-5 pb-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
                  MC
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight text-zinc-50 text-balance">
                  Minha Lista de Compras
                </h1>
                <p className="text-xs text-muted-foreground">
                  Carteira de controle de orçamento
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-white/10 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-mint" />
              Tudo salvo neste navegador
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Saldo Inicial</span>
                <Pencil className="size-4 text-muted-foreground/60" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={initialBalanceInput}
                  onChange={(e) => setInitialBalanceInput(e.target.value)}
                  onBlur={(e) => handleInitialBalanceChange(e.target.value)}
                  className="w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
                  aria-label="Saldo inicial"
                />
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-xs text-muted-foreground">
                Valor Total das Compras
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg text-muted-foreground">R$</span>
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(totalPurchases)}
                </span>
              </div>
            </div>

            <div
              className={`rounded-xl p-4 ring-1 ${
                isPositive
                  ? "bg-mint/10 ring-mint/25"
                  : "bg-rose/10 ring-rose/25"
              }`}
            >
              <div
                className={`text-xs ${
                  isPositive ? "text-mint/80" : "text-rose/80"
                }`}
              >
                Saldo Restante
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className={`text-lg ${
                    isPositive ? "text-mint/70" : "text-rose/70"
                  }`}
                >
                  R$
                </span>
                <span
                  className={`text-2xl font-semibold tracking-tight ${
                    isPositive ? "text-mint" : "text-rose"
                  }`}
                >
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mt-1 grid grid-cols-1 gap-4 pb-12 lg:grid-cols-12">
          {/* Add / edit product form */}
          <section className="lg:col-span-4">
            <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="text-sm font-semibold text-foreground">
                {editingId ? "Editar produto" : "Adicionar produto"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {editingId ? "Atualize os dados do item" : "Entrada nova na sua carteira"}
              </p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Nome do produto
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Café especial"
                    className="mt-1 w-full rounded-lg bg-black/30 px-3 py-2 text-sm text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">
                      Quantidade
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="2"
                      className="mt-1 w-full rounded-lg bg-black/30 px-3 py-2 text-sm text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">
                      Preço unitário
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="34,90"
                      className="mt-1 w-full rounded-lg bg-black/30 px-3 py-2 text-sm text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2.5 ring-1 ring-white/10">
                  <span className="text-xs text-muted-foreground">
                    Preço Total
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    R$ {formatCurrency(calculatedTotal)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-mint py-2.5 text-sm font-semibold text-ink ring-1 ring-mint/40 transition hover:opacity-90 active:opacity-80"
                  >
                    {editingId ? "Salvar alterações" : "Adicionar à lista"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground ring-1 ring-white/10 transition hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Product list */}
          <section className="lg:col-span-8">
            <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Produtos
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {products.length} {products.length === 1 ? "item registrado" : "itens registrados"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar produto"
                      className="w-full rounded-lg bg-black/30 py-2 pl-9 pr-3 text-sm text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none sm:w-48"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "name" | "value")
                    }
                    className="rounded-lg bg-black/30 py-2 pl-3 pr-8 text-sm text-foreground ring-1 ring-white/10 focus:ring-2 focus:ring-mint/40 focus:outline-none"
                  >
                    <option value="name">Nome</option>
                    <option value="value">Valor</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                {filteredProducts.length === 0 ? (
                  <div className="rounded-lg bg-black/20 py-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
                    {search.trim() ? (
                      <>
                        Nenhum produto encontrado para "{search.trim()}".
                      </>
                    ) : (
                      <>Nenhum produto na lista ainda. Adicione o primeiro item.</>
                    )}
                  </div>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Produto</th>
                        <th className="pb-2 text-right font-medium">Qtd</th>
                        <th className="pb-2 text-right font-medium">Unit.</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                        <th className="pb-2 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="py-3 pr-3 font-medium text-foreground">
                            {product.name}
                          </td>
                          <td className="py-3 pr-3 text-right text-muted-foreground">
                            {product.quantity}
                          </td>
                          <td className="py-3 pr-3 text-right text-muted-foreground">
                            {formatCurrency(product.unitPrice)}
                          </td>
                          <td className="py-3 pr-3 text-right font-semibold text-foreground">
                            {formatCurrency(product.quantity * product.unitPrice)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => handleEdit(product)}
                                className="rounded-md p-1.5 text-muted-foreground ring-1 ring-white/10 transition hover:bg-white/10 hover:text-foreground"
                                aria-label="Editar"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="rounded-md p-1.5 text-muted-foreground ring-1 ring-white/10 transition hover:bg-rose/10 hover:text-rose"
                                aria-label="Excluir"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Financial summary */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Total de itens
                  </div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {totalItems}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Valor total
                  </div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    R$ {formatCurrency(totalPurchases)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Saldo restante
                  </div>
                  <div
                    className={`mt-1 text-base font-semibold ${
                      isPositive ? "text-mint" : "text-rose"
                    }`}
                  >
                    R$ {formatCurrency(remainingBalance)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
