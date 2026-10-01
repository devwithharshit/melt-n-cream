import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { productsQueryOptions, type Addon } from "@/lib/catalog.functions";
import { formatINR } from "@/lib/money";
import { useCart } from "@/lib/cart";
import { HoursNotice } from "@/components/site/HoursNotice";

export const Route = createFileRoute("/product/$id")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  head: ({ params }) => ({
    meta: [
      { title: `Order dessert — Melt N Cream` },
      {
        name: "description",
        content: `Order ${params.id.replace(/-/g, " ")} from Melt N Cream, delivered late night in Bengaluru.`,
      },
      { property: "og:title", content: "Order dessert — Melt N Cream" },
      {
        property: "og:description",
        content: "Late-night desserts delivered in Bengaluru, 6 PM to 11 PM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const product = products.find((p) => p.slug === id || p.id === id);
  const { addLine } = useCart();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-normal">We couldn't find that dessert.</h1>
        <Link
          to="/menu"
          className="tap-target mt-6 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Explore Menu
        </Link>
      </div>
    );
  }

  const chosenAddons: Addon[] = product.addons.filter((a) => selected.includes(a.id));
  const unit = product.price_paise + chosenAddons.reduce((s, a) => s + a.price_paise, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/menu" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to menu
      </Link>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-secondary">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="grid aspect-square place-items-center text-muted-foreground">
              Photo coming soon
            </div>
          )}
          {!product.available && (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <span className="rounded-full border border-border px-5 py-2 text-sm font-bold tracking-widest uppercase">
                Sold out
              </span>
            </div>
          )}
        </div>

        <div>
          {product.is_featured && (
            <span className="bg-primary px-3 py-1 text-[10px] font-bold tracking-widest text-primary-foreground uppercase">
              Signature
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-normal sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.description}</p>
          <p className="mt-4 font-display text-3xl font-normal">{formatINR(product.price_paise)}</p>

          {product.addons.length > 0 && (
            <div className="mt-7">
              <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Add-ons
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {product.addons.map((addon) => {
                  const checked = selected.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`tap-target flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                        checked ? "border-primary bg-secondary/60" : "border-border"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--color-primary)]"
                          checked={checked}
                          disabled={!product.available}
                          onChange={(e) =>
                            setSelected((prev) =>
                              e.target.checked
                                ? [...prev, addon.id]
                                : prev.filter((x) => x !== addon.id),
                            )
                          }
                        />
                        <span className="text-sm font-medium">{addon.name}</span>
                      </span>
                      <span className="text-sm font-semibold">+{formatINR(addon.price_paise)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-full border border-border p-1">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="grid size-10 place-items-center rounded-full hover:bg-secondary"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="grid size-10 place-items-center rounded-full hover:bg-secondary"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total <span className="font-semibold text-foreground">{formatINR(unit * quantity)}</span>
            </p>
          </div>

          <button
            type="button"
            disabled={!product.available}
            onClick={() => {
              addLine(product, chosenAddons, quantity);
              toast.success(`${product.name} added to your bag`);
              navigate({ to: "/cart" });
            }}
            className="tap-target mt-6 w-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {product.available ? "Add to Cart" : "Sold out"}
          </button>

          <div className="mt-5">
            <HoursNotice location={null} />
          </div>
        </div>
      </div>
    </div>
  );
}
