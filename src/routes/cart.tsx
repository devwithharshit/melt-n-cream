import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, lineTotalPaise } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { HoursNotice } from "@/components/site/HoursNotice";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — Melt N Cream" },
      { name: "description", content: "Review your late-night dessert order before checkout." },
      { property: "og:title", content: "Your bag — Melt N Cream" },
      { property: "og:description", content: "Review your Melt N Cream order before checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotalPaise, setQuantity, removeLine, hydrated } = useCart();

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading your bag…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-normal">Your bag is waiting.</h1>
        <p className="mt-3 text-muted-foreground">Something sweet belongs here.</p>
        <Link
          to="/menu"
          className="tap-target mt-7 inline-flex bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Explore Desserts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-normal">Your Bag</h1>

      <div className="mt-6 flex flex-col gap-3">
        {lines.map((line) => (
          <div key={line.key} className="surface-card flex gap-4 p-4">
            {line.imageUrl && (
              <img
                src={line.imageUrl}
                alt={line.name}
                loading="lazy"
                className="size-20 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-normal">{line.name}</p>
                  {line.addons.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      + {line.addons.map((a) => a.name).join(", ")}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-semibold">{formatINR(lineTotalPaise(line))}</p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                    className="grid size-9 place-items-center rounded-full hover:bg-secondary"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                    className="grid size-9 place-items-center rounded-full hover:bg-secondary"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={`Remove ${line.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatINR(subtotalPaise)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Delivery fee is added at checkout once you pick your location.
        </p>
      </div>

      <div className="mt-5">
        <HoursNotice location={null} />
      </div>

      <Link
        to="/checkout"
        className="tap-target mt-5 block bg-primary px-6 py-4 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Continue to Checkout
      </Link>
      <Link
        to="/menu"
        className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Add something else
      </Link>
    </div>
  );
}
