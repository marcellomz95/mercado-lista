import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Palette, Sun } from "lucide-react";
import {
  THEME_OPTIONS,
  useTheme,
  type ThemeId,
  type ThemeOption,
} from "@/lib/theme";

const THEME_ICONS: Record<ThemeId, React.ReactNode> = {
  system: <Monitor size={16} />,
  "dark-green": <Moon size={16} />,
  "light-blue": <Sun size={16} />,
  "light-green": <Sun size={16} />,
  "dark-blue": <Moon size={16} />,
};

function Swatches({ colors }: { colors: [string, string, string] }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
      {colors.map((color) => (
        <span
          key={color}
          className="size-3 rounded-full ring-1 ring-hairline"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current: ThemeOption =
    THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[1]!;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Escolher tema"
        className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 text-xs font-medium text-foreground ring-1 ring-hairline transition hover:bg-surface-hover focus:ring-2 focus:ring-mint/40 focus:outline-none"
      >
        <Palette className="size-4 text-mint" />
        <span className="hidden sm:inline">{current.label}</span>
        <Swatches colors={current.swatches} />
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-60 overflow-hidden rounded-xl bg-panel p-1 shadow-xl ring-1 ring-hairline"
        >
          {THEME_OPTIONS.map((option) => {
            const isActive = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setTheme(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-mint/10 ${
                  isActive ? "bg-mint/10" : ""
                }`}
              >
                <span className={isActive ? "text-mint" : "text-muted-foreground"}>
                  {THEME_ICONS[option.id]}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      isActive ? "font-semibold text-mint" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                <Swatches colors={option.swatches} />
                {isActive && <Check className="size-4 shrink-0 text-mint" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
