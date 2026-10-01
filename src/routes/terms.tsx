import { createFileRoute } from "@tanstack/react-router";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Melt N Cream" },
      { name: "description", content: "Ordering, delivery, payment and cancellation terms for Melt N Cream." },
      { property: "og:title", content: "Terms — Melt N Cream" },
      { property: "og:description", content: "Ordering and delivery terms for Melt N Cream, Bengaluru." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-4xl font-normal">Terms</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Orders are accepted daily between 6 PM and 11 PM (IST). Uniworld 1 deliveries close at
          10 PM. Orders cannot be placed or fulfilled outside these hours.
        </p>
        <p>
          Payment is online only; we do not accept cash on delivery. An order is confirmed only
          after payment is verified by us.
        </p>
        <p>
          Once preparation has begun, an order cannot be cancelled. If an item becomes unavailable
          after payment, we will contact you and refund that amount.
        </p>
        <p>
          Delivery times are estimates and can shift with weather, traffic or order volume. Please
          keep your phone reachable so our rider can find you.
        </p>
        <p>For anything else, WhatsApp us at {CONTACT.primaryPhoneDisplay}.</p>
      </div>
    </div>
  ),
});
