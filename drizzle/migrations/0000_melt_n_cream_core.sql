-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============ SHARED TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price_paise integer NOT NULL CHECK (price_paise >= 0),
  image_url text,
  category text NOT NULL DEFAULT 'Desserts',
  available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT TO anon, authenticated
USING (true);

CREATE TRIGGER products_touch_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ORDERS ============
CREATE SEQUENCE public.order_number_seq START 1001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('MNC-' || nextval('public.order_number_seq')::text),
  customer_name text NOT NULL,
  phone text NOT NULL,
  location_type text NOT NULL,
  hostel text,
  room_number text,
  address text,
  landmark text,
  delivery_note text,
  preferred_time text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_paise integer NOT NULL DEFAULT 0,
  delivery_fee_paise integer NOT NULL DEFAULT 0,
  total_paise integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Pending',
  order_status text NOT NULL DEFAULT 'Pending',
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('Pending','Paid','Failed','Refunded')),
  CONSTRAINT orders_order_status_check CHECK (order_status IN ('Pending','Preparing','Out for Delivery','Delivered','Cancelled')),
  CONSTRAINT orders_location_type_check CHECK (location_type IN ('uniworld1','uniworld2','other'))
);

GRANT ALL ON public.orders TO service_role;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- No anon access at all: customers read their orders through a server function.
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE TRIGGER orders_touch_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX orders_status_idx ON public.orders (order_status);

-- ============ SEED ============
INSERT INTO public.products (name, slug, description, price_paise, category, available, is_featured, is_bestseller, addons, sort_order)
VALUES (
  'Apple Choco Bliss',
  'apple-choco-bliss',
  'Warm spiced apple folded into rich melted chocolate, finished with a glossy cocoa crackle. Our signature late-night craving.',
  7900,
  'Desserts',
  true,
  true,
  true,
  '[{"id":"vanilla-ice-cream","name":"Vanilla Ice Cream","price_paise":2000}]'::jsonb,
  1
);
