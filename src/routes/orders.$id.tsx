import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { getOrder } from "@/lib/orders.functions";
import { formatINR } from "@/lib/money";
import { LOCATIONS } from "@/lib/hours";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details — Melt N Cream" },
      { name: "description", content: "Follow your Melt N Cream order from kitchen to doorstep." },
      { property: "og:title", content: "Order details — Melt N Cream" },
      { property: "og:description", content: "Follow your dessert order from kitchen to doorstep." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderDetailPage,
});

const TIMELINE = ["Paid", "Preparing", "Out for Delivery", "Delivered"] as const;

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-xl px-4 py-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-normal">We couldn't find that order.</h1>
        <Link
          to="/orders"
          className="tap-target mt-6 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Your orders
        </Link>
      </div>
    );
  }

  const cancelled = data.order_status === "Cancelled";
  const currentIndex = cancelled
    ? -1
    : data.payment_status === "Paid"
      ? Math.max(0, TIMELINE.indexOf(data.order_status as (typeof TIMELINE)[number]))
      : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>
      <h1 className="mt-4 font-display text-3xl font-normal">{data.order_number}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(data.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
      </p>

      <div className="surface-card mt-6 p-5">
        {cancelled ? (
          <p className="font-semibold">This order was cancelled.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {TIMELINE.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <span className="text-xs">{i + 1}</span>}
                  </span>
                  <span className={done ? "font-semibold" : "text-muted-foreground"}>{step}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="surface-card mt-4 p-5 text-sm">
        {data.items.map((item, i) => (
          <div key={i} className="flex justify-between gap-3 py-1">
            <div>
              <p className="font-medium">
                {item.name} × {item.quantity}
              </p>
              {item.addons.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  + {item.addons.map((a) => a.name).join(", ")}
                </p>
              )}
            </div>
            <span>{formatINR(item.lineTotalPaise)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-lg font-normal">
          <span>Total</span>
          <span>{formatINR(data.total_paise)}</span>
        </div>
        <p className="mt-3 text-muted-foreground">
          Payment: <span className="font-medium text-foreground">{data.payment_status}</span>
        </p>
        <p className="text-muted-foreground">
          Delivering to{" "}
          <span className="font-medium text-foreground">
            {`${LOCATIONS[data.location_type].label}${
              data.room_number ? ` · Room ${data.room_number}` : ""
            }`}
          </span>
        </p>
      </div>
    </div>
  );
}
