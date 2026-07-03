-- PicAI Scheduler — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Pin status enum
CREATE TYPE pin_status AS ENUM (
  'draft',
  'generating',
  'ready',
  'scheduled',
  'publishing',
  'posted',
  'failed'
);

-- Pinterest connected accounts
CREATE TABLE pinterest_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  pinterest_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Synced Pinterest boards
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinterest_board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, pinterest_board_id)
);

-- Pins
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  destination_link TEXT,
  topic TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',
  title TEXT,
  description TEXT,
  alt_text TEXT,
  status pin_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  pinterest_pin_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pins_user_id ON pins(user_id);
CREATE INDEX idx_pins_status_scheduled ON pins(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_boards_user_id ON boards(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pinterest_accounts_updated_at
  BEFORE UPDATE ON pinterest_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pins_updated_at
  BEFORE UPDATE ON pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE pinterest_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- pinterest_accounts policies
CREATE POLICY "Users can view own pinterest account"
  ON pinterest_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pinterest account"
  ON pinterest_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pinterest account"
  ON pinterest_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pinterest account"
  ON pinterest_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- boards policies
CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- pins policies
CREATE POLICY "Users can view own pins"
  ON pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pins"
  ON pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pins"
  ON pins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pins"
  ON pins FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for pin images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-images', 'pin-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload pin images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own pin images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own pin images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Pin images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pin-images');
