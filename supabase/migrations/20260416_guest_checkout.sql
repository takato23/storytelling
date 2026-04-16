-- Guest checkout: allow orders without mandatory auth
-- Adds customer_email to orders for guest identification
-- Adds claim_token for post-purchase library claim via magic link

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Index for claim flow lookups
CREATE INDEX IF NOT EXISTS idx_orders_claim_token ON public.orders (claim_token) WHERE claim_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email) WHERE customer_email IS NOT NULL;

-- Allow guest orders: relax user_id NOT NULL constraint
-- We keep user_id for authenticated users, customer_email for guests
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Ensure at least one identifier exists
ALTER TABLE public.orders ADD CONSTRAINT orders_has_owner
  CHECK (user_id IS NOT NULL OR customer_email IS NOT NULL);
