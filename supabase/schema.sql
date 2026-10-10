-- ==============================================================================
-- F.R.I.D.A.Y. Mission Control — Database Schema & Realtime Setup
-- Supabase PostgreSQL Migration for Presentation Demo
-- ==============================================================================

-- 1. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL DEFAULT 'MISSION-ALPHA-CHARLIE-01',
    sender_station TEXT NOT NULL CHECK (sender_station IN ('BASE_A', 'BASE_C')),
    recipient_station TEXT NOT NULL CHECK (recipient_station IN ('BASE_A', 'BASE_C')),
    message_text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('NORMAL', 'SOS', 'MEDICAL', 'ALL_CLEAR', 'DISASTER')),
    disaster_type TEXT NULL,
    direction TEXT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'CLOUD_DELIVERED' CHECK (delivery_status IN ('CLOUD_DELIVERED', 'HARDWARE_PENDING')),
    ack_status TEXT NOT NULL DEFAULT 'UNACKNOWLEDGED' CHECK (ack_status IN ('UNACKNOWLEDGED', 'ACKNOWLEDGED')),
    ack_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for real-time order and fast ledger retrieval
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_station);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_station);
CREATE INDEX IF NOT EXISTS idx_messages_category ON public.messages(category);

-- 2. Create System Setup Table
CREATE TABLE IF NOT EXISTS public.system_setup (
    id TEXT PRIMARY KEY DEFAULT 'SYSTEM_CONFIG',
    is_setup_completed BOOLEAN NOT NULL DEFAULT false,
    setup_at TIMESTAMPTZ NULL,
    version TEXT DEFAULT '2.4-LTS'
);

-- Insert initial setup record if not exists
INSERT INTO public.system_setup (id, is_setup_completed, version)
VALUES ('SYSTEM_CONFIG', false, '2.4-LTS')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Station Credentials Table
CREATE TABLE IF NOT EXISTS public.station_credentials (
    station_id TEXT PRIMARY KEY CHECK (station_id IN ('BASE_A', 'BASE_C')),
    station_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_credentials ENABLE ROW LEVEL SECURITY;

-- Permissive policies for Demo presentation via Supabase anon key
-- Messages policies
DROP POLICY IF EXISTS "Public can view messages" ON public.messages;
CREATE POLICY "Public can view messages" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert messages" ON public.messages;
CREATE POLICY "Public can insert messages" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update messages for ACK" ON public.messages;
CREATE POLICY "Public can update messages for ACK" ON public.messages FOR UPDATE USING (true);

-- System setup policies
DROP POLICY IF EXISTS "Public can read setup status" ON public.system_setup;
CREATE POLICY "Public can read setup status" ON public.system_setup FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update setup status" ON public.system_setup;
CREATE POLICY "Public can update setup status" ON public.system_setup FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can insert setup status" ON public.system_setup;
CREATE POLICY "Public can insert setup status" ON public.system_setup FOR INSERT WITH CHECK (true);

-- Station credentials policies
DROP POLICY IF EXISTS "Public can select credentials" ON public.station_credentials;
CREATE POLICY "Public can select credentials" ON public.station_credentials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert credentials" ON public.station_credentials;
CREATE POLICY "Public can insert credentials" ON public.station_credentials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update credentials" ON public.station_credentials;
CREATE POLICY "Public can update credentials" ON public.station_credentials FOR UPDATE USING (true);

-- 5. Enable Supabase Realtime for Messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
