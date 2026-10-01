import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LOCATIONS, orderingStatus, type LocationType } from "./hours";

const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  addonIds: z.array(z.string()).max(10).default([]),
});

const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(20),
  customerName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
  locationType: z.enum(["uniworld1", "uniworld2"]),
  roomNumber: z.string().trim().min(1).max(40),
  preOrder: z.boolean().default(false),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      amountPaise: number;
    }
  | { ok: false; code: string; message: string };

export type PublicOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  location_type: LocationType;
  hostel: string | null;
  room_number: string | null;
  address: string | null;
  landmark: string | null;
  delivery_note: string | null;
  preferred_time: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPricePaise: number;
    addons: Array<{ name: string; price_paise: number }>;
    lineTotalPaise: number;
  }>;
  subtotal_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  payment_status: string;
  upi_reference: string | null;
  order_status: string;
  created_at: string;
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    const now = new Date();

    // --- 1. Operating-hours check (authoritative, Asia/Kolkata) ---
    const status = orderingStatus(data.locationType, now);
    if (!status.open && !data.preOrder) {
      return { ok: false, code: "CLOSED", message: status.message };
    }
    if (status.open && data.preOrder) {
      return { ok: false, code: "INVALID_PREORDER", message: "Orders are open now. Please place a regular order." };
    }
    // --- 2. Delivery details ---
    if (!data.roomNumber) {
      return { ok: false, code: "INVALID_ADDRESS", message: "Please enter your room number." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // --- 3. Re-price everything from the database ---
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price_paise, available, addons")
      .in("id", productIds);

    if (productError || !products) {
      console.error("createPaymentOrder product lookup failed", productError?.message);
      return { ok: false, code: "SERVER_ERROR", message: "Something went wrong. Please try again." };
    }

    const lines: PublicOrder["items"] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { ok: false, code: "PRODUCT_MISSING", message: "An item in your bag is no longer on the menu." };
      }
      if (!product.available) {
        return { ok: false, code: "SOLD_OUT", message: `${product.name} is sold out right now.` };
      }

      const catalogAddons = Array.isArray(product.addons)
        ? (product.addons as Array<{ id: string; name: string; price_paise: number }>)
        : [];

      const addons = item.addonIds.map((id) => catalogAddons.find((a) => a.id === id));
      if (addons.some((a) => !a)) {
        return { ok: false, code: "INVALID_ADDON", message: "An add-on in your bag is unavailable." };
      }

      const resolvedAddons = addons.flatMap((a) =>
        a ? [{ name: a.name, price_paise: Number(a.price_paise) }] : [],
      );
      const addonTotal = resolvedAddons.reduce((s, a) => s + a.price_paise, 0);
      const lineTotal = (product.price_paise + addonTotal) * item.quantity;
      subtotal += lineTotal;

      lines.push({
        name: product.name,
        quantity: item.quantity,
        unitPricePaise: product.price_paise,
        addons: resolvedAddons,
        lineTotalPaise: lineTotal,
      });
    }

    const deliveryFee = LOCATIONS[data.locationType].deliveryFeePaise;
    const total = subtotal + deliveryFee;
    if (total <= 0) {
      return { ok: false, code: "INVALID_TOTAL", message: "Your bag is empty." };
    }

    // --- 4. Save the order (unpaid until staff confirm the UPI payment) ---
    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customerName,
        phone: data.phone,
        location_type: data.locationType,
        hostel: LOCATIONS[data.locationType].label,
        room_number: data.roomNumber ?? null,
        address: null,
        landmark: null,
        delivery_note: null,
        preferred_time: status.open ? null : "Next opening",
        items: lines,
        subtotal_paise: subtotal,
        delivery_fee_paise: deliveryFee,
        total_paise: total,
        payment_status: "Pending",
        order_status: "Pending",
      })
      .select("id, order_number")
      .single();

    if (insertError || !order) {
      console.error("placeOrder insert failed", insertError?.message);
      return { ok: false, code: "SERVER_ERROR", message: "Could not place your order. Please try again." };
    }

    return { ok: true, orderId: order.id, orderNumber: order.order_number, amountPaise: total };
  });

const referenceSchema = z.object({
  orderId: z.string().uuid(),
  reference: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{10,35}$/, "Enter the UPI transaction ID / UTR from your payment app"),
});

/** Customer submits the UPI transaction ID after paying via the QR. Staff verify it before the order is marked Paid. */
export const submitUpiReference = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) return { ok: false, message: "Order not found." };
    if (order.payment_status !== "Pending") {
      return { ok: true, message: "We already have your payment details." };
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ upi_reference: data.reference.toUpperCase(), payment_status: "Awaiting Verification" })
      .eq("id", order.id)
      .eq("payment_status", "Pending");

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: "That transaction ID has already been used for another order." };
      }
      return { ok: false, message: "Could not save your payment details. Please try again." };
    }
    return { ok: true, message: "Thanks! We'll confirm your payment shortly." };
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<PublicOrder | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, location_type, hostel, room_number, address, landmark, delivery_note, preferred_time, items, subtotal_paise, delivery_fee_paise, total_paise, payment_status, upi_reference, order_status, created_at",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error || !order) return null;
    return order as unknown as PublicOrder;
  });

export const getOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(50) }).parse(data),
  )
  .handler(async ({ data }): Promise<PublicOrder[]> => {
    if (data.ids.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, location_type, hostel, room_number, address, landmark, delivery_note, preferred_time, items, subtotal_paise, delivery_fee_paise, total_paise, payment_status, upi_reference, order_status, created_at",
      )
      .in("id", data.ids)
      .order("created_at", { ascending: false });

    if (error || !orders) return [];
    return orders as unknown as PublicOrder[];
  });

/** Server clock + open/closed state, so the UI can't be fooled by a wrong device clock. */
export const getShopStatus = createServerFn({ method: "GET" }).handler(async () => {
  const now = new Date();
  const general = orderingStatus(null, now);
  return {
    serverTimeIso: now.toISOString(),
    nowMinutes: general.nowMinutes,
    open: general.open,
    message: general.message,
  };
});
