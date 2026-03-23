# Conceptra

**Research papers, finally understood.**

Upload any research paper → get 5–8 key concepts, each with an XAI visual diagram, plain-English explanation, short animated clip, structured notes, and a quiz — all in under 60 seconds.

---

## Quick Start (Day 1 Setup)

### 1. Clone and install

```bash
cd Conceptra
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in all keys (see below)
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys into `.env.local`
3. Run the schema in your Supabase SQL editor:

```bash
# Paste contents of supabase/schema.sql into the Supabase SQL editor
```

4. Create a Storage bucket named `conceptra-assets` (set to public)

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key — powers all AI features |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `ELEVENLABS_API_KEY` | ElevenLabs key for narration audio (optional for MVP) |
| `ELEVENLABS_VOICE_ID` | Voice ID (default: Rachel — `21m00Tcm4TlvDq8ikWAM`) |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NOTION_CLIENT_ID` | Notion OAuth app ID (optional) |
| `NOTION_CLIENT_SECRET` | Notion OAuth app secret (optional) |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://conceptra.ai`) |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page (/)
│   ├── upload/               # Upload/process page (/upload)
│   ├── paper/[id]/           # Paper view with concept cards (/paper/:id)
│   ├── pack/[slug]/          # Shared study pack (/pack/:slug)
│   ├── dashboard/            # User dashboard (/dashboard)
│   └── api/
│       ├── process-paper/    # Main SSE processing pipeline
│       ├── generate-visual/  # Regenerate XAI SVG
│       ├── generate-notes/   # Regenerate/edit notes
│       ├── generate-quiz/    # Regenerate quiz questions
│       ├── generate-narration/ # Regenerate narration + audio
│       ├── evaluate-answer/  # Score short-answer quiz responses
│       ├── papers/[id]/      # Fetch a paper with all data
│       ├── share/            # Create/fetch shared packs
│       └── export/           # Markdown + Anki export
├── components/
│   ├── ConceptCard.tsx       # Main concept card with tabs
│   ├── XAIVisual.tsx         # SVG diagram renderer + fullscreen
│   ├── ClipPlayer.tsx        # Audio player + animated SVG clip
│   ├── NotesSection.tsx      # Editable structured notes
│   ├── QuizSection.tsx       # Adaptive quiz with MC + short answer
│   ├── UploadForm.tsx        # Paper upload with SSE progress
│   ├── ShareButton.tsx       # Share modal with social buttons
│   └── ExportMenu.tsx        # Export dropdown
├── lib/
│   ├── gemini.ts             # Gemini SDK wrapper
│   ├── prompts.ts            # All 5 Gemini prompts from spec
│   ├── supabase.ts           # Supabase client + admin client
│   ├── pdf-parser.ts         # PDF parsing, arXiv + DOI fetching
│   ├── elevenlabs.ts         # TTS + audio upload
│   └── utils.ts              # Helpers (spaced repetition, formatting)
└── types/
    └── index.ts              # All TypeScript types
```

---

## Day-by-Day Build Plan

### Day 1 — Core Loop ✅
- [x] Next.js 14 project with Tailwind, TypeScript
- [x] Supabase schema (7 tables + RLS)
- [x] Gemini API integration with all 5 prompts
- [x] PDF parser (PyMuPDF-compatible + pdf-parse fallback)
- [x] SSE processing pipeline
- [x] XAI visual generation (SVG via Gemini)
- [x] Notes generation

### Day 2 — WOW Features ✅
- [x] Quiz system (MC + short answer + Gemini evaluation)
- [x] Concept confidence scoring (Leitner spaced repetition)
- [x] ElevenLabs narration audio
- [x] Clip player (SVG + audio)
- [x] Shareable pack page
- [x] Markdown + Anki export

### Day 3 — Polish + Launch
- [ ] Add Supabase Auth (magic link + Google OAuth)
- [ ] Stripe freemium gate (3 papers free, £9/mo Pro)
- [ ] Test with 5 real papers
- [ ] Deploy to Vercel
- [ ] Submit to Product Hunt

---

## Deploy to Vercel

```bash
npx vercel
# Follow prompts, add all env vars in Vercel dashboard
```

**Important Vercel settings:**
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Function timeout: 300s (for paper processing)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Framer Motion |
| AI | Google Gemini (default: gemini-2.5-flash) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| PDF Parsing | pdf-parse (npm) / PyMuPDF (Python sidecar) |
| TTS | ElevenLabs API |
| Payments | Stripe |
| Deployment | Vercel |

---

*Conceptra · conceptra.ai · research papers, finally understood*
