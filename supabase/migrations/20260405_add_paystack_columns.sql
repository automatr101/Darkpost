-- ============================================================
-- Darkpost — Paystack Integration Migration
-- Run AFTER the subscription system migration
-- https://app.supabase.com/project/rqjypyuifvezjtdxkaxn/sql
-- ============================================================

-- Add Paystack-specific columns to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider       TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paystack')),
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;

-- Optional: index for fast webhook lookup by Paystack subscription code
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_sub_code
  ON subscriptions(paystack_subscription_code);

CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_customer_code
  ON subscriptions(paystack_customer_code);
