-- ============================================================
-- Conceptra — Supabase Database Schema
-- Run this in your Supabase SQL editor to set up all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'teams')),
  papers_used   INT  NOT NULL DEFAULT 0,
  streak_days   INT  NOT NULL DEFAULT 0,
  last_active   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically create a user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── PAPERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.papers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT,
  authors       TEXT[],
  abstract      TEXT,
  arxiv_id      TEXT,
  doi           TEXT,
  pdf_url       TEXT,
  full_text     TEXT,
  goal          TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','done','error')),
  error_msg     TEXT,
  page_count    INT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS papers_user_id_idx ON public.papers(user_id);

-- ─── CONCEPTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.concepts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id          UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  one_line          TEXT,
  excerpt           TEXT,
  importance_rank   INT,
  svg_visual        TEXT,   -- raw SVG string
  narration_script  TEXT,
  audio_url         TEXT,   -- ElevenLabs generated audio stored in Supabase Storage
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS concepts_paper_id_idx ON public.concepts(paper_id);

-- ─── NOTES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_id          UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  what_it_is          TEXT,
  how_it_works        JSONB,   -- string[]
  why_it_matters      TEXT,
  misconceptions      JSONB,   -- string[]
  user_edited         BOOLEAN DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notes_concept_id_idx ON public.notes(concept_id);

-- ─── QUIZ QUESTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_id  UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('multiple_choice','short_answer')),
  question    TEXT NOT NULL,
  options     JSONB,       -- string[] for multiple choice
  correct     TEXT,        -- correct option letter for MC
  explanation TEXT,        -- explanation shown after MC
  rubric      TEXT,        -- rubric for short answer
  sort_order  INT
);

CREATE INDEX IF NOT EXISTS quiz_questions_concept_id_idx ON public.quiz_questions(concept_id);

-- ─── QUIZ ATTEMPTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id   UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer  TEXT,
  score        INT CHECK (score BETWEEN 0 AND 3),
  feedback     TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON public.quiz_attempts(user_id);

-- ─── CONCEPT CONFIDENCE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.concept_confidence (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id       UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  confidence_score INT  NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  last_reviewed    TIMESTAMPTZ DEFAULT NOW(),
  next_review_due  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
  review_count     INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS concept_confidence_user_id_idx ON public.concept_confidence(user_id);
CREATE INDEX IF NOT EXISTS concept_confidence_next_review_idx ON public.concept_confidence(next_review_due);

-- ─── SHARED PACKS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_packs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id    UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  view_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS shared_packs_slug_idx ON public.shared_packs(slug);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_confidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_packs       ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);

-- Papers: owner only (+ service role for processing)
CREATE POLICY "papers_own" ON public.papers FOR ALL USING (auth.uid() = user_id);

-- Concepts readable if you own the paper OR the paper has a shared pack
CREATE POLICY "concepts_own" ON public.concepts FOR SELECT
  USING (paper_id IN (SELECT id FROM public.papers WHERE user_id = auth.uid()));
CREATE POLICY "concepts_insert" ON public.concepts FOR INSERT
  WITH CHECK (paper_id IN (SELECT id FROM public.papers WHERE user_id = auth.uid()));

-- Notes same as concepts
CREATE POLICY "notes_own" ON public.notes FOR ALL
  USING (concept_id IN (
    SELECT c.id FROM public.concepts c
    JOIN public.papers p ON c.paper_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Quiz questions readable to concept owners
CREATE POLICY "quiz_questions_own" ON public.quiz_questions FOR SELECT
  USING (concept_id IN (
    SELECT c.id FROM public.concepts c
    JOIN public.papers p ON c.paper_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Quiz attempts: own only
CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- Confidence: own only
CREATE POLICY "confidence_own" ON public.concept_confidence FOR ALL USING (auth.uid() = user_id);

-- Shared packs: publicly readable
CREATE POLICY "shared_packs_public_read" ON public.shared_packs FOR SELECT USING (true);
CREATE POLICY "shared_packs_owner_insert" ON public.shared_packs FOR INSERT
  WITH CHECK (paper_id IN (SELECT id FROM public.papers WHERE user_id = auth.uid()));
