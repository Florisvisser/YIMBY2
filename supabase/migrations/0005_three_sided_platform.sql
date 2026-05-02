-- Three-sided platform schema (Deploy A — additive only).
-- Adds developers, plans, plan_versions, feedback_rounds tables.
-- Adds nullable plan_slug + feedback_round_id to concerns.
-- Concerns RLS unchanged in Deploy A (anon-flow continues to work).
-- Cutover (NOT NULL on plan_slug + tightened anon-insert policy) ships in Deploy B.

-- Developers (auth.users → public.developers)
CREATE TABLE IF NOT EXISTS public.developers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  title TEXT NOT NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  municipality_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Plan versions (jsonb knowledge per version)
CREATE TABLE IF NOT EXISTS public.plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  knowledge JSONB NOT NULL,
  pdf_url TEXT,
  changelog TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (plan_id, version_number)
);
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_plan_versions_plan_id ON public.plan_versions(plan_id);

-- Feedback rounds (open/closed window for zienswijze submissions)
CREATE TABLE IF NOT EXISTS public.feedback_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  opens_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (closes_at > opens_at)
);
ALTER TABLE public.feedback_rounds ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_feedback_rounds_plan_version_id ON public.feedback_rounds(plan_version_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rounds_status ON public.feedback_rounds(status);

-- Concerns: nullable plan_slug + feedback_round_id (cutover to NOT NULL in Deploy B)
ALTER TABLE public.concerns
  ADD COLUMN IF NOT EXISTS plan_slug TEXT,
  ADD COLUMN IF NOT EXISTS feedback_round_id UUID REFERENCES public.feedback_rounds(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_concerns_plan_slug ON public.concerns(plan_slug);
CREATE INDEX IF NOT EXISTS idx_concerns_feedback_round_id ON public.concerns(feedback_round_id);

-- Trigger: auto-populate developers row on new auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_developer() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.developers (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_developer();

-- RLS — anon-readable for plans/versions/rounds (public-facing data)
DROP POLICY IF EXISTS "anon read plans" ON public.plans;
CREATE POLICY "anon read plans" ON public.plans FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read plan_versions" ON public.plan_versions;
CREATE POLICY "anon read plan_versions" ON public.plan_versions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read feedback_rounds" ON public.feedback_rounds;
CREATE POLICY "anon read feedback_rounds" ON public.feedback_rounds FOR SELECT TO anon USING (true);

-- RLS — authenticated devs can read all + write only their own plans
DROP POLICY IF EXISTS "auth read plans" ON public.plans;
CREATE POLICY "auth read plans" ON public.plans FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dev writes own plans" ON public.plans;
CREATE POLICY "dev writes own plans" ON public.plans FOR ALL TO authenticated
  USING (developer_id = auth.uid())
  WITH CHECK (developer_id = auth.uid());

DROP POLICY IF EXISTS "dev writes own plan_versions" ON public.plan_versions;
CREATE POLICY "dev writes own plan_versions" ON public.plan_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.plans WHERE plans.id = plan_versions.plan_id AND plans.developer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.plans WHERE plans.id = plan_versions.plan_id AND plans.developer_id = auth.uid()));

DROP POLICY IF EXISTS "dev writes own feedback_rounds" ON public.feedback_rounds;
CREATE POLICY "dev writes own feedback_rounds" ON public.feedback_rounds FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.plan_versions pv
    JOIN public.plans p ON p.id = pv.plan_id
    WHERE pv.id = feedback_rounds.plan_version_id AND p.developer_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.plan_versions pv
    JOIN public.plans p ON p.id = pv.plan_id
    WHERE pv.id = feedback_rounds.plan_version_id AND p.developer_id = auth.uid()
  ));

-- RLS for developers (own row only, read + update — insert handled by trigger)
DROP POLICY IF EXISTS "dev reads own row" ON public.developers;
CREATE POLICY "dev reads own row" ON public.developers FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "dev writes own row" ON public.developers;
CREATE POLICY "dev writes own row" ON public.developers FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

COMMENT ON TABLE public.plans IS 'Three-sided platform: each plan is owned by a developer; multiple gemeentes/projects can coexist';
COMMENT ON TABLE public.plan_versions IS 'Versioned plan-knowledge JSON. Latest published_at IS NOT NULL = current public version';
COMMENT ON TABLE public.feedback_rounds IS 'Open/close windows for zienswijze submission per plan version';
COMMENT ON TABLE public.developers IS 'Auto-populated from auth.users via trigger on insert';
