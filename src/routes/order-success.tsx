import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrder } from "@/lib/orders.functions";
import { formatINR } from "@/lib/money";
import { LOCATIONS } from "@/lib/hours";

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? search["id"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Order confirmed — Melt N Cream" },
      { name: "description", content: "Your Melt N Cream order is confirmed and on its way." },
      { property: "og:title", content: "Order confirmed — Melt N Cream" },
      { property: "og:description", content: "Your late-night dessert order is confirmed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { id } = Route.useSearch();
  const fetchOrder = useServerFn(getOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.payment_status === "Awaiting Verification" ? 8000 : false),
  });

  if (!id) {
    return <Fallback message="We couldn't find that order." />;
  }
  if (isLoading) {
    return <div className="mx-auto max-w-xl px-4 py-24 text-center text-muted-foreground">Loading your order…</div>;
  }
  if (!data) {
    return <Fallback message="We couldn't find that order." />;
  }

  const paid = data.payment_status === "Paid";
  const verifying = data.payment_status === "Awaiting Verification";

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl font-normal">
        {paid ? "Sweet. Your order is in." : verifying ? "Sweet. Your order is in." : "Payment pending"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {paid
          ? "We're on it. Your dessert is being prepared."
          : verifying
            ? "We're checking your Google Pay payment. This page updates once it's confirmed."
            : "We haven't received your payment yet."}
      </p>

      <div className="surface-card mt-6 p-5">
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Order number
        </p>
        <p className="font-display text-2xl font-normal">{data.order_number}</p>

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          {data.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-3">
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
        </div>

        <div className="mt-4 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatINR(data.subtotal_paise)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery fee</span>
            <span>{data.delivery_fee_paise === 0 ? "Free" : formatINR(data.delivery_fee_paise)}</span>
          </div>
          <div className="mt-2 flex justify-between font-display text-lg font-normal">
            <span>{paid ? "Total paid" : "Total"}</span>
            <span>{formatINR(data.total_paise)}</span>
          </div>
        </div>

        <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-sm">
          <Detail label="Payment status" value={data.payment_status} />
          <Detail label="Order status" value={data.order_status} />
          <Detail
            label="Delivery"
            value={
              `${LOCATIONS[data.location_type].label}${
                data.room_number ? ` · Room ${data.room_number}` : ""
              }`
            }
          />
          {data.preferred_time === "Next opening" && <Detail label="Fulfilment" value="Pre-order · next opening at 6 PM" />}
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/orders/$id"
          params={{ id: data.id }}
          className="tap-target bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          View Order
        </Link>
        <Link
          to="/menu"
          className="tap-target rounded-full border border-border px-7 py-3.5 text-sm font-bold hover:bg-secondary"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Fallback({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-normal">{message}</h1>
      <Link
        to="/orders"
        className="tap-target mt-6 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        See your orders
      </Link>
    </div>
  );
}
