import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Melt N Cream" },
      {
        name: "description",
        content: "Reach Melt N Cream in Bengaluru on WhatsApp, Instagram or phone for late-night dessert orders.",
      },
      { property: "og:title", content: "Contact — Melt N Cream" },
      { property: "og:description", content: "WhatsApp, Instagram and phone for Melt N Cream, Bengaluru." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="display-xl">Say hi.</h1>
      <p className="mt-3 text-muted-foreground">
        Questions about an order, a delivery or a craving? We're quickest on WhatsApp during
        service hours.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="surface-card p-5">
          <MessageCircle className="size-5 text-primary" />
          <p className="mt-3 font-display text-lg font-normal">WhatsApp</p>
          <p className="text-sm text-muted-foreground">{CONTACT.primaryPhoneDisplay}</p>
        </a>
        <a href={`tel:+91${CONTACT.secondaryPhone}`} className="surface-card p-5">
          <Phone className="size-5 text-primary" />
          <p className="mt-3 font-display text-lg font-normal">Call us</p>
          <p className="text-sm text-muted-foreground">{CONTACT.secondaryPhoneDisplay}</p>
        </a>
        <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" className="surface-card p-5">
          <Instagram className="size-5 text-primary" />
          <p className="mt-3 font-display text-lg font-normal">Instagram</p>
          <p className="text-sm text-muted-foreground">{CONTACT.instagramHandle} (placeholder)</p>
        </a>
        <div className="surface-card p-5">
          <MapPin className="size-5 text-primary" />
          <p className="mt-3 font-display text-lg font-normal">Where we are</p>
          <p className="text-sm text-muted-foreground">Melt N Cream, {CONTACT.city}</p>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Service hours: 6 PM – 11 PM daily. Uniworld 1 deliveries until 10 PM.
      </p>
    </div>
  );
}
