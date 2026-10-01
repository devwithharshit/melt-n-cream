import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Addon, Product } from "./catalog.functions";

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  unitPricePaise: number;
  quantity: number;
  addons: Addon[];
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  addLine: (product: Product, addons: Addon[], quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  removeAddon: (key: string, addonId: string) => void;
  clear: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "mnc.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, addons: Addon[]) {
  return `${productId}::${addons
    .map((a) => a.id)
    .sort()
    .join(",")}`;
}

export function lineTotalPaise(line: CartLine) {
  const addonTotal = line.addons.reduce((sum, a) => sum + a.price_paise, 0);
  return (line.unitPricePaise + addonTotal) * line.quantity;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full or unavailable */
    }
  }, [lines, hydrated]);

  const addLine = useCallback((product: Product, addons: Addon[], quantity: number) => {
    const key = lineKey(product.id, addons);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.image_url,
          unitPricePaise: product.price_paise,
          quantity: Math.min(20, quantity),
          addons,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l)),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const removeAddon = useCallback((key: string, addonId: string) => {
    setLines((prev) => {
      const target = prev.find((l) => l.key === key);
      if (!target) return prev;
      const addons = target.addons.filter((a) => a.id !== addonId);
      const newKey = lineKey(target.productId, addons);
      const rest = prev.filter((l) => l.key !== key);
      const merged = rest.find((l) => l.key === newKey);
      if (merged) {
        return rest.map((l) =>
          l.key === newKey ? { ...l, quantity: Math.min(20, l.quantity + target.quantity) } : l,
        );
      }
      return [...rest, { ...target, key: newKey, addons }];
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalPaise: lines.reduce((sum, l) => sum + lineTotalPaise(l), 0),
      addLine,
      setQuantity,
      removeLine,
      removeAddon,
      clear,
    }),
    [lines, hydrated, addLine, setQuantity, removeLine, removeAddon, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/** Order ids saved on this device so guests can see their order history. */
const HISTORY_KEY = "mnc.orders.v1";

export function rememberOrder(id: string) {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(id)) ids.unshift(id);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(ids.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function rememberedOrderIds(): string[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
