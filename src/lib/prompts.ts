// ============================================================
// Conceptra — All Gemini API Prompts
// These are the exact prompts from the MVP specification
// ============================================================

// ─── 4.1 Concept Extraction ───────────────────────────────────
export const CONCEPT_EXTRACTION_SYSTEM = `You are an expert academic knowledge extractor. Your job is to read a research paper and extract the 5-8 most important atomic concepts that a reader must understand to genuinely grasp this paper. An atomic concept is a single idea, mechanism, or technique — not a broad topic.`;

export function conceptExtractionUser(
  title: string,
  abstract: string,
  text: string,
  goal: string
) {
  return `Paper title: ${title}

Paper abstract: ${abstract}

Paper full text (first 8000 tokens): ${text}

User's learning goal: ${goal || 'General understanding of the paper'}

Extract exactly 5-8 concepts. For each concept return JSON:
{"concepts": [{"id": "c1", "name": "string", "one_line": "string (max 15 words)", "excerpt": "string (exact quote from paper, max 200 words)", "importance_rank": 1}]}

Return ONLY the JSON. No prose.`;
}

// ─── 3.3 XAI Visual Generation ───────────────────────────────
export const XAI_VISUAL_SYSTEM = `You are an expert at creating explainable AI (XAI) diagrams. Your job is to generate an SVG diagram that shows the MECHANISM of a concept — how it actually works step by step — not a summary of what a paper says about it.

Rules for your diagrams:
1. Show process and flow, not just labels. Arrows must show data moving or transforming.
2. Use colour to encode meaning: warm (amber/coral) = active/high weight, cool (teal/blue) = passive/low weight, gray = structural.
3. Include at minimum: input nodes, transformation steps, output nodes, and at least one feedback or connection path.
4. Label every element. No unlabelled shapes.
5. Output ONLY the raw SVG code starting with <svg viewBox="0 0 680 400">. No prose, no markdown, no explanation.`;

export function xaiVisualUser(conceptName: string, excerpt: string) {
  return `Generate an XAI mechanism diagram for the concept: ${conceptName}. Context from the paper: ${excerpt}`;
}

// ─── 4.2 Notes Generation ─────────────────────────────────────
export const NOTES_GENERATION_SYSTEM = `You are an expert at turning dense academic concepts into clear, actionable learning notes. Write for a smart reader who is encountering this concept for the first time.`;

export function notesGenerationUser(conceptName: string, excerpt: string) {
  return `Concept: ${conceptName}

Context from paper: ${excerpt}

Generate structured notes in this EXACT JSON format:
{"what_it_is": "2-3 sentences", "how_it_works": ["step 1", "step 2", "step 3", "step 4"], "why_it_matters": "2-3 sentences", "common_misconceptions": ["misconception 1", "misconception 2"]}

Return ONLY the JSON.`;
}

// ─── 4.3 Quiz Generation ──────────────────────────────────────
export const QUIZ_GENERATION_SYSTEM = `You are an expert at creating adaptive quizzes that test genuine understanding, not memorisation.`;

export function quizGenerationUser(conceptName: string, notesJson: string) {
  return `Concept: ${conceptName}

Notes: ${notesJson}

Generate exactly 3 questions. Format as JSON:
{"questions": [{"id": "q1", "type": "multiple_choice", "question": "string", "options": ["A","B","C","D"], "correct": "A", "explanation": "string"}, {"id": "q2", "type": "multiple_choice", ...}, {"id": "q3", "type": "short_answer", "question": "string", "rubric": "what a good answer includes"}]}

Questions 1-2 must be multiple choice testing comprehension.
Question 3 must be short answer testing application.

Return ONLY the JSON.`;
}

// ─── 4.4 Short Answer Evaluation ─────────────────────────────
export const EVALUATION_SYSTEM = `You are a fair, encouraging academic evaluator. Score short answers honestly but with constructive feedback.`;

export function evaluationUser(
  question: string,
  rubric: string,
  userAnswer: string
) {
  return `Question: ${question}

Rubric (what a good answer includes): ${rubric}

Student answer: ${userAnswer}

Return JSON: {"score": 0-3, "feedback": "1-2 sentences explaining the score and what they missed or got right", "correct_answer": "ideal short answer in 1-2 sentences"}

Score: 3=excellent, 2=good with minor gaps, 1=partial understanding, 0=incorrect or off-topic.`;
}

// ─── Paper Soul Extraction ────────────────────────────────────
export const PAPER_SOUL_SYSTEM = `You extract the six most critical facts from a research paper that experts look for when skimming. You read specific sections of the paper to find each fact rather than summarising generally. Be precise and concrete. Every answer must be one sentence maximum.`;

export function paperSoulUser(fullPaperText: string) {
  return `Paper text: ${fullPaperText}

Extract these six facts. Return ONLY this JSON:
{
  "knowledge_gap": "The specific problem the world could not solve before this paper — found in last 2-3 sentences of Introduction",
  "novel_approach": "The unique method or trick different from prior work — found at end of Introduction or start of Methods",
  "central_claim": "The single most important finding — found in Abstract or first paragraph of Discussion",
  "hero_data_point": "The one number, percentage or metric that proves the approach worked — e.g. '83.6% accuracy vs 39% baseline' — found in Results or Abstract",
  "main_limitation": "The condition under which findings might not hold — found in Limitations subsection of Discussion",
  "real_world_impact": "How this changes things for regular people or the field — found in last paragraph of Conclusion"
}

Rules: Every value must be one sentence. hero_data_point must contain at least one specific number. If you cannot find a field in the specified location, search the full text. Never leave a field as null — always extract the best available answer.`;
}

// ─── 4.5 Narration Script ─────────────────────────────────────
export const NARRATION_SYSTEM = `You write narration scripts for short educational clips. Your scripts are clear, warm, and conversational — like a brilliant friend explaining something, not a lecturer. Write exactly 130-160 words (45-55 seconds at normal pace).`;

export function narrationUser(conceptName: string, notesJson: string) {
  return `Concept: ${conceptName}

Notes: ${notesJson}

Write a narration script. Rules: Start with a hook (surprising fact or question). Explain the mechanism in 3-4 sentences. End with why this matters in practice. No jargon without immediate explanation. No 'in conclusion' or 'in summary'. Just output the script text, nothing else.`;
}
