-- ==============================================================================
-- F.R.I.D.A.Y. Migration: Three-Station Role Separation & Unified Drone Monitoring
-- ==============================================================================

-- 1. Update station_credentials constraint to include 'DRONE_RELAY'
ALTER TABLE public.station_credentials 
DROP CONSTRAINT IF EXISTS station_credentials_station_id_check;

ALTER TABLE public.station_credentials 
ADD CONSTRAINT station_credentials_station_id_check 
CHECK (station_id IN ('BASE_A', 'BASE_C', 'DRONE_RELAY'));

-- 2. Create Audit Events table (Append-only ledger of all station actions)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_role TEXT NOT NULL CHECK (station_role IN ('BASE_A', 'BASE_C', 'DRONE_RELAY', 'SYSTEM')),
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    message_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rapid audit filtering
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_role ON public.audit_events(station_role);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON public.audit_events(action_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Permissive Select & Insert for Demo
DROP POLICY IF EXISTS "Public can view audit events" ON public.audit_events;
CREATE POLICY "Public can view audit events" ON public.audit_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert audit events" ON public.audit_events;
CREATE POLICY "Public can insert audit events" ON public.audit_events FOR INSERT WITH CHECK (true);

-- Ensure audit events cannot be modified or deleted by standard clients (append-only)
DROP POLICY IF EXISTS "Deny update on audit events" ON public.audit_events;
DROP POLICY IF EXISTS "Deny delete on audit events" ON public.audit_events;

-- 3. Enable Supabase Realtime for audit_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'audit_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_events;
  END IF;
END $$;
