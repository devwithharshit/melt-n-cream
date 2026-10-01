import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrders } from "@/lib/orders.functions";
import { rememberedOrderIds } from "@/lib/cart";
import { formatINR } from "@/lib/money";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Your orders — Melt N Cream" },
      { name: "description", content: "Track your Melt N Cream dessert orders and their status." },
      { property: "og:title", content: "Your orders — Melt N Cream" },
      { property: "og:description", content: "Track your late-night dessert orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const [ids, setIds] = useState<string[] | null>(null);
  const fetchOrders = useServerFn(getOrders);

  useEffect(() => setIds(rememberedOrderIds()), []);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", ids],
    queryFn: () => fetchOrders({ data: { ids: ids ?? [] } }),
    enabled: Array.isArray(ids) && ids.length > 0,
  });

  if (ids === null || (isLoading && ids.length > 0)) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (ids.length === 0 || !data || data.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-normal">No orders yet.</h1>
        <p className="mt-3 text-muted-foreground">
          Orders placed on this device show up here.
        </p>
        <Link
          to="/menu"
          className="tap-target mt-7 inline-flex bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Explore Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl font-normal">Your orders</h1>
      <div className="mt-6 flex flex-col gap-3">
        {data.map((order) => (
          <Link
            key={order.id}
            to="/orders/$id"
            params={{ id: order.id }}
            className="surface-card block p-5 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-normal">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </p>
              </div>
              <span className="font-semibold">{formatINR(order.total_paise)}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
            </p>
            <div className="mt-3 flex gap-2 text-[11px] font-bold tracking-wide uppercase">
              <span className="rounded-full border border-border px-2.5 py-1">
                {order.payment_status}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1">{order.order_status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
