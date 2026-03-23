-- ============================================================
-- Conceptra — Feature migrations
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Paper at a Glance (soul extraction) ─────────────────────
ALTER TABLE papers ADD COLUMN IF NOT EXISTS soul jsonb;

-- ─── Feature 1: Spaced Repetition (Leitner boxes) ────────────
ALTER TABLE concept_confidence
  ADD COLUMN IF NOT EXISTS box_level       integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS next_review_date date    NOT NULL DEFAULT (CURRENT_DATE + 1),
  ADD COLUMN IF NOT EXISTS streak_days     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_quiz_date  date;

-- Backfill next_review_date from existing next_review_due where present
UPDATE concept_confidence
SET next_review_date = next_review_due::date
WHERE next_review_due IS NOT NULL AND next_review_date = (CURRENT_DATE + 1);

CREATE TABLE IF NOT EXISTS daily_reviews (
  id                  uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid      REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date         date      NOT NULL DEFAULT CURRENT_DATE,
  concepts_due        integer   NOT NULL DEFAULT 0,
  concepts_completed  integer   NOT NULL DEFAULT 0,
  created_at          timestamp DEFAULT now(),
  UNIQUE(user_id, review_date)
);

-- ─── Feature 2: Cross-source Concept Linking ──────────────────
CREATE TABLE IF NOT EXISTS concept_links (
  id               uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid  REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id_a     uuid  REFERENCES concepts(id)   ON DELETE CASCADE,
  concept_id_b     uuid  REFERENCES concepts(id)   ON DELETE CASCADE,
  similarity_score float NOT NULL,
  created_at       timestamp DEFAULT now(),
  UNIQUE(user_id, concept_id_a, concept_id_b)
);

-- ─── Feature 3: Social Concept Packs ──────────────────────────
CREATE TABLE IF NOT EXISTS packs (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  title          text    NOT NULL,
  description    text,
  slug           text    UNIQUE NOT NULL,
  is_public      boolean NOT NULL DEFAULT true,
  view_count     integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  created_at     timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pack_concepts (
  id         uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id    uuid  REFERENCES packs(id)    ON DELETE CASCADE,
  concept_id uuid  REFERENCES concepts(id) ON DELETE CASCADE,
  position   integer NOT NULL DEFAULT 0,
  added_at   timestamp DEFAULT now(),
  UNIQUE(pack_id, concept_id)
);

CREATE TABLE IF NOT EXISTS pack_follows (
  id          uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid  REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id     uuid  REFERENCES packs(id)      ON DELETE CASCADE,
  followed_at timestamp DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

-- RPC: increment pack follower count atomically
CREATE OR REPLACE FUNCTION increment_pack_followers(pack_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE packs SET follower_count = follower_count + 1 WHERE id = pack_id;
$$;

-- RPC: decrement pack follower count atomically
CREATE OR REPLACE FUNCTION decrement_pack_followers(pack_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE packs SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = pack_id;
$$;
