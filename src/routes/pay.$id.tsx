import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrder, submitUpiReference } from "@/lib/orders.functions";
import { formatINR } from "@/lib/money";
import { PAYMENT, upiLink } from "@/lib/payment";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/pay/$id")({
  head: () => ({
    meta: [
      { title: "Pay with Google Pay — Melt N Cream" },
      { name: "description", content: "Scan the QR with Google Pay or any UPI app to pay for your order." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Pay with Google Pay — Melt N Cream" },
      { property: "og:description", content: "Scan and pay for your late-night dessert order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PayPage,
});

function PayPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const submitRef = useServerFn(submitUpiReference);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  if (isLoading) return <p className="py-24 text-center text-muted-foreground">Loading…</p>;
  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-normal">We couldn't find that order.</h1>
        <Link to="/menu" className="mt-6 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Back to Menu
        </Link>
      </div>
    );
  }

  if (order.payment_status !== "Pending") {
    navigate({ to: "/order-success", search: { id: order.id }, replace: true });
    return null;
  }

  const hasQr = Boolean(PAYMENT.UPI_ID || PAYMENT.QR_IMAGE_URL);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Order {order.order_number}</p>
      <h1 className="mt-2 font-display text-3xl font-normal">Scan &amp; pay</h1>
      <p className="mt-2 text-muted-foreground">
        Pay exactly <span className="font-bold text-foreground">{formatINR(order.total_paise)}</span> with Google Pay or any UPI app.
      </p>

      <div className="surface-card mt-6 flex flex-col items-center p-6">
        {PAYMENT.QR_IMAGE_URL ? (
          <img src={PAYMENT.QR_IMAGE_URL} alt="Scan Melt N Cream Google Pay QR to pay" className="w-64 max-w-full" />
        ) : (
          <div className="grid h-56 w-56 place-items-center rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            QR code coming soon. Please pay on WhatsApp {CONTACT.primaryPhoneDisplay} for now.
          </div>
        )}
        <p className="mt-4 font-display text-2xl font-normal">{formatINR(order.total_paise)}</p>
        {PAYMENT.UPI_ID && (
          <>
            <p className="text-xs text-muted-foreground">UPI ID: {PAYMENT.UPI_ID}</p>
            <a
              href={upiLink(order.total_paise, order.order_number)}
              className="tap-target mt-4 w-full rounded-full border border-border px-5 py-3 text-center text-sm font-semibold sm:hidden"
            >
              Open UPI app
            </a>
          </>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">This QR is not amount-prefilled. Enter exactly {formatINR(order.total_paise)} in your payment app.</p>

      <form
        className="surface-card mt-4 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await submitRef({ data: { orderId: order.id, reference } });
            if (!res.ok) {
              setError(res.message);
            } else {
              await qc.invalidateQueries({ queryKey: ["order", id] });
              navigate({ to: "/order-success", search: { id: order.id } });
            }
          } catch {
            setError("Enter the 12-digit UPI transaction ID (UTR) shown in your payment app.");
          }
          setBusy(false);
        }}
      >
        <label className="block">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            UPI transaction ID / UTR
          </span>
          <input
            required
            value={reference}
            onChange={(e) => setReference(e.target.value.replace(/\s/g, ""))}
            placeholder="e.g. 412345678901"
            className="tap-target mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          After paying, copy the transaction ID from Google Pay and paste it here. We confirm every payment before preparing your order.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy || !hasQr}
          className="tap-target mt-4 w-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Submitting…" : "I've paid"}
        </button>
      </form>
    </div>
  );
}
