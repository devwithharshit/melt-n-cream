import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { BrandWordmark } from "./Brand";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/orders", label: "Orders" },
] as const;

export function AnnouncementBar() {
  return (
    <div className="border-b border-border">
      <p className="mx-auto max-w-6xl px-5 py-2 text-center text-[10px] font-semibold tracking-[0.28em] text-muted-foreground uppercase sm:text-[11px]">
        Open 6 PM — 11 PM <span className="mx-2 opacity-50">/</span> Uniworld 1 until 10 PM
      </p>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "border-b border-border bg-background/95 backdrop-blur" : "bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
        <BrandWordmark />

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/cart" className="text-sm font-semibold">
            Bag ({count})
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <Link to="/cart" aria-label="Open your bag" className="tap-target inline-flex items-center px-3 text-sm font-semibold">
            Bag ({count})
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 items-center justify-center"
          >
            {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-5 pt-2 pb-8">
            {[...NAV, { to: "/contact", label: "Contact" } as const].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 font-display text-3xl font-light"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
