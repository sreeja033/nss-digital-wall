-- ==============================================================================
-- NSS Community Corkboard - Supabase Complete Database Schema & Security
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types / Enums
DO $$ BEGIN
  CREATE TYPE problem_category AS ENUM (
    'garbage', 'water', 'streetlights', 'roads', 'greenery', 'school', 'accessibility', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE problem_status AS ENUM (
    'pending_review', 'reported', 'in_progress', 'solved', 'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE action_photo_type AS ENUM (
    'before', 'after', 'progress'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE volunteer_status AS ENUM (
    'active', 'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. Core Tables
-- ==============================================================================

-- Coordinators (NSS Programme Officers / Admins)
CREATE TABLE IF NOT EXISTS public.coordinators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  officer_id TEXT NOT NULL UNIQUE,
  title TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Community Users (Residents)
CREATE TABLE IF NOT EXISTS public.community_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Volunteers (NSS Cadets)
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  volunteer_id TEXT NOT NULL UNIQUE,
  college_unit TEXT,
  status volunteer_status NOT NULL DEFAULT 'active',
  hours_completed INTEGER NOT NULL DEFAULT 0,
  created_by_coordinator_id UUID REFERENCES public.coordinators(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Problems (Civic Reports)
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category problem_category NOT NULL,
  photo_url TEXT,
  image_hash TEXT,
  possible_reused_photo BOOLEAN NOT NULL DEFAULT FALSE,
  reflagged_by_community BOOLEAN NOT NULL DEFAULT FALSE,
  flag_count INTEGER NOT NULL DEFAULT 0,
  location_text TEXT NOT NULL,
  landmark TEXT,
  lat NUMERIC,
  lng NUMERIC,
  status problem_status NOT NULL DEFAULT 'pending_review',
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  linked_reports_count INTEGER NOT NULL DEFAULT 0,
  reported_by_user_id UUID REFERENCES public.community_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Community Flags on Problems
CREATE TABLE IF NOT EXISTS public.problem_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  session_token TEXT,
  community_user_id UUID REFERENCES public.community_users(id) ON DELETE CASCADE,
  reason TEXT DEFAULT 'Flagged by resident',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT flag_user_or_token CHECK (community_user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS flag_token_unique ON public.problem_flags(problem_id, session_token) WHERE session_token IS NOT NULL AND community_user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS flag_user_unique ON public.problem_flags(problem_id, community_user_id) WHERE community_user_id IS NOT NULL;

-- Teams (Assignment of Problems to Volunteers)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.coordinators(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, volunteer_id)
);

-- Actions (Action Log & Before/After Proofs)
CREATE TABLE IF NOT EXISTS public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type action_photo_type NOT NULL,
  logged_by UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upvotes
CREATE TABLE IF NOT EXISTS public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  session_token TEXT,
  community_user_id UUID REFERENCES public.community_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT upvote_user_or_token CHECK (community_user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS upvote_user_unique ON public.upvotes(problem_id, community_user_id) WHERE community_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS upvote_token_unique ON public.upvotes(problem_id, session_token) WHERE session_token IS NOT NULL AND community_user_id IS NULL;

-- Adoptions
CREATE TABLE IF NOT EXISTS public.adoptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  session_token TEXT,
  community_user_id UUID REFERENCES public.community_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT adoption_user_or_token CHECK (community_user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS adoption_user_unique ON public.adoptions(problem_id, community_user_id) WHERE community_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS adoption_token_unique ON public.adoptions(problem_id, session_token) WHERE session_token IS NOT NULL AND community_user_id IS NULL;

-- Comments / Neighbor Notes
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  badge TEXT,
  bg_color TEXT,
  session_token TEXT,
  community_user_id UUID REFERENCES public.community_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_problem_id ON public.comments(problem_id);

-- ==============================================================================
-- 4. Required Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_problems_status ON public.problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_category ON public.problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON public.problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_problem_id ON public.teams(problem_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_volunteer_id ON public.volunteers(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteers(status);
CREATE INDEX IF NOT EXISTS idx_actions_problem_id ON public.actions(problem_id);

-- ==============================================================================
-- 5. Business Logic & Constraints at Database Level
-- ==============================================================================

-- Rule 1: A problem can only move to 'solved' once at least one 'before' and one 'after' photo exist in `actions`
CREATE OR REPLACE FUNCTION public.check_solved_photo_requirements()
RETURNS TRIGGER AS $$
DECLARE
  before_count INT;
  after_count INT;
BEGIN
  IF NEW.status = 'solved' AND (OLD.status IS DISTINCT FROM 'solved') THEN
    SELECT COUNT(*) INTO before_count FROM public.actions WHERE problem_id = NEW.id AND photo_type = 'before';
    SELECT COUNT(*) INTO after_count FROM public.actions WHERE problem_id = NEW.id AND photo_type = 'after';

    IF before_count = 0 OR after_count = 0 THEN
      RAISE EXCEPTION 'A problem can only be marked as solved after at least one "before" and one "after" action photo has been uploaded and logged.';
    END IF;

    IF NEW.resolved_at IS NULL THEN
      NEW.resolved_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_solved_photo_requirements ON public.problems;
CREATE TRIGGER trg_check_solved_photo_requirements
  BEFORE UPDATE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.check_solved_photo_requirements();

-- Rule 2: Status auto-updates: 'reported' -> 'in_progress' when a team is created
CREATE OR REPLACE FUNCTION public.auto_update_problem_in_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.problems
  SET status = 'in_progress'
  WHERE id = NEW.problem_id AND status = 'reported';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_update_problem_in_progress ON public.teams;
CREATE TRIGGER trg_auto_update_problem_in_progress
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_problem_in_progress();

-- Rule 3: Maintain upvote_count on public.problems
CREATE OR REPLACE FUNCTION public.sync_problem_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.problems SET upvote_count = upvote_count + 1 WHERE id = NEW.problem_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.problems SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.problem_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_problem_upvote_count ON public.upvotes;
CREATE TRIGGER trg_sync_problem_upvote_count
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_problem_upvote_count();

-- Rule 4: Duplicate detection helper function
CREATE OR REPLACE FUNCTION public.detect_and_link_duplicate(
  p_title TEXT,
  p_description TEXT,
  p_category problem_category,
  p_location_text TEXT
)
RETURNS UUID AS $$
DECLARE
  existing_id UUID;
BEGIN
  -- Look for active problem in same category with similar title or location
  SELECT id INTO existing_id
  FROM public.problems
  WHERE status IN ('reported', 'in_progress')
    AND category = p_category
    AND (
      LOWER(TRIM(location_text)) = LOWER(TRIM(p_location_text))
      OR LOWER(TRIM(title)) = LOWER(TRIM(p_title))
      OR p_location_text ILIKE '%' || location_text || '%'
      OR location_text ILIKE '%' || p_location_text || '%'
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.problems
    SET linked_reports_count = linked_reports_count + 1,
        upvote_count = upvote_count + 1
    WHERE id = existing_id;
    RETURN existing_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 6. Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_coordinator(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.coordinators WHERE id = user_id);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_assigned_volunteer(user_id UUID, p_problem_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.problem_id = p_problem_id AND tm.volunteer_id = user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- --- PROBLEMS POLICIES ---
-- Public SELECT: only returns problems where status is NOT pending_review and NOT rejected
DROP POLICY IF EXISTS "Problems are viewable by everyone" ON public.problems;
DROP POLICY IF EXISTS "Public can only view approved problems" ON public.problems;
CREATE POLICY "Public can only view approved problems" ON public.problems
  FOR SELECT USING (
    status != 'pending_review' AND status != 'rejected'
  );

-- Coordinator SELECT: coordinators can view all problems including pending_review and rejected
DROP POLICY IF EXISTS "Coordinators can view all problems" ON public.problems;
CREATE POLICY "Coordinators can view all problems" ON public.problems
  FOR SELECT USING (
    public.is_coordinator(auth.uid())
  );

-- Public INSERT (anonymous and authenticated community reporting)
DROP POLICY IF EXISTS "Anyone can report a problem" ON public.problems;
CREATE POLICY "Anyone can report a problem" ON public.problems
  FOR INSERT WITH CHECK (true);

-- UPDATE restricted to assigned team members or coordinators
DROP POLICY IF EXISTS "Problems updateable by assigned volunteers or coordinators" ON public.problems;
CREATE POLICY "Problems updateable by assigned volunteers or coordinators" ON public.problems
  FOR UPDATE USING (
    public.is_coordinator(auth.uid()) OR public.is_assigned_volunteer(auth.uid(), id)
  );

-- --- COMMUNITY FLAGS POLICIES ---
ALTER TABLE public.problem_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can flag a problem" ON public.problem_flags;
CREATE POLICY "Anyone can flag a problem" ON public.problem_flags
  FOR INSERT WITH CHECK (
    (community_user_id IS NOT NULL AND community_user_id = auth.uid()) OR (session_token IS NOT NULL)
  );

DROP POLICY IF EXISTS "Flags viewable by coordinators" ON public.problem_flags;
CREATE POLICY "Flags viewable by coordinators" ON public.problem_flags
  FOR SELECT USING (
    public.is_coordinator(auth.uid()) OR (community_user_id IS NOT NULL AND community_user_id = auth.uid())
  );

-- --- ACTIONS POLICIES ---
-- Public SELECT: view actions for approved problems or if coordinator
DROP POLICY IF EXISTS "Actions are viewable by everyone" ON public.actions;
CREATE POLICY "Actions are viewable by everyone" ON public.actions
  FOR SELECT USING (
    public.is_coordinator(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.problems
      WHERE problems.id = actions.problem_id
        AND problems.status != 'pending_review'
        AND problems.status != 'rejected'
    )
  );

-- INSERT restricted to coordinators, or assigned volunteers on approved problems
DROP POLICY IF EXISTS "Actions insertable by assigned team members or coordinators" ON public.actions;
CREATE POLICY "Actions insertable by assigned team members or coordinators" ON public.actions
  FOR INSERT WITH CHECK (
    public.is_coordinator(auth.uid()) OR (
      public.is_assigned_volunteer(auth.uid(), problem_id)
      AND EXISTS (
        SELECT 1 FROM public.problems
        WHERE problems.id = actions.problem_id
          AND problems.status != 'pending_review'
          AND problems.status != 'rejected'
      )
    )
  );

-- --- TEAMS & TEAM MEMBERS POLICIES ---
-- Public SELECT
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Team members are viewable by everyone" ON public.team_members
  FOR SELECT USING (true);

-- INSERT/UPDATE restricted to coordinators, or volunteers self-claiming an approved unassigned problem
DROP POLICY IF EXISTS "Teams insertable by coordinators or self-claiming volunteers" ON public.teams;
CREATE POLICY "Teams insertable by coordinators or self-claiming volunteers" ON public.teams
  FOR INSERT WITH CHECK (
    public.is_coordinator(auth.uid())
    OR (
      EXISTS (SELECT 1 FROM public.volunteers WHERE id = auth.uid() AND status = 'active')
      AND NOT EXISTS (SELECT 1 FROM public.teams WHERE problem_id = teams.problem_id)
      AND EXISTS (
        SELECT 1 FROM public.problems
        WHERE problems.id = teams.problem_id
          AND problems.status != 'pending_review'
          AND problems.status != 'rejected'
      )
    )
  );

DROP POLICY IF EXISTS "Team members insertable by coordinators or self-claiming volunteers" ON public.team_members;
CREATE POLICY "Team members insertable by coordinators or self-claiming volunteers" ON public.team_members
  FOR INSERT WITH CHECK (
    public.is_coordinator(auth.uid())
    OR (volunteer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.volunteers WHERE id = auth.uid() AND status = 'active'))
  );

-- --- VOLUNTEERS POLICIES ---
-- SELECT restricted to the volunteer themselves and coordinators
DROP POLICY IF EXISTS "Volunteers viewable by self and coordinators" ON public.volunteers;
CREATE POLICY "Volunteers viewable by self and coordinators" ON public.volunteers
  FOR SELECT USING (
    auth.uid() = id OR public.is_coordinator(auth.uid())
  );

-- --- COORDINATORS POLICIES ---
-- SELECT / UPDATE restricted to self or public coordinators list
DROP POLICY IF EXISTS "Coordinators viewable by authenticated users" ON public.coordinators;
CREATE POLICY "Coordinators viewable by authenticated users" ON public.coordinators
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Coordinators updateable by self" ON public.coordinators;
CREATE POLICY "Coordinators updateable by self" ON public.coordinators
  FOR UPDATE USING (auth.uid() = id);

-- --- COMMUNITY USERS POLICIES ---
DROP POLICY IF EXISTS "Community users viewable by self and coordinators" ON public.community_users;
CREATE POLICY "Community users viewable by self and coordinators" ON public.community_users
  FOR SELECT USING (auth.uid() = id OR public.is_coordinator(auth.uid()));

DROP POLICY IF EXISTS "Community users updateable by self" ON public.community_users;
CREATE POLICY "Community users updateable by self" ON public.community_users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Community users insertable by self" ON public.community_users;
CREATE POLICY "Community users insertable by self" ON public.community_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- --- UPVOTES & ADOPTIONS ---
DROP POLICY IF EXISTS "Upvotes viewable by everyone" ON public.upvotes;
CREATE POLICY "Upvotes viewable by everyone" ON public.upvotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can add an upvote" ON public.upvotes;
DROP POLICY IF EXISTS "Upvotes only allowed on approved problems" ON public.upvotes;
CREATE POLICY "Upvotes only allowed on approved problems" ON public.upvotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.problems
      WHERE problems.id = upvotes.problem_id
        AND problems.status != 'pending_review'
        AND problems.status != 'rejected'
    )
  );

DROP POLICY IF EXISTS "Upvotes deletable by owner" ON public.upvotes;
CREATE POLICY "Upvotes deletable by owner" ON public.upvotes FOR DELETE USING (
  (community_user_id IS NOT NULL AND community_user_id = auth.uid()) OR (session_token IS NOT NULL)
);

DROP POLICY IF EXISTS "Adoptions viewable by everyone" ON public.adoptions;
CREATE POLICY "Adoptions viewable by everyone" ON public.adoptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can adopt a problem" ON public.adoptions;
DROP POLICY IF EXISTS "Adoptions only allowed on approved problems" ON public.adoptions;
CREATE POLICY "Adoptions only allowed on approved problems" ON public.adoptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.problems
      WHERE problems.id = adoptions.problem_id
        AND problems.status != 'pending_review'
        AND problems.status != 'rejected'
    )
  );

DROP POLICY IF EXISTS "Adoptions deletable by owner" ON public.adoptions;
CREATE POLICY "Adoptions deletable by owner" ON public.adoptions FOR DELETE USING (
  (community_user_id IS NOT NULL AND community_user_id = auth.uid()) OR (session_token IS NOT NULL)
);

-- --- COMMENTS POLICIES ---
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable on approved problems" ON public.comments;
CREATE POLICY "Comments viewable on approved problems" ON public.comments
  FOR SELECT USING (
    public.is_coordinator(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.problems
      WHERE problems.id = comments.problem_id
        AND problems.status != 'pending_review'
        AND problems.status != 'rejected'
    )
  );

DROP POLICY IF EXISTS "Comments only allowed on approved problems" ON public.comments;
CREATE POLICY "Comments only allowed on approved problems" ON public.comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.problems
      WHERE problems.id = comments.problem_id
        AND problems.status != 'pending_review'
        AND problems.status != 'rejected'
    )
  );

-- ==============================================================================
-- 7. Storage Bucket Setup (report-photos)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage bucket policies
DROP POLICY IF EXISTS "Public read for report photos" ON storage.objects;
CREATE POLICY "Public read for report photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "Anyone can upload report photos" ON storage.objects;
CREATE POLICY "Anyone can upload report photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'report-photos'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
  );
