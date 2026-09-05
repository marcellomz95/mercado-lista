import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeId =
  | "system"
  | "dark-green"
  | "light-blue"
  | "light-green"
  | "dark-blue";

export type ResolvedThemeId = Exclude<ThemeId, "system">;

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  /** Preview swatches: [background, card, primary] */
  swatches: [string, string, string];
  isDark?: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "system",
    label: "Automático",
    description: "Segue o sistema",
    swatches: ["#0a0a12", "#f4f5f7", "#22c48a"],
  },
  {
    id: "dark-green",
    label: "Escuro Verde",
    description: "Padrão elegante",
    swatches: ["#0a0a12", "#1d1d26", "#22c48a"],
    isDark: true,
  },
  {
    id: "light-blue",
    label: "Claro Azul",
    description: "Alto contraste",
    swatches: ["#ffffff", "#f1f3f7", "#2563eb"],
  },
  {
    id: "light-green",
    label: "Claro Verde",
    description: "Leve e natural",
    swatches: ["#ffffff", "#eff3f0", "#16875f"],
  },
  {
    id: "dark-blue",
    label: "Escuro Azul",
    description: "Azul-marinho",
    swatches: ["#111a2e", "#1e2942", "#5b8def"],
    isDark: true,
  },
];

const STORAGE_KEY = "lista-compras-theme";
const DEFAULT_THEME: ThemeId = "dark-green";
const THEME_CLASSES = [
  "theme-dark-green",
  "theme-light-blue",
  "theme-light-green",
  "theme-dark-blue",
];

function isThemeId(value: string | null): value is ThemeId {
  return (
    !!value && THEME_OPTIONS.some((option) => option.id === (value as ThemeId))
  );
}

function isDarkTheme(theme: ResolvedThemeId) {
  return theme === "dark-green" || theme === "dark-blue";
}

function applyTheme(resolved: ResolvedThemeId) {
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);
  root.classList.add(`theme-${resolved}`);
  root.classList.toggle("dark", isDarkTheme(resolved));
  root.style.colorScheme = isDarkTheme(resolved) ? "dark" : "light";
}

interface ThemeContextValue {
  theme: ThemeId;
  resolvedTheme: ResolvedThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [systemDark, setSystemDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) setThemeState(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedThemeId =
    theme === "system" ? (systemDark ? "dark-green" : "light-blue") : theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme precisa estar dentro de ThemeProvider");
  return context;
}
