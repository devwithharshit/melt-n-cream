import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export type Addon = { id: string; name: string; price_paise: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_paise: number;
  image_url: string | null;
  category: string;
  available: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  addons: Addon[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function normalizeAddons(value: unknown): Addon[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const a = raw as Record<string, unknown>;
    if (typeof a["id"] !== "string" || typeof a["name"] !== "string") return [];
    return [
      {
        id: a["id"],
        name: a["name"],
        price_paise: Number(a["price_paise"] ?? 0),
      },
    ];
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async (): Promise<Product[]> => {
  const { createPublicServerClient } = await import("./supabase-public.server");
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listProducts failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    addons: normalizeAddons(row.addons),
  })) as Product[];
});

export const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
  staleTime: 60_000,
});
