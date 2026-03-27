-- Enable Supabase Realtime for the organization table so that
-- is_public visibility changes are broadcast to connected clients in real time.
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization;
