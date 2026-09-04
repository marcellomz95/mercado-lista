import type { Category } from "@/components/CategorySelect";
import { CATEGORIES } from "@/components/CategorySelect";

export interface SeedProduct {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unitPrice: number;
  purchased: boolean;
}

export interface SeedPayload {
  initialBalance: number;
  products: SeedProduct[];
}

const SEED_PREFIX = "LC1.";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Compact, versioned, URL-safe Base64 seed carrying the whole list. */
export function encodeSeed(payload: SeedPayload): string {
  const compact = {
    v: 1,
    b: Number(payload.initialBalance.toFixed(2)),
    p: payload.products.map((product) => [
      product.name,
      CATEGORIES.indexOf(product.category),
      product.quantity,
      Number(product.unitPrice.toFixed(2)),
      product.purchased ? 1 : 0,
    ]),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  return SEED_PREFIX + bytesToBase64Url(bytes);
}

export function decodeSeed(raw: string): SeedPayload {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Seed vazia.");
  if (!trimmed.startsWith(SEED_PREFIX)) {
    throw new Error("Seed inválida ou de uma versão incompatível.");
  }

  let parsed: unknown;
  try {
    const bytes = base64UrlToBytes(trimmed.slice(SEED_PREFIX.length));
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("Seed corrompida — não foi possível ler os dados.");
  }

  const data = parsed as { v?: number; b?: number; p?: unknown[] };
  if (data?.v !== 1 || !Array.isArray(data.p)) {
    throw new Error("Seed inválida ou de uma versão incompatível.");
  }

  const products: SeedProduct[] = data.p.map((entry) => {
    if (!Array.isArray(entry) || entry.length < 4) {
      throw new Error("Seed corrompida — produto inválido.");
    }
    const [name, categoryIndex, quantity, unitPrice, purchased] = entry as [
      string,
      number,
      number,
      number,
      number | undefined,
    ];
    if (typeof name !== "string" || typeof quantity !== "number" || typeof unitPrice !== "number") {
      throw new Error("Seed corrompida — produto inválido.");
    }
    return {
      id: crypto.randomUUID(),
      name,
      category: CATEGORIES[categoryIndex] ?? "Outros",
      quantity: Math.max(1, Math.round(quantity)),
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      purchased: purchased === 1,
    };
  });

  const balance = typeof data.b === "number" && Number.isFinite(data.b) ? data.b : 0;
  return { initialBalance: balance, products };
}
