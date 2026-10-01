import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCart, lineTotalPaise, rememberOrder } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { LOCATIONS, type LocationType } from "@/lib/hours";
import { useOrderingStatus } from "@/components/site/HoursNotice";
import { placeOrder } from "@/lib/orders.functions";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Melt N Cream" },
      { name: "description", content: "Enter your delivery details and pay by Google Pay / UPI." },
      { property: "og:title", content: "Checkout — Melt N Cream" },
      { property: "og:description", content: "Checkout for your Melt N Cream order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

const LOCATION_CHOICES: { value: LocationType; label: string }[] = [
  { value: "uniworld1", label: "Uniworld 1" },
  { value: "uniworld2", label: "Uniworld 2" },
];

function CheckoutPage() {
  const { lines, subtotalPaise, clear, hydrated } = useCart();
  const navigate = useNavigate();
  const createOrder = useServerFn(placeOrder);

  const [locationType, setLocationType] = useState<LocationType>("uniworld1");
  const [customerName, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roomNumber, setRoom] = useState("");
  const [preOrder, setPreOrder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = useOrderingStatus(locationType);

  const deliveryFee = LOCATIONS[locationType].deliveryFeePaise;
  const total = subtotalPaise + deliveryFee;

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-normal">Your cravings are waiting.</h1>
        <p className="mt-3 text-muted-foreground">There's nothing to check out yet.</p>
        <Link
          to="/menu"
          className="tap-target mt-7 inline-flex bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Explore Menu
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!status.open && !preOrder) {
      setError(status.message);
      return;
    }

    setBusy(true);
    try {
      const result = await createOrder({
        data: {
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            addonIds: l.addons.map((a) => a.id),
          })),
          customerName,
          phone,
          locationType,
          roomNumber,
          preOrder: !status.open && preOrder,
        },
      });

      if (!result.ok) {
        setError(result.message);
        setBusy(false);
        return;
      }

      rememberOrder(result.orderId);
      clear();
      navigate({ to: "/pay/$id", params: { id: result.orderId } });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setBusy(false);
      toast.error("Order could not be started");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-normal">Checkout</h1>

      <form onSubmit={submit} className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div className="flex flex-col gap-5">
          <section className="surface-card p-5">
            <h2 className="font-display text-lg font-normal">Your details</h2>
            <div className="mt-4 grid gap-3">
              <Field label="Full name">
                <input
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone number">
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  title="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={inputClass}
                  autoComplete="tel"
                />
              </Field>
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="font-display text-lg font-normal">Delivery</h2>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {LOCATION_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => setLocationType(choice.value)}
                  className={`tap-target rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    locationType === choice.value
                      ? "border-primary bg-secondary/60"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {locationType === "uniworld1" ? "Uniworld 1 closes at 10 PM." : "Uniworld 2 closes at 11 PM."}
            </p>

            <div className="mt-4 grid gap-3">
              <Field label="Room number">
                <input
                  required
                  value={roomNumber}
                  onChange={(e) => setRoom(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="surface-card p-5 md:sticky md:top-24">
          <h2 className="font-display text-lg font-normal">Order summary</h2>
          <div className="mt-4 flex flex-col gap-3">
            {lines.map((line) => (
              <div key={line.key} className="flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">
                    {line.name} × {line.quantity}
                  </p>
                  {line.addons.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + {line.addons.map((a) => a.name).join(", ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0">{formatINR(lineTotalPaise(line))}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatINR(subtotalPaise)} />
            <Row
              label="Delivery fee"
              value={deliveryFee === 0 ? "Free" : formatINR(deliveryFee)}
            />
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-lg font-normal">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          {!status.open && (
            <p className="mt-4 rounded-2xl border border-border bg-secondary/60 p-3 text-sm">
              {status.message}
            </p>
          )}
          {!status.open && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" checked={preOrder} onChange={(e) => setPreOrder(e.target.checked)} className="mt-1 accent-primary" />
              <span>Pre-order for the next opening at 6 PM. Payment can be made now; preparation starts when we reopen.</span>
            </label>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || (!status.open && !preOrder)}
            className="tap-target mt-5 w-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Placing order…" : !status.open ? "Pre-Order & Pay" : "Proceed to Payment"}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Pay by Google Pay / UPI on the next step. No cash on delivery. Need help? WhatsApp {CONTACT.primaryPhoneDisplay}.
          </p>
        </aside>
      </form>
    </div>
  );
}

const inputClass =
  "tap-target w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
