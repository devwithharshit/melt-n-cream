import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./Brand";
import { CONTACT } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="band-dark">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <BrandLogo size={52} />
            <p className="mt-3 font-display text-xl">Late Night. Sweet Cravings.</p>
            <p className="mt-2 text-sm text-muted-foreground">Bengaluru, Karnataka</p>
            <p className="eyebrow mt-6">6 PM — 11 PM · Uniworld 1: 6 PM — 10 PM</p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Order
              </p>
              <Link to="/menu" className="text-muted-foreground hover:text-foreground">
                Menu
              </Link>
              <Link to="/orders" className="text-muted-foreground hover:text-foreground">
                Orders
              </Link>
              <Link to="/cart" className="text-muted-foreground hover:text-foreground">
                Your bag
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Brand
              </p>
              <Link to="/about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">
                Contact
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                Staff login
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Reach us
              </p>
              <a
                href={CONTACT.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                WhatsApp
              </a>
              <a
                href={CONTACT.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                Instagram
              </a>
              <a
                href={`tel:+91${CONTACT.primaryPhone}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {CONTACT.primaryPhoneDisplay}
              </a>
              <a href={`tel:+91${CONTACT.secondaryPhone}`} className="text-muted-foreground hover:text-foreground">
                {CONTACT.secondaryPhoneDisplay}
              </a>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Melt N Cream. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
