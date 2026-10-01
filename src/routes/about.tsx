import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Melt N Cream" },
      {
        name: "description",
        content: "Melt N Cream is a Bengaluru late-night dessert kitchen built for cravings after dark.",
      },
      { property: "og:title", content: "About — Melt N Cream" },
      { property: "og:description", content: "A Bengaluru late-night dessert kitchen for cravings after dark." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:py-28">
      <p className="eyebrow">About</p>
      <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.98] font-light tracking-tight sm:text-7xl">
        Melt N Cream exists for the hours when you want something sweet, rich and a little{" "}
        <em>unnecessary.</em>
      </h1>
      <div className="mt-14 grid gap-8 border-t border-border pt-8 text-muted-foreground md:grid-cols-2">
        <p>
          A small Bengaluru dessert studio that opens when everything else shuts. Study nights, long
          hostel conversations, the 10 PM sweet tooth — that's who we cook for.
        </p>
        <p>
          The menu stays short on purpose. Apple Choco Bliss came first, and new desserts only join
          when they're genuinely worth staying up for.
        </p>
      </div>
      <Link
        to="/menu"
        className="tap-target mt-12 inline-flex bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground"
      >
        Explore Desserts
      </Link>
    </div>
  );
}
