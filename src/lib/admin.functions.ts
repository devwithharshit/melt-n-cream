import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Forbidden");
  if (!data) {
    const { data: staff, error: staffError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "staff",
    });
    if (staffError || !staff) throw new Error("Forbidden");
  }
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Owner access is provisioned only after the authenticated email has been verified.
    // The email is read from Auth on the server, never from a request parameter.
    const { data: identity, error: identityError } = await context.supabase.auth.getUser();
    const owner = identity?.user;
    if (!identityError && owner?.id === context.userId && owner.email?.toLowerCase() === "gautamharshitofficial@gmail.com" && owner.email_confirmed_at) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: provisionError } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: context.userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
      if (provisionError) throw new Error("Could not activate owner access");
    }
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (data) return { isAdmin: true };
    const { data: staff } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "staff",
    });
    return { isAdmin: Boolean(staff) };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        search: z.string().trim().max(80).optional(),
        paymentStatus: z.string().optional(),
        orderStatus: z.string().optional(),
        locationType: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let query = context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (data.paymentStatus) query = query.eq("payment_status", data.paymentStatus);
    if (data.orderStatus) query = query.eq("order_status", data.orderStatus);
    if (data.locationType) query = query.eq("location_type", data.locationType);
    if (data.fromDate) query = query.gte("created_at", `${data.fromDate}T00:00:00Z`);
    if (data.toDate) query = query.lte("created_at", `${data.toDate}T23:59:59Z`);
    if (data.search) {
      const term = `%${data.search}%`;
      query = query.or(`order_number.ilike.${term},customer_name.ilike.${term},phone.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        orderStatus: z.enum(["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]).optional(),
        paymentStatus: z.enum(["Pending", "Awaiting Verification", "Paid", "Failed", "Refunded"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("orders")
      .update({
        ...(data.orderStatus ? { order_status: data.orderStatus } : {}),
        ...(data.paymentStatus ? { payment_status: data.paymentStatus } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  description: z.string().trim().max(600).default(""),
  price_paise: z.number().int().min(0).max(10_000_00),
  image_url: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().min(2).max(40),
  available: z.boolean(),
  is_featured: z.boolean(),
  is_bestseller: z.boolean(),
  sort_order: z.number().int().min(0).max(999).default(0),
  addons: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        name: z.string().trim().min(1).max(60),
        price_paise: z.number().int().min(0).max(10_000_00),
      }),
    )
    .max(10)
    .default([]),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => productSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price_paise: data.price_paise,
      image_url: data.image_url || null,
      category: data.category,
      available: data.available,
      is_featured: data.is_featured,
      is_bestseller: data.is_bestseller,
      sort_order: data.sort_order,
      addons: data.addons,
    };

    const { error } = data.id
      ? await supabaseAdmin.from("products").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("products").insert(payload);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
