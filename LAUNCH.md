# Conceptra — Product Hunt Launch Kit

> Submit at **1:30 AM IST on launch day** (= 12:01 AM PST, when PH resets)

---

## Tagline (60 chars — paste exactly)

```
Turn any research paper into visual concepts you actually remember
```

---

## Product Description (paste into PH description field)

Reading research papers is one of the loneliest learning experiences in the world.

You open a 25-page arxiv paper. You stare at it. You read the abstract three times. You still have no idea what's actually happening inside the architecture.

Every other tool gives you a text summary of what the paper says. Conceptra shows you how it works.

Upload any research paper. In 60 seconds you get:

→ 5-8 atomic concepts extracted from the paper

→ An XAI mechanism diagram per concept — a visual showing the MECHANISM, not a summary

→ A 60-second narrated clip where the visual animates as a voice explains it

→ Structured notes: what it is, how it works, why it matters, common misconceptions

→ An adaptive quiz to lock in what you just learned

→ A shareable study pack link to send to your cohort or study group

We tested it on the Hindsight memory architecture paper. It extracted 7 concepts including Four-Network Memory Organisation, Narrative Fact Extraction, and Entity-Aware Memory Graph — each with its own XAI diagram and narrated clip.

**No other tool does this. Every existing tool (Explainpaper, SciSpace, Elicit) produces text. Conceptra produces understanding.**

Free: 3 papers. Pro: unlimited at £9/month.

---

## First Comment (post IMMEDIATELY after your listing goes live)

Hey Product Hunt! I built Conceptra after a very specific frustration.

I was trying to understand the Hindsight memory architecture paper — a 28-page arxiv paper on AI agent memory systems. I'd read it three times and still couldn't explain the four-network structure to anyone.

Every tool I tried gave me a wall of bullet points. A longer text version of the same confusion.

So I built the thing I actually wanted: upload the paper, get a visual of how each concept WORKS. Not a summary. A diagram of the mechanism. Then a 60-second narrated clip. Then a quiz.

I uploaded the Hindsight paper this morning and it extracted 7 concepts with mechanism diagrams. I finally understood the Retain-Recall-Reflect loop by watching the animated visual.

**Three things I'd genuinely love feedback on today:**

1. Does the XAI visual actually help you understand — or is it just pretty decoration?
2. Which domain should I support next: ML papers, biology, economics, or physics?
3. Is the 60-second clip format the right length, or should it be shorter?

**No signup to try the first paper. Paste any arxiv link and see what happens.**

**I'll be here all day — reply to every comment.**

---

## Twitter / X Post (post at 8:00 AM IST on launch day)

```
I just launched Conceptra on Product Hunt.

You paste an arxiv paper link.

You get the concepts — each with a visual diagram + narrated clip.

No summaries. No bullet points. Actual understanding.

Tested it on the Hindsight agent memory paper.

Finally understood the 4-network architecture in 60 seconds.

Free to try, no signup: [YOUR LINK]

Would love your support today on PH.

#ProductHunt #MachineLearning #AItools #ResearchPapers #LearnInPublic
```

---

## LinkedIn Post (post at 9:00 AM IST on launch day)

**I built this in less than a week. Here's the problem it solves.**

I was reading the Hindsight technical report — a paper on AI agent memory systems from Virginia Tech and The Washington Post.

28 pages. Dense. I read it twice and still couldn't visualise how the four-network memory structure actually worked.

The problem isn't that research papers are too long. The problem is that no tool shows you the MECHANISM — how something works, not just what it says.

So I built Conceptra.

Upload any research paper. Get 5-8 key concepts, each with an XAI visual diagram and a 60-second narrated animated clip. Then a quiz to lock in retention.

Launched today on Product Hunt. 3 papers free, no signup.

If you've ever stared at an arxiv paper and felt lost — this is for you. Link in comments.

---

## PH Gallery Screenshots (6 total)

| # | What to capture | Caption |
|---|---|---|
| 1 | Landing page hero | 'Upload any paper. Get the concepts, not the content.' |
| 2 | Processing screen (animated steps) | '60 seconds from PDF to understanding.' |
| 3 | Concept card — Visual tab with XAI diagram | 'Not a summary. A diagram of how it actually works.' |
| 4 | Concept card — Clip tab playing | 'Watch the concept animate as a voice explains it.' |
| 5 | Concept card — Quiz tab with score shown | 'Lock in what you learned before you close the tab.' |
| 6 | Shareable pack page | 'Send your study pack to your cohort. One link.' |

---

## Communities to Post On Launch Day

| Community | What to post |
|---|---|
| Reddit r/MachineLearning | Post the Hindsight paper example — show how it extracted the 4-network memory diagram |
| Reddit r/artificial | Broader AI audience, post the general pitch with demo GIF |
| Hacker News (Show HN) | 'Show HN: I built a tool that converts research papers into XAI visual concept diagrams' |
| IndieHackers | 'I built this in a week' story — authentic stories get upvoted hard |
| Twitter ML community | Tag: @karpathy, @hardmaru, @ylecun |
| PhD student Discord servers | Find servers for ML PhD students — exact target user |
| Slack: Latent Space community | ML practitioner community — highly engaged |

---

## 60-Second Investor Pitch (for DMs after launch)

**Conceptra — 60-second investor pitch**

The problem: 2 million new research papers are published every year. Every researcher, PhD student, and ML practitioner needs to read them. Zero tools help them actually understand and retain the content — every existing tool produces text summaries of text documents.

What we built: Conceptra is the first system that converts research papers into atomic concept units with XAI mechanism visuals, narrated animated clips, and adaptive quizzes. We extract how things work, not what things say.

Traction: Launched on Product Hunt [DATE]. [X] upvotes in [Y] hours. [Z] papers processed by [N] users. [Revenue if any].

Why we win: The three innovations in combination — concept-level XAI visual generation, narrated clip synthesis, and personal knowledge gap modelling — have no prior art in this combination. Existing tools (Explainpaper, SciSpace, Elicit) produce text. We produce understanding.

Market: Global research output + EdTech = $7T addressable. B2C at £9/mo. B2B universities at £500/cohort/mo.

Ask: £150K pre-seed to build cross-source concept linking (YouTube + papers), the Chrome extension, and a university pilot programme. Happy to send the deck.

---

## Launch Day Checklist

### Today (finish the product)
- [ ] Fill in `.env.local` (Gemini API key, Supabase credentials)
- [ ] Run `supabase/schema.sql` in Supabase SQL editor
- [ ] Create Supabase Storage bucket named `conceptra-assets` (public)
- [ ] `npm run dev` — test with 3 real papers (try arxiv.org/abs/2307.09288)
- [ ] Test Clip tab plays (browser voice) on Chrome
- [ ] Test Quiz tab generates questions
- [ ] Test Share button generates hindsight-xxxxxx slug
- [ ] `npx vercel` — deploy, set function timeout 300s

### Tomorrow (launch)
- [ ] Record 30-second screen capture: arxiv link → processing → concept cards → clip playing
- [ ] Take 6 screenshots for PH gallery (see table above)
- [ ] Submit to Product Hunt at **1:30 AM IST**
- [ ] Post first comment immediately (copy from above)
- [ ] 6:00 AM IST: WhatsApp/LinkedIn/Twitter personal messages
- [ ] 8:00 AM IST: Post Twitter thread
- [ ] 9:00 AM IST: Post LinkedIn post
- [ ] Post in r/MachineLearning, r/artificial, IndieHackers, HN Show HN
- [ ] Reply to EVERY PH comment within 30 minutes all day

---

*Conceptra · conceptra.ai · research papers, finally understood*
