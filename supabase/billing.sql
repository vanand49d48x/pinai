-- PinAI Billing — run in Supabase SQL Editor after schema.sql

CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usage_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  pins_created INT NOT NULL DEFAULT 0,
  ai_generations INT NOT NULL DEFAULT 0,
  pins_warning_sent BOOLEAN NOT NULL DEFAULT false,
  ai_warning_sent BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, period_start)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage"
  ON usage_counters FOR SELECT USING (auth.uid() = user_id);

-- Allow multiple Pinterest accounts for starter/pro plans
ALTER TABLE pinterest_accounts DROP CONSTRAINT IF EXISTS pinterest_accounts_user_id_key;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Atomic usage increment (race-safe)
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_field TEXT,
  p_amount INT DEFAULT 1
) RETURNS usage_counters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period DATE := date_trunc('month', now())::DATE;
  v_result usage_counters;
BEGIN
  IF p_field NOT IN ('pins_created', 'ai_generations') THEN
    RAISE EXCEPTION 'Invalid field: %', p_field;
  END IF;

  IF p_field = 'pins_created' THEN
    INSERT INTO usage_counters (user_id, period_start, pins_created, ai_generations)
    VALUES (p_user_id, v_period, p_amount, 0)
    ON CONFLICT (user_id, period_start)
    DO UPDATE SET pins_created = usage_counters.pins_created + p_amount
    RETURNING * INTO v_result;
  ELSE
    INSERT INTO usage_counters (user_id, period_start, pins_created, ai_generations)
    VALUES (p_user_id, v_period, 0, p_amount)
    ON CONFLICT (user_id, period_start)
    DO UPDATE SET ai_generations = usage_counters.ai_generations + p_amount
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- Auto-create free subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_subscription();
