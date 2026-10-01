import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  adminDeleteProduct,
  adminListOrders,
  adminSaveProduct,
  adminUpdateOrderStatus,
  checkAdmin,
} from "@/lib/admin.functions";
import { productsQueryOptions, type Product } from "@/lib/catalog.functions";
import { formatINR } from "@/lib/money";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Melt N Cream" },
      { name: "description", content: "Internal order and menu management for Melt N Cream." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Melt N Cream" },
      { property: "og:description", content: "Internal dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const ORDER_STATUSES = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"] as const;

function AdminPage() {
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const verifyAdmin = useServerFn(checkAdmin);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: adminCheck, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", Boolean(session)],
    queryFn: () => verifyAdmin({}),
    enabled: Boolean(session),
    retry: false,
  });

  if (checking) return <Center>Loading…</Center>;
  if (!session) return <SignIn />;
  if (checkingRole) return <Center>Checking access…</Center>;
  if (!adminCheck?.isAdmin) {
    return (
      <Center>
        <p className="font-display text-xl font-normal">You don't have access to this area.</p>
        <button
          className="mt-4 rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </Center>
    );
  }

  return <Dashboard />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 py-24 text-center text-muted-foreground">{children}</div>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="font-display text-3xl font-normal">Staff sign in</h1>
      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) setError("Invalid email or password.");
          setBusy(false);
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={input}
          autoComplete="email"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={input}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="tap-target bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Please wait…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<"orders" | "products">("orders");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-normal">Admin</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Sign out
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        {(["orders", "products"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "orders" ? <OrdersAdmin /> : <ProductsAdmin />}
    </div>
  );
}

function OrdersAdmin() {
  const list = useServerFn(adminListOrders);
  const updateStatus = useServerFn(adminUpdateOrderStatus);
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    paymentStatus: "",
    orderStatus: "",
    locationType: "",
    fromDate: "",
    toDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => list({ data: filters }),
  });

  return (
    <div className="mt-6">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <input
          placeholder="Search order / name / phone"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className={input}
        />
        <select
          value={filters.paymentStatus}
          onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
          className={input}
        >
          <option value="">All payments</option>
          {["Pending", "Awaiting Verification", "Paid", "Failed", "Refunded"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.orderStatus}
          onChange={(e) => setFilters((f) => ({ ...f, orderStatus: e.target.value }))}
          className={input}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.locationType}
          onChange={(e) => setFilters((f) => ({ ...f, locationType: e.target.value }))}
          className={input}
        >
          <option value="">All locations</option>
          <option value="uniworld1">Uniworld 1</option>
          <option value="uniworld2">Uniworld 2</option>
        </select>
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
          className={input}
        />
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
          className={input}
        />
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading orders…</p>
      ) : !data || data.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No orders match these filters.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {data.map((order: any) => (
            <div key={order.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-normal">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                  <p className="mt-1 text-sm">
                    {order.customer_name} · {order.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.location_type === "other"
                      ? `${order.address}${order.landmark ? ` (near ${order.landmark})` : ""}`
                      : `${order.hostel ?? order.location_type} · Room ${order.room_number ?? "—"}`}
                  </p>
                  {order.delivery_note && (
                    <p className="text-sm text-muted-foreground">Note: {order.delivery_note}</p>
                  )}
                  <p className="mt-2 text-sm">
                    {(order.items ?? [])
                      .map(
                        (i: any) =>
                          `${i.name} × ${i.quantity}${
                            i.addons?.length ? ` (+${i.addons.map((a: any) => a.name).join(", ")})` : ""
                          }`,
                      )
                      .join(" · ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatINR(order.total_paise)}</p>
                  <p className="text-xs text-muted-foreground">{order.payment_status}</p>
                  {order.upi_reference && (
                    <p className="text-xs font-semibold">UTR: {order.upi_reference}</p>
                  )}
                  {order.preferred_time === "Next opening" && <p className="text-xs text-muted-foreground">Pre-order · next opening</p>}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={order.payment_status}
                onChange={async (e) => {
                  const next = e.target.value as any;
                  await updateStatus({
                    data: {
                      id: order.id,
                      paymentStatus: next,
                      ...(next === "Paid" && order.order_status === "Pending" ? { orderStatus: "Preparing" as const } : {}),
                    },
                  });
                  toast.success("Payment updated");
                  qc.invalidateQueries({ queryKey: ["admin-orders"] });
                }}
                className={`${input} max-w-56`}
              >
                {["Pending", "Awaiting Verification", "Paid", "Failed", "Refunded"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={order.order_status}
                onChange={async (e) => {
                  await updateStatus({
                    data: { id: order.id, orderStatus: e.target.value as any },
                  });
                  toast.success("Order updated");
                  qc.invalidateQueries({ queryKey: ["admin-orders"] });
                }}
                className={`${input} max-w-56`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  price_paise: 0,
  image_url: "",
  category: "Desserts",
  available: true,
  is_featured: false,
  is_bestseller: false,
  sort_order: 0,
  addons: [] as { id: string; name: string; price_paise: number }[],
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const save = useServerFn(adminSaveProduct);
  const remove = useServerFn(adminDeleteProduct);
  const { data: products } = useQuery(productsQueryOptions);
  const [draft, setDraft] = useState<(typeof emptyProduct) & { id?: string }>(emptyProduct);

  function edit(product: Product) {
    setDraft({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price_paise: product.price_paise,
      image_url: product.image_url ?? "",
      category: product.category,
      available: product.available,
      is_featured: product.is_featured,
      is_bestseller: product.is_bestseller,
      sort_order: product.sort_order,
      addons: product.addons,
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-3">
        {(products ?? []).map((product) => (
          <div key={product.id} className="surface-card flex items-center gap-3 p-4">
            {product.image_url && (
              <img src={product.image_url} alt="" className="size-14 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatINR(product.price_paise)} · {product.category} ·{" "}
                {product.available ? "Available" : "Sold out"}
              </p>
            </div>
            <button onClick={() => edit(product)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
              Edit
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Delete ${product.name}?`)) return;
                await remove({ data: { id: product.id } });
                qc.invalidateQueries({ queryKey: ["products"] });
                toast.success("Product deleted");
              }}
              className="rounded-full border border-destructive/50 px-3 py-1.5 text-xs font-semibold text-destructive"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <form
        className="surface-card flex flex-col gap-3 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await save({
              data: {
                ...draft,
                image_url: draft.image_url || null,
                price_paise: Number(draft.price_paise),
                sort_order: Number(draft.sort_order),
              },
            });
            qc.invalidateQueries({ queryKey: ["products"] });
            setDraft(emptyProduct);
            toast.success("Saved");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save");
          }
        }}
      >
        <h2 className="font-display text-lg font-normal">
          {draft.id ? "Edit product" : "New product"}
        </h2>
        <input className={input} placeholder="Name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className={input} placeholder="slug-like-this" required value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        <textarea className={input} rows={3} placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <label className="text-xs text-muted-foreground">
          Price in paise (₹79 = 7900)
          <input className={input} type="number" min={0} value={draft.price_paise} onChange={(e) => setDraft({ ...draft, price_paise: Number(e.target.value) })} />
        </label>
        <input className={input} placeholder="Image URL" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
        <input className={input} placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <label className="text-xs text-muted-foreground">
          Sort order
          <input className={input} type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        </label>

        <div className="flex flex-wrap gap-4 text-sm">
          <Toggle label="Available" checked={draft.available} onChange={(v) => setDraft({ ...draft, available: v })} />
          <Toggle label="Signature" checked={draft.is_featured} onChange={(v) => setDraft({ ...draft, is_featured: v })} />
          <Toggle label="Bestseller" checked={draft.is_bestseller} onChange={(v) => setDraft({ ...draft, is_bestseller: v })} />
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Add-ons</p>
          {draft.addons.map((addon, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input
                className={input}
                placeholder="Name"
                value={addon.name}
                onChange={(e) => {
                  const addons = [...draft.addons];
                  addons[i] = { ...addon, name: e.target.value, id: addon.id || e.target.value.toLowerCase().replace(/\s+/g, "-") };
                  setDraft({ ...draft, addons });
                }}
              />
              <input
                className={`${input} w-32`}
                type="number"
                min={0}
                value={addon.price_paise}
                onChange={(e) => {
                  const addons = [...draft.addons];
                  addons[i] = { ...addon, price_paise: Number(e.target.value) };
                  setDraft({ ...draft, addons });
                }}
              />
              <button
                type="button"
                onClick={() => setDraft({ ...draft, addons: draft.addons.filter((_, x) => x !== i) })}
                className="rounded-full border border-border px-3 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft({ ...draft, addons: [...draft.addons, { id: "", name: "", price_paise: 0 }] })
            }
            className="mt-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
          >
            Add add-on
          </button>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="tap-target flex-1 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Save
          </button>
          {draft.id && (
            <button type="button" onClick={() => setDraft(emptyProduct)} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      {label}
    </label>
  );
}

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
