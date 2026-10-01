import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsQueryOptions } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { HoursNotice } from "@/components/site/HoursNotice";
import { formatINR } from "@/lib/money";
import { useCart } from "@/lib/cart";
import logoAsset from "@/assets/melt-n-cream-logo.png.asset.json";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  head: () => ({
    meta: [
      { title: "Melt N Cream — Late Night Sweet Cravings" },
      {
        name: "description",
        content:
          "A late-night dessert studio in Bengaluru. Apple Choco Bliss and more, 6 PM to 11 PM. Uniworld 1 until 10 PM.",
      },
      { property: "og:title", content: "Melt N Cream — Late Night Sweet Cravings" },
      { property: "og:description", content: "Desserts for the hours when the craving hits. Bengaluru, from 6 PM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const { addLine } = useCart();
  const signature = products.find((p) => p.is_featured) ?? products[0];
  const preview = products.slice(0, 3);
  const vanilla = signature?.addons.find((a) => /vanilla.*ice.?cream/i.test(a.name));

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-16 md:grid-cols-12 md:gap-6 md:pt-20 md:pb-28">
        <div className="flex flex-col justify-center md:col-span-6">
          <img src={logoAsset.url} alt="Melt N Cream logo" className="mb-5 size-28 rounded-full object-contain ring-1 ring-border sm:size-36" />
          <p className="eyebrow">Melt N Cream · Bengaluru</p>
          <h1 className="display-xl mt-6">
            Late Night.
            <br />
            <em className="font-light">Sweet</em> Cravings.
          </h1>
          <p className="mt-6 max-w-xs text-base text-muted-foreground">
            Desserts for the hours when the craving hits.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              to="/product/$id"
              params={{ id: "apple-choco-bliss" }}
              className="tap-target inline-flex items-center bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Order / Pre-Order
            </Link>
            <Link to="/menu" className="border-b border-foreground pb-0.5 text-sm font-semibold">
              Explore Menu
            </Link>
          </div>
        </div>

        {signature?.image_url && (
          <div className="relative md:col-span-6 md:-mr-10">
            <img
              src={signature.image_url}
              alt={signature.name}
              width={1080}
              height={926}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
            />
            <p className="eyebrow mt-3 flex justify-between">
              <span>Fig. 01 — {signature.name}</span>
              <span>{formatINR(signature.price_paise)}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-5 md:col-span-12 md:flex-row md:items-center md:justify-between">
          <p className="eyebrow text-foreground">Open 6 PM — 11 PM</p>
          <div className="md:max-w-md">
            <HoursNotice location={null} />
          </div>
        </div>
      </section>

      {/* Signature */}
      {signature && (
        <section className="bg-secondary">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-12 md:items-end md:py-28">
            {signature.image_url && (
              <img
                src={signature.image_url}
                alt={signature.name}
                loading="lazy"
                className="aspect-square w-full object-cover md:col-span-7"
              />
            )}
            <div className="md:col-span-5 md:pl-6">
              <p className="eyebrow">The Signature</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.95] font-light tracking-tight sm:text-6xl">
                Meet the Apple Choco Bliss.
              </h2>
              <p className="mt-6 max-w-sm text-muted-foreground">{signature.description}</p>
              <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
                <div className="flex justify-between py-3">
                  <dt>{signature.name}</dt>
                  <dd className="font-semibold">{formatINR(signature.price_paise)}</dd>
                </div>
                {vanilla && (
                  <div className="flex justify-between py-3 text-muted-foreground">
                    <dt>+ {vanilla.name}</dt>
                    <dd>{formatINR(vanilla.price_paise)}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-8 flex items-center gap-6">
                <button
                  type="button"
                  disabled={!signature.available}
                  onClick={() => {
                    addLine(signature, [], 1);
                    toast.success(`${signature.name} added to your bag`);
                  }}
                  className="tap-target bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                >
                  {signature.available ? "Add to Bag" : "Sold out"}
                </button>
                <Link to="/product/$id" params={{ id: signature.slug }} className="border-b border-foreground pb-0.5 text-sm font-semibold">
                  Add ice cream
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Menu preview */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="flex items-end justify-between gap-6 border-b border-border pb-6">
          <h2 className="font-display text-4xl font-light tracking-tight sm:text-5xl">Something for the craving.</h2>
          <Link to="/menu" className="shrink-0 border-b border-foreground pb-0.5 text-sm font-semibold">
            Full menu
          </Link>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((product, i) => (
            <div key={product.id} className={i % 2 === 1 ? "lg:mt-16" : ""}>
              <ProductCard product={product} tall={i % 2 === 0} />
            </div>
          ))}
        </div>
      </section>

      {/* Late-night moment */}
      <section className="band-dark">
        <div className="mx-auto max-w-6xl px-5 py-28 md:py-40">
          <p className="eyebrow">After Sunset</p>
          <h2 className="mt-8 font-display text-5xl leading-[0.95] font-light tracking-tight sm:text-7xl md:text-8xl">
            Some cravings
            <br />
            only make sense
            <br />
            <em>after sunset.</em>
          </h2>
          <div className="mt-14 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">Serving Bengaluru from 6 PM.</p>
            <p className="font-display text-2xl">6 PM — 11 PM</p>
          </div>
        </div>
      </section>

      {/* Hours */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="font-display text-4xl font-light tracking-tight md:col-span-5">Your night just got sweeter.</h2>
          <div className="divide-y divide-border border-y border-border md:col-span-7">
            <div className="flex items-baseline justify-between py-5">
              <p className="eyebrow">Uniworld 2 Orders</p>
              <p className="font-display text-2xl">6 PM — 11 PM</p>
            </div>
            <div className="flex items-baseline justify-between py-5">
              <p className="eyebrow">Uniworld 1 Orders</p>
              <p className="font-display text-2xl">6 PM — 10 PM</p>
            </div>
            <p className="py-4 text-sm text-muted-foreground">Uniworld 1 deliveries close at 10 PM.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
