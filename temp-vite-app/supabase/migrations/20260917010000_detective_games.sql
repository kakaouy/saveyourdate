-- Isolated game state; no changes to event or invitation tables.
CREATE TABLE IF NOT EXISTS public.detective_games (
 code_hash text PRIMARY KEY CHECK (code_hash ~ '^[a-f0-9]{64}$'),
 state jsonb NOT NULL,
 version integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.detective_games ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.detective_games FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.detective_games TO service_role;
