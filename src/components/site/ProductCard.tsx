import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Product } from "@/lib/catalog.functions";
import { formatINR } from "@/lib/money";
import { useCart } from "@/lib/cart";

export function ProductCard({
  product,
  eager = false,
  tall = false,
}: {
  product: Product;
  eager?: boolean;
  tall?: boolean;
}) {
  const { addLine } = useCart();
  const [showAddons, setShowAddons] = useState(false);

  function add(withIceCream: boolean) {
    addLine(product, withIceCream ? product.addons.filter((a) => /vanilla.*ice.?cream/i.test(a.name)) : [], 1);
    setShowAddons(false);
    toast.success(`${product.name} added to your bag`);
  }

  return (
    <article className="group flex flex-col">
      <Link to="/product/$id" params={{ id: product.slug }} className="relative block overflow-hidden bg-secondary">
        <div className={tall ? "aspect-[4/5]" : "aspect-square"}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid size-full place-items-center text-sm text-muted-foreground">Photo coming soon</div>
          )}
        </div>
        {!product.available && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <span className="eyebrow text-foreground">Sold out</span>
          </div>
        )}
      </Link>

      <div className="flex items-start justify-between gap-4 pt-4">
        <div className="min-w-0">
          <p className="eyebrow">{product.is_featured ? "Signature" : product.category}</p>
          <Link to="/product/$id" params={{ id: product.slug }} className="mt-1.5 block font-display text-2xl leading-tight">
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{product.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-sm font-semibold">{formatINR(product.price_paise)}</span>
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={!product.available}
            aria-label={`Add ${product.name} to bag`}
            onClick={() => {
              if (product.addons.some((a) => /vanilla.*ice.?cream/i.test(a.name))) setShowAddons(true);
              else add(false);
            }}
            className="size-10 rounded-full border-foreground"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
      <Dialog open={showAddons} onOpenChange={setShowAddons}>
        <DialogContent className="max-w-sm rounded-md border-border bg-background">
          <DialogTitle className="font-display text-2xl font-normal">Add vanilla ice cream?</DialogTitle>
          <DialogDescription>Make your {product.name} a little sweeter.</DialogDescription>
          <div className="mt-3 grid gap-2">
            <Button onClick={() => add(true)} className="w-full">Add with ice cream · {formatINR(product.price_paise + (product.addons.find((a) => /vanilla.*ice.?cream/i.test(a.name))?.price_paise ?? 0))}</Button>
            <Button variant="outline" onClick={() => add(false)} className="w-full">Just {product.name} · {formatINR(product.price_paise)}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
