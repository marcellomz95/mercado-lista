import { useEffect, useRef, useState } from "react";
import {
  Apple,
  Baby,
  Beef,
  Candy,
  Cat,
  ChevronDown,
  Cookie,
  Droplets,
  HeartPulse,
  Milk,
  Package,
  Sparkles,
  Tag,
  Wine,
  Wrench,
} from "lucide-react";

export type Category =
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

export const CATEGORIES: Category[] = [
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

const ICON_SIZE = 16;

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Hortifruti: <Apple size={ICON_SIZE} />,
  "Carnes e Frios": <Beef size={ICON_SIZE} />,
  Padaria: <Cookie size={ICON_SIZE} />,
  Laticínios: <Milk size={ICON_SIZE} />,
  Mercearia: <Package size={ICON_SIZE} />,
  Bebidas: <Wine size={ICON_SIZE} />,
  Limpeza: <Sparkles size={ICON_SIZE} />,
  Higiene: <Droplets size={ICON_SIZE} />,
  Utilidades: <Wrench size={ICON_SIZE} />,
  "Pet Shop": <Cat size={ICON_SIZE} />,
  Bebê: <Baby size={ICON_SIZE} />,
  Saúde: <HeartPulse size={ICON_SIZE} />,
  "Doces e Snacks": <Candy size={ICON_SIZE} />,
  Outros: <Tag size={ICON_SIZE} />,
};

interface CategorySelectProps {
  value: Category | "";
  onChange: (value: Category | "") => void;
  placeholder?: string;
  includeAll?: boolean;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  placeholder = "Selecionar",
  includeAll = false,
  className = "",
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedLabel = value || (includeAll ? "Todas as categorias" : placeholder);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-field py-2 pl-3 pr-2 text-sm text-foreground ring-1 ring-hairline transition hover:bg-surface focus:ring-2 focus:ring-mint/40 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {value ? (
            <span className="text-muted-foreground">
              {CATEGORY_ICONS[value]}
            </span>
          ) : null}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-panel py-1 ring-1 ring-hairline shadow-xl">
          {includeAll && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-mint/10 ${
                value === "" ? "text-mint" : "text-foreground"
              }`}
            >
              <span className="invisible" aria-hidden="true">
                {CATEGORY_ICONS["Outros"]}
              </span>
              <span className="truncate">Todas as categorias</span>
            </button>
          )}
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-mint/10 ${
                value === cat ? "text-mint" : "text-foreground"
              }`}
            >
              <span className="text-muted-foreground">{CATEGORY_ICONS[cat]}</span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
