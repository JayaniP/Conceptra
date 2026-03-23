// ============================================================
// Conceptra — Shared TypeScript Types
// ============================================================

export type Plan = 'free' | 'pro' | 'teams';
export type PaperStatus = 'pending' | 'processing' | 'done' | 'error';
export type QuestionType = 'multiple_choice' | 'short_answer';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan: Plan;
  papers_used: number;
  streak_days: number;
  last_active: string;
  created_at: string;
}

export interface Paper {
  id: string;
  user_id: string | null;
  title: string | null;
  authors: string[] | null;
  abstract: string | null;
  arxiv_id: string | null;
  doi: string | null;
  pdf_url: string | null;
  goal: string | null;
  status: PaperStatus;
  error_msg: string | null;
  page_count: number | null;
  created_at: string;
  processed_at: string | null;
  soul?: PaperSoul | null;
  concepts?: Concept[];
}

export interface PaperSoul {
  knowledge_gap: string;
  novel_approach: string;
  central_claim: string;
  hero_data_point: string;
  main_limitation: string;
  real_world_impact: string;
}

export interface Concept {
  id: string;
  paper_id: string;
  name: string;
  one_line: string | null;
  excerpt: string | null;
  importance_rank: number | null;
  svg_visual: string | null;
  narration_script: string | null;
  audio_url: string | null;
  created_at: string;
  notes?: Notes;
  quiz_questions?: QuizQuestion[];
  confidence?: ConceptConfidence;
}

export interface Notes {
  id: string;
  concept_id: string;
  what_it_is: string | null;
  how_it_works: string[] | null;
  why_it_matters: string | null;
  misconceptions: string[] | null;
  user_edited: boolean;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  concept_id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correct: string | null;
  explanation: string | null;
  rubric: string | null;
  sort_order: number | null;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  concept_id: string;
  question_id: string;
  user_answer: string | null;
  score: number | null;
  feedback: string | null;
  attempted_at: string;
}

export interface ConceptConfidence {
  id: string;
  user_id: string;
  concept_id: string;
  confidence_score: number;
  last_reviewed: string;
  next_review_due: string;
  review_count: number;
  // Spaced repetition (Leitner boxes)
  box_level: number;        // 1–5
  next_review_date: string; // date string YYYY-MM-DD
  streak_days: number;
  last_quiz_date: string | null;
}

export interface ConceptLink {
  id: string;
  user_id: string;
  concept_id_a: string;
  concept_id_b: string;
  similarity_score: number;
  created_at: string;
  // joined
  concept?: Concept & { paper?: { id: string; title: string | null } };
}

export interface Pack {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  view_count: number;
  follower_count: number;
  created_at: string;
  // joined
  pack_concepts?: PackConcept[];
  is_following?: boolean;
}

export interface PackConcept {
  id: string;
  pack_id: string;
  concept_id: string;
  position: number;
  added_at: string;
  // joined
  concept?: Concept & { paper?: { id: string; title: string | null } };
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string;
  concepts_due: number;
  concepts_completed: number;
  created_at: string;
}

export interface ReviewDueItem {
  id: string;
  user_id: string;
  concept_id: string;
  box_level: number;
  next_review_date: string;
  streak_days: number;
  concept: Concept & {
    paper?: { id: string; title: string | null };
  };
}

export interface SharedPack {
  id: string;
  paper_id: string;
  slug: string;
  view_count: number;
  created_at: string;
  paper?: Paper;
}

// ─── API payloads ─────────────────────────────────────────────
export interface ExtractedConcept {
  id: string;
  name: string;
  one_line: string;
  excerpt: string;
  importance_rank: number;
}

export interface GeneratedNotes {
  what_it_is: string;
  how_it_works: string[];
  why_it_matters: string;
  common_misconceptions: string[];
}

export interface GeneratedQuiz {
  questions: Array<{
    id: string;
    type: QuestionType;
    question: string;
    options?: string[];
    correct?: string;
    explanation?: string;
    rubric?: string;
  }>;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  correct_answer: string;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

// ─── Clip / Remotion scene types ──────────────────────────────
export type ClipElementType = 'box' | 'arrow' | 'circle' | 'text_pop' | 'highlight';
export type ClipColor = 'teal' | 'purple' | 'amber' | 'coral' | 'gray';
export type ClipPosition = 'left' | 'center' | 'right' | 'top' | 'bottom';
export type ClipVisualType = 'title_card' | 'flow_diagram' | 'comparison' | 'highlight_box' | 'metric_reveal';

export interface ClipElement {
  type: ClipElementType;
  label: string;
  color: ClipColor;
  position?: ClipPosition;
  animates_in_at: number; // seconds from scene start
  from?: string; // for arrows
  to?: string;   // for arrows
}

export interface ClipScene {
  id: string;
  start_second: number;
  end_second: number;
  narration_segment: string;
  visual_type: ClipVisualType;
  heading: string;
  body_text: string;
  elements: ClipElement[];
  background_color: string;
}

export interface ClipScript {
  title: string;
  total_duration_seconds: number;
  narration: string;
  scenes: ClipScene[];
}
