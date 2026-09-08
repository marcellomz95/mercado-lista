import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardPaste,
  Copy,
  Pencil,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CategorySelect, type Category } from "@/components/CategorySelect";
import { decodeSeed, encodeSeed } from "@/lib/seed";
import { ThemeSelect } from "@/components/ThemeSelect";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lista de Compras — by MarcelloMZ" },
      {
        name: "description",
        content:
          "Controle suas compras e orçamento, edite preços na lista e compartilhe tudo com uma seed.",
      },
      { property: "og:title", content: "Lista de Compras — by MarcelloMZ" },
      {
        property: "og:description",
        content:
          "Controle suas compras e orçamento, edite preços na lista e compartilhe tudo com uma seed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface Product {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unitPrice: number;
  purchased: boolean;
}

interface PersistedData {
  initialBalance: number;
  products: Product[];
}

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
  const [sortBy, setSortBy] = useState<"name" | "value" | "category">("name");
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "name" | "category" | "quantity" | "unitPrice";
  } | null>(null);
  const [lastTouch, setLastTouch] = useState<{ id: string; time: number } | null>(null);


  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Outros");
  const [quantity, setQuantity] = useState("");

  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [seedError, setSeedError] = useState("");
  const [pendingSeed, setPendingSeed] = useState<PersistedData | null>(null);

  const [clearModalOpen, setClearModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedData = JSON.parse(saved);
        const balance = parsed.initialBalance || 0;
        setInitialBalance(balance);
        setInitialBalanceInput(formatCurrency(balance));
        setProducts(
          (parsed.products || []).map((product) => ({
            ...product,
            category: (product.category || "Outros") as Category,
            purchased: Boolean(product.purchased),
          }))
        );
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

  /** Seed recalculada automaticamente a cada alteração na lista. */
  const seed = useMemo(
    () => encodeSeed({ initialBalance, products }),
    [initialBalance, products]
  );

  const totalPurchases = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + product.quantity * product.unitPrice,
        0
      ),
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
    let list = [...products];

    if (term) {
      list = list.filter((product) =>
        product.name.toLowerCase().includes(term)
      );
    }

    if (filterCategory) {
      list = list.filter((product) => product.category === filterCategory);
    }

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "category") {
      list.sort((a, b) => a.category.localeCompare(b.category));
    } else {
      list.sort(
        (a, b) => b.quantity * b.unitPrice - a.quantity * a.unitPrice
      );
    }
    return list;
  }, [products, search, sortBy, filterCategory]);

  function resetForm() {
    setName("");
    setCategory("Outros");
    setQuantity("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = parseInt(quantity, 10) || 0;

    if (!name.trim() || qty <= 0) return;

    setProducts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        category,
        quantity: qty,
        unitPrice: 0,
        purchased: false,
      },
    ]);
    resetForm();
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, ...patch } : product
      )
    );
  }

  function handleNameCommit(id: string, raw: string) {
    const value = raw.trim();
    if (value) updateProduct(id, { name: value });
    setNameDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEditingCell(null);
  }

  function handleQtyCommit(id: string, raw: string) {
    const qty = parseInt(raw, 10);
    if (qty > 0) updateProduct(id, { quantity: qty });
    setQtyDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEditingCell(null);
  }


  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }

  function handleClearAll() {
    setProducts([]);
    setPriceDrafts({});
    setNameDrafts({});
    setQtyDrafts({});
    setClearModalOpen(false);
    toast.success("Lista apagada");
  }

  function closeClearModal() {
    setClearModalOpen(false);
  }

  function handleUnitPriceCommit(id: string, raw: string) {
    const price = currencyInputToNumber(raw);
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, unitPrice: price } : product
      )
    );
    setPriceDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEditingCell(null);
  }

  function togglePurchased(id: string) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, purchased: !product.purchased }
          : product
      )
    );
  }

  function isEditing(
    id: string,
    field: "name" | "category" | "quantity" | "unitPrice"
  ) {
    return editingCell?.id === id && editingCell?.field === field;
  }


  function startEditing(
    id: string,
    field: "name" | "category" | "quantity" | "unitPrice"
  ) {
    setEditingCell({ id, field });
  }

  function handleCellClick(
    id: string,
    field: "name" | "category" | "quantity" | "unitPrice"
  ) {
    startEditing(id, field);
  }

  function handleCellTouch(
    id: string,
    field: "name" | "category" | "quantity" | "unitPrice"
  ) {
    const now = Date.now();
    if (
      lastTouch &&
      lastTouch.id === `${id}-${field}` &&
      now - lastTouch.time < 400
    ) {
      startEditing(id, field);
      setLastTouch(null);
    } else {
      setLastTouch({ id: `${id}-${field}`, time: now });
    }
  }

  function commitEditing() {
    setEditingCell(null);
  }


  function handleInitialBalanceChange(value: string) {
    const numeric = currencyInputToNumber(value);
    setInitialBalance(numeric);
    setInitialBalanceInput(formatCurrency(numeric));
  }

  async function handleCopySeed() {
    try {
      await navigator.clipboard.writeText(seed);
      toast.success("Seed copiada");
    } catch {
      toast.error("Não foi possível copiar a seed");
    }
  }

  function handleValidateSeed() {
    try {
      const payload = decodeSeed(seedInput);
      setSeedError("");
      setPendingSeed(payload);
    } catch (error) {
      setPendingSeed(null);
      setSeedError(
        error instanceof Error ? error.message : "Seed inválida."
      );
    }
  }

  function handleConfirmSeed() {
    if (!pendingSeed) return;
    setInitialBalance(pendingSeed.initialBalance);
    setInitialBalanceInput(formatCurrency(pendingSeed.initialBalance));
    setProducts(pendingSeed.products);
    setPriceDrafts({});
    resetForm();
    setPendingSeed(null);
    setSeedInput("");
    setSeedError("");
    setSeedModalOpen(false);
    toast.success("Lista carregada da seed");
  }

  function closeSeedModal() {
    setSeedModalOpen(false);
    setPendingSeed(null);
    setSeedError("");
    setSeedInput("");
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
        style={{ opacity: "var(--glow)" }}
        aria-hidden="true"
      >
        <div className="absolute -left-24 -top-16 size-[440px] rounded-full bg-mint/20 blur-[120px]" />
        <div className="absolute left-1/3 -top-24 size-[420px] rounded-full bg-rose/15 blur-[120px]" />
        <div className="absolute -right-16 top-0 size-[420px] rounded-full bg-aurora/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint/15 ring-1 ring-mint/30">
              <ShoppingCart className="size-5 text-mint" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-heading text-balance">
                Lista de Compras
              </h1>
              <p className="text-xs text-muted-foreground">by MarcelloMZ</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-hairline lg:inline-flex">
              <span className="size-1.5 rounded-full bg-mint" />
              Tudo salvo neste navegador
            </span>
            <ThemeSelect />
          </div>
        </header>

        {/* Sticky financial dashboard */}
        <div className="sticky top-0 z-30 -mx-4 border-b border-hairline bg-background/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0 rounded-xl bg-surface p-2.5 ring-1 ring-hairline sm:p-4">
              <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground sm:text-xs">
                <span className="truncate">Saldo Inicial</span>
                <Pencil className="size-3.5 shrink-0 text-muted-foreground/60" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground sm:text-lg">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={initialBalanceInput}
                  onChange={(e) => setInitialBalanceInput(e.target.value)}
                  onBlur={(e) => handleInitialBalanceChange(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-base font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-2xl"
                  aria-label="Saldo inicial"
                />
              </div>
            </div>

            <div className="min-w-0 rounded-xl bg-surface p-2.5 ring-1 ring-hairline sm:p-4">
              <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
                Total das Compras
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground sm:text-lg">
                  R$
                </span>
                <span className="truncate text-base font-semibold tracking-tight text-foreground sm:text-2xl">
                  {formatCurrency(totalPurchases)}
                </span>
              </div>
            </div>

            <div
              className={`min-w-0 rounded-xl p-2.5 ring-1 sm:p-4 ${
                isPositive
                  ? "bg-mint/10 ring-mint/25"
                  : "bg-rose/10 ring-rose/25"
              }`}
            >
              <div
                className={`truncate text-[11px] sm:text-xs ${
                  isPositive ? "text-mint/80" : "text-rose/80"
                }`}
              >
                Saldo Restante
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span
                  className={`text-xs sm:text-lg ${
                    isPositive ? "text-mint/70" : "text-rose/70"
                  }`}
                >
                  R$
                </span>
                <span
                  className={`truncate text-base font-semibold tracking-tight sm:text-2xl ${
                    isPositive ? "text-mint" : "text-rose"
                  }`}
                >
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="mt-4 grid grid-cols-1 gap-4 pb-12 lg:grid-cols-12">
          {/* Add / edit product form */}
          <section className="lg:col-span-4">
            <div className="rounded-2xl bg-surface p-5 ring-1 ring-hairline">
              <h2 className="text-sm font-semibold text-foreground">
                Adicionar produto
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O preço é preenchido depois, na lista
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
                    className="mt-1 w-full rounded-lg bg-field px-3 py-2 text-sm text-foreground ring-1 ring-hairline placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Categoria
                  </span>
                  <CategorySelect
                    value={category}
                    onChange={(value) => setCategory(value as Category)}
                    className="mt-1 w-full"
                  />
                </label>
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
                    className="mt-1 w-full rounded-lg bg-field px-3 py-2 text-sm text-foreground ring-1 ring-hairline placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-mint py-2.5 text-sm font-semibold text-onprimary ring-1 ring-mint/40 transition hover:opacity-90 active:opacity-80"
                >
                  Adicionar à lista
                </button>
              </form>
            </div>
          </section>

          {/* Product list */}
          <section className="space-y-4 lg:col-span-8">
            {/* Share by seed */}
            <div className="rounded-2xl bg-surface p-4 ring-1 ring-hairline">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    Compartilhar lista
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Copie a seed e envie para alguém recriar sua lista.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={handleCopySeed}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-onprimary transition hover:opacity-90"
                  >
                    <Copy className="size-3.5" />
                    Copiar seed
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeedModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground ring-1 ring-hairline transition hover:bg-surface-hover"
                  >
                    <ClipboardPaste className="size-3.5" />
                    Carregar seed
                  </button>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg bg-field px-3 py-2 ring-1 ring-hairline">
                <code className="block whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                  {seed}
                </code>
              </div>
            </div>

            <div className="rounded-2xl bg-surface p-5 ring-1 ring-hairline">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Produtos
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {products.length}{" "}
                      {products.length === 1
                        ? "item registrado"
                        : "itens registrados"}
                    </p>
                  </div>
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setClearModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose/10 px-2.5 py-1.5 text-xs font-semibold text-rose ring-1 ring-rose/25 transition hover:bg-rose/20"
                      aria-label="Apagar todos os itens"
                      title="Apagar todos os itens"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="hidden sm:inline">Limpar lista</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar produto"
                      className="w-full rounded-lg bg-field py-2 pl-9 pr-3 text-sm text-foreground ring-1 ring-hairline placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none sm:w-48"
                    />
                  </div>
                  <CategorySelect
                    value={filterCategory}
                    onChange={(value) =>
                      setFilterCategory(value as Category | "")
                    }
                    includeAll
                    className="w-44"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "name" | "value" | "category")
                    }
                    className="rounded-lg bg-field py-2 pl-3 pr-8 text-sm text-foreground ring-1 ring-hairline focus:ring-2 focus:ring-mint/40 focus:outline-none"
                  >
                    <option value="name">Nome</option>
                    <option value="category">Categoria</option>
                    <option value="value">Valor</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                {filteredProducts.length === 0 ? (
                  <div className="rounded-lg bg-field py-10 text-center text-sm text-muted-foreground ring-1 ring-hairline">
                    {search.trim() || filterCategory ? (
                      <>
                        Nenhum produto encontrado
                        {search.trim() && ` para "${search.trim()}"`}
                        {filterCategory && ` na categoria "${filterCategory}"`}.
                      </>
                    ) : (
                      <>
                        Nenhum produto na lista ainda. Adicione o primeiro item.
                      </>
                    )}
                  </div>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Produto</th>
                        <th className="pb-2 font-medium">Categoria</th>
                        <th className="pb-2 text-right font-medium">Qtd</th>
                        <th className="pb-2 text-right font-medium">Unit.</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                        <th className="pb-2 text-right font-medium">
                          <span className="sr-only">Excluir</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => togglePurchased(product.id)}
                                aria-label={
                                  product.purchased
                                    ? "Marcar como pendente"
                                    : "Marcar como comprado"
                                }
                                aria-pressed={product.purchased}
                                className={`grid size-5 shrink-0 place-items-center rounded-md ring-1 transition ${
                                  product.purchased
                                    ? "bg-mint text-onprimary ring-mint/50"
                                    : "bg-field text-transparent ring-hairline hover:ring-mint/40"
                                }`}
                              >
                                <Check className="size-3.5" />
                              </button>
                              {isEditing(product.id, "name") ? (
                                <input
                                  type="text"
                                  autoFocus
                                  aria-label={`Nome de ${product.name}`}
                                  value={nameDrafts[product.id] ?? product.name}
                                  onChange={(e) =>
                                    setNameDrafts((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  onFocus={(e) => e.currentTarget.select()}
                                  onBlur={(e) =>
                                    handleNameCommit(product.id, e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      e.currentTarget.blur();
                                  }}
                                  className={`w-full min-w-28 rounded-md bg-field px-1.5 py-1 font-medium ring-2 ring-mint/40 outline-none ${
                                    product.purchased
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }`}
                                />
                              ) : (
                                <span
                                  onDoubleClick={() =>
                                    handleCellClick(product.id, "name")
                                  }
                                  onTouchEnd={() =>
                                    handleCellTouch(product.id, "name")
                                  }
                                  title="Duplo clique/toque para editar"
                                  className={`w-full min-w-28 cursor-pointer rounded-md px-1.5 py-1 font-medium ring-1 ring-transparent transition hover:ring-hairline ${
                                    product.purchased
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }`}
                                >
                                  {product.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            {isEditing(product.id, "category") ? (
                              <CategorySelect
                                value={product.category}
                                onChange={(value) => {
                                  updateProduct(product.id, {
                                    category: value as Category,
                                  });
                                  commitEditing();
                                }}
                                aria-label={`Categoria de ${product.name}`}
                                className="w-40"
                              />
                            ) : (
                              <span
                                onDoubleClick={() =>
                                  handleCellClick(product.id, "category")
                                }
                                onTouchEnd={() =>
                                  handleCellTouch(product.id, "category")
                                }
                                title="Duplo clique/toque para editar"
                                className="inline-block w-40 cursor-pointer rounded-md px-1.5 py-1 text-foreground ring-1 ring-transparent transition hover:ring-hairline"
                              >
                                {product.category}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            {isEditing(product.id, "quantity") ? (
                              <input
                                type="number"
                                min={1}
                                autoFocus
                                aria-label={`Quantidade de ${product.name}`}
                                value={
                                  qtyDrafts[product.id] ??
                                  product.quantity.toString()
                                }
                                onChange={(e) =>
                                  setQtyDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: e.target.value,
                                  }))
                                }
                                onFocus={(e) => e.currentTarget.select()}
                                onBlur={(e) =>
                                  handleQtyCommit(product.id, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    e.currentTarget.blur();
                                }}
                                className="w-14 rounded-md bg-field px-1.5 py-1 text-right text-foreground ring-2 ring-mint/40 outline-none"
                              />
                            ) : (
                              <span
                                onDoubleClick={() =>
                                  handleCellClick(product.id, "quantity")
                                }
                                onTouchEnd={() =>
                                  handleCellTouch(product.id, "quantity")
                                }
                                title="Duplo clique/toque para editar"
                                className="inline-block w-14 cursor-pointer rounded-md px-1.5 py-1 text-right text-muted-foreground ring-1 ring-transparent transition hover:ring-hairline"
                              >
                                {product.quantity}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            {isEditing(product.id, "unitPrice") ? (
                              <div className="inline-flex items-center gap-1 rounded-lg bg-field px-2 py-1 ring-2 ring-mint/40">
                                <span className="text-xs text-muted-foreground">
                                  R$
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  autoFocus
                                  aria-label={`Preço unitário de ${product.name}`}
                                  value={
                                    priceDrafts[product.id] ??
                                    formatCurrency(product.unitPrice)
                                  }
                                  onChange={(e) =>
                                    setPriceDrafts((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  onFocus={(e) => e.currentTarget.select()}
                                  onBlur={(e) =>
                                    handleUnitPriceCommit(
                                      product.id,
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      e.currentTarget.blur();
                                  }}
                                  className="w-16 bg-transparent text-right text-sm text-foreground outline-none"
                                />
                              </div>
                            ) : (
                              <span
                                onDoubleClick={() =>
                                  handleCellClick(product.id, "unitPrice")
                                }
                                onTouchEnd={() =>
                                  handleCellTouch(product.id, "unitPrice")
                                }
                                title="Duplo clique/toque para editar"
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 ring-1 ring-hairline transition hover:bg-field"
                              >
                                <span className="text-xs text-muted-foreground">
                                  R$
                                </span>
                                <span className="text-sm text-foreground">
                                  {formatCurrency(product.unitPrice)}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-right font-semibold text-foreground">
                            {formatCurrency(product.quantity * product.unitPrice)}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-md p-1.5 text-muted-foreground ring-1 ring-hairline transition hover:bg-rose/10 hover:text-rose"
                              aria-label="Excluir"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                )}
              </div>

              {/* Financial summary */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-hairline pt-4">
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

      {/* Clear all confirmation modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Apagar todos os itens"
            className="w-full max-w-sm rounded-2xl bg-panel p-5 ring-1 ring-hairline"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose/10 ring-1 ring-rose/25">
                <Trash2 className="size-5 text-rose" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Apagar todos os itens?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Todos os {products.length}{" "}
                  {products.length === 1 ? "produto" : "produtos"} serão
                  removidos da lista. Essa ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeClearModal}
                className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground ring-1 ring-hairline transition hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-lg bg-rose px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load seed modal */}
      {seedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Carregar seed"
            className="w-full max-w-md rounded-2xl bg-panel p-5 ring-1 ring-hairline"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Carregar seed
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cole a seed recebida para recriar a lista.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSeedModal}
                aria-label="Fechar"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <textarea
              value={seedInput}
              onChange={(e) => {
                setSeedInput(e.target.value);
                setSeedError("");
                setPendingSeed(null);
              }}
              rows={4}
              placeholder="LC1...."
              aria-label="Seed"
              className="mt-4 w-full resize-none rounded-lg bg-field px-3 py-2 font-mono text-xs text-foreground ring-1 ring-hairline placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-mint/40 focus:outline-none"
            />

            {seedError && (
              <p className="mt-2 text-xs text-rose" role="alert">
                {seedError}
              </p>
            )}

            {pendingSeed && (
              <div className="mt-3 rounded-lg bg-rose/10 p-3 text-xs text-rose ring-1 ring-rose/25">
                Sua lista atual será substituída por{" "}
                {pendingSeed.products.length}{" "}
                {pendingSeed.products.length === 1 ? "produto" : "produtos"} da
                seed. Deseja continuar?
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeSeedModal}
                className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground ring-1 ring-hairline transition hover:bg-surface-hover"
              >
                Cancelar
              </button>
              {pendingSeed ? (
                <button
                  type="button"
                  onClick={handleConfirmSeed}
                  className="rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-onprimary transition hover:opacity-90"
                >
                  Substituir lista
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleValidateSeed}
                  className="rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-onprimary transition hover:opacity-90"
                >
                  Carregar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
