import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { productsQueryOptions } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { HoursNotice } from "@/components/site/HoursNotice";

export const Route = createFileRoute("/menu")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  head: () => ({
    meta: [
      { title: "Menu — Melt N Cream" },
      {
        name: "description",
        content: "Browse late-night desserts from Melt N Cream, including our signature Apple Choco Bliss.",
      },
      { property: "og:title", content: "Menu — Melt N Cream" },
      { property: "og:description", content: "Late-night desserts, brownies and ice cream in Bengaluru." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [products, search]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:py-20">
      <p className="eyebrow">The Menu</p>
      <h1 className="mt-4 font-display text-5xl font-light tracking-tight sm:text-6xl">Something for the craving.</h1>
      <p className="mt-2 text-muted-foreground">Pick your craving.</p>

      <div className="mt-6">
        <HoursNotice location={null} />
      </div>

      <div className="mt-6">
        <label className="relative block">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search desserts…"
            aria-label="Search desserts"
            className="tap-target w-full border-b border-border bg-transparent py-3 pr-4 pl-11 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card mt-10 p-10 text-center">
          <p className="font-display text-xl font-normal">Nothing here tonight.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try clearing your search.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} eager={i < 2} />
          ))}
        </div>
      )}
    </div>
  );
}
