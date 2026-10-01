ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_reference text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_upi_reference_key ON public.orders (upi_reference) WHERE upi_reference IS NOT NULL;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('Pending','Awaiting Verification','Paid','Failed','Refunded'));