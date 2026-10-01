import { createFileRoute } from "@tanstack/react-router";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Melt N Cream" },
      { name: "description", content: "How Melt N Cream handles the details you share when ordering." },
      { property: "og:title", content: "Privacy — Melt N Cream" },
      { property: "og:description", content: "How we handle the details you share when ordering." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-4xl font-normal">Privacy</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          We collect only what we need to deliver your order: your name, phone number and delivery
          address or room details, plus any note you add.
        </p>
        <p>
          Payments are handled by our payment provider. We never see or store your card, UPI or
          bank credentials.
        </p>
        <p>
          Your details are used for fulfilling and supporting your order. We do not sell them or
          share them with anyone beyond the rider delivering to you.
        </p>
        <p>
          Want your details removed from our records? WhatsApp us at {CONTACT.primaryPhoneDisplay}
          {" "}and we'll take care of it.
        </p>
      </div>
    </div>
  ),
});
