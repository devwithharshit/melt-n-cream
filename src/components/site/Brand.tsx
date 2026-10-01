import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/melt-n-cream-logo.png.asset.json";

export function BrandLogo({ size = 44 }: { size?: number }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Melt N Cream home">
      <img
        src={logoAsset.url}
        alt="Melt N Cream"
        width={size}
        height={size}
        className="rounded-full ring-1 ring-border"
        style={{ width: size, height: size }}
      />
      <span className="font-display text-lg leading-none font-normal tracking-tight">
        Melt N Cream
      </span>
    </Link>
  );
}

export function BrandWordmark() {
  return (
    <Link
      to="/"
      className="font-display text-lg leading-none font-normal tracking-tight"
      aria-label="Melt N Cream home"
    >
      Melt N Cream
    </Link>
  );
}
