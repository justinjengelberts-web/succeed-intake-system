# Succeed – Intelligent Intake System

## Assignment Brief
Full assignment brief: [docs/assignment-brief.md](docs/assignment-brief.md)

## Scope Guard
**IMPORTANT:** This is a 90-minute technical assessment. If any work goes beyond the following scope, STOP and flag it to the user:
- Multi-step pipeline: extract → score → route → follow-up → output. That's it.
- Supabase Edge Function as the automation layer (n8n equivalent)
- Claude API for extraction + follow-up only
- Deterministic TypeScript scoring engine (the custom logic component)
- Google Sheets as source of truth output
- Pipeline logging to Supabase table
- Must handle the 5 provided test examples

**OUT OF SCOPE — flag if we drift here:**
- User auth, dashboards, or UI
- Multiple endpoints or CRUD operations
- Database beyond the single logging table
- Batch processing or queuing
- Deployment automation / CI/CD
- Production hardening (rate limiting, retries, monitoring)
- Any feature not required by the assignment brief

## Project Context
Technical assessment for Lead Engineer position at Succeed. Stage 2: build a working system that processes messy inbound enquiries into structured, prioritized outputs with clear next actions.

Succeed connects students with enrichment programmes (summer schools, bootcamps, academic programmes). They receive inbound enquiries from programme providers, schools, students, and other organizations.

## What We're Building
A multi-step intake processing pipeline:
1. **Extraction** — LLM parses raw message into structured data (sender type, programme details, contact info, intent)
2. **Scoring** — deterministic TypeScript scoring engine (no LLM, rule-based so it's explainable)
3. **Action routing** — score → action mapping with clear thresholds
4. **Follow-up generation** — LLM drafts contextual response based on score + structured data
5. **Output** — writes to Google Sheets (source of truth) + logs every step to Supabase table

## Architecture

```
POST /functions/v1/succeed-intake
         │
         ▼
   ┌─ Step 1: Extract (LLM) ──────────── log to succeed_intake_log
   │    structured fields: sender_type, programme_type, audience,
   │    fee, contact_info, intent, completeness_flags
   │
   ├─ Step 2: Score (TypeScript) ──────── log to succeed_intake_log
   │    deterministic rules, no LLM
   │    completeness + value_signals + platform_fit + intent_clarity
   │
   ├─ Step 3: Route (TypeScript) ──────── log to succeed_intake_log
   │    score → action + priority label
   │
   ├─ Step 4: Follow-up (LLM) ─────────── log to succeed_intake_log
   │    contextual response draft (only for score > 19)
   │
   └─ Step 5: Output ─────────────────── Google Sheets row
         all fields: raw_input, structured_data, score,
         score_breakdown, action, follow_up_message
```

### Why this architecture
- **Supabase Edge Function** as automation layer (equivalent to n8n — the assignment says "or equivalent"). It's a single webhook endpoint that orchestrates the multi-step flow. More transparent than a visual workflow builder: every step is code, auditable, versionable.
- **LLM for extraction + follow-up** (steps that benefit from language understanding). NOT for scoring — that's deterministic so we can explain exactly why something scored the way it did.
- **Deterministic scoring** — rule-based TypeScript. This is a deliberate choice: when someone asks "why did this score 85?", we can point to exact factors, not "the AI thought so". This is the custom logic component.
- **`succeed_intake_log` table** — logs every pipeline step with timestamps, input/output, duration. This is the "show your work" for the submission. Reviewers can see the full trace of how each message was processed.
- **Google Sheets** — source of truth output as required. One row per enquiry with all fields visible.

### Infrastructure
Wired to the existing LeadHub CRM Supabase project (shared Supabase backend). The edge function and table are self-contained — no dependencies on other LeadHub features.

## Tech Stack
- Supabase Edge Functions (Deno/TypeScript) — automation + orchestration
- TypeScript — custom scoring logic (deterministic, AI-assisted development)
- Anthropic Claude API — extraction + follow-up generation
- Google Sheets API — output/source of truth
- Supabase PostgreSQL — pipeline logging (`succeed_intake_log` table)

## Requirements Checklist
- [ ] Working flow: input → structured data → score → action → follow-up
- [ ] At least 2 tools working together (Supabase Edge Functions + Claude API + Google Sheets)
- [ ] Automation layer (Supabase Edge Function as webhook orchestrator)
- [ ] At least 1 custom logic component built with AI coding tool (scoring engine)
- [ ] AI used meaningfully (extraction + follow-up, NOT scoring)
- [ ] Source of truth output (Google Sheets)
- [ ] Handles incomplete data gracefully
- [ ] Identifies spam
- [ ] Doesn't break on unexpected input
- [ ] 5-10 min Loom walkthrough

## Database

### `succeed_intake_log` table
```sql
CREATE TABLE succeed_intake_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL,           -- groups all steps for one enquiry
  step TEXT NOT NULL,                  -- 'extract' | 'score' | 'route' | 'followup' | 'output'
  input JSONB,                        -- what went into this step
  output JSONB,                       -- what came out
  duration_ms INTEGER,                -- how long this step took
  error TEXT,                         -- null if success
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_intake_log_enquiry ON succeed_intake_log(enquiry_id);
```

## Scoring Logic (design notes)

Priority score 0-100 based on weighted factors:
- **Completeness** (0-25): contact info, programme details, audience, pricing
- **Value signals** (0-30): fee mentioned, established programme, international reach, institutional sender
- **Platform fit** (0-25): target audience matches Succeed's focus (students, enrichment, academic programmes)
- **Intent clarity** (0-20): clear partnership intent, specific ask, actionable next step

### Score → Action mapping:
- 80-100: `schedule_call` — High priority. Draft enthusiastic response proposing a call.
- 50-79: `request_info` — Medium priority. Draft response requesting missing details.
- 20-49: `manual_review` — Low priority. Flag for human review, draft polite response.
- 0-19: `archive` — Spam/irrelevant. No response generated.

## File Structure
```
succeed-intake-system/
├── CLAUDE.md                           # This file — project context + prompt log
├── README.md                           # Submission documentation
├── supabase/
│   └── functions/
│       └── succeed-intake/
│           ├── index.ts                # Edge function: orchestrator
│           ├── extract.ts              # LLM extraction step
│           ├── score.ts                # Deterministic scoring engine
│           ├── route.ts                # Score → action mapping
│           ├── followup.ts             # LLM follow-up generation
│           ├── sheets.ts              # Google Sheets output
│           └── types.ts               # Shared types
├── supabase/
│   └── migrations/
│       └── 200_succeed_intake_log.sql  # Logging table
├── test/
│   └── examples.ts                     # Test with the 5 provided examples
└── package.json
```

## Prompt Log

All prompts used during development are logged below with their English translation and rationale. This is required by the submission — they want to see how I directed the AI, not just the output.

### Session 1 — 2026-04-07

**Prompt 1 (project setup):**
- NL: "Lijkt me dat we even een andere map moeten gaan werken om dit te gaan bouwen met een Claude.md die al mijn prompts logt en wellicht omdat ik in NL prompt ook de Engelse tegenhanger"
- EN: "We should work in a separate directory for this, with a CLAUDE.md that logs all my prompts and since I prompt in Dutch, also include the English equivalent"
- Rationale: Clean separation from main project. Prompt logging required by submission guidelines — they want to see how I directed the AI, not just the output.

**Prompt 2 (architecture decision):**
- NL: "Ik mocht zelf equivalenten gebruiken van N8N dus ik denk om dit met Edge functions van Supabase te doen, maar ik heb al twee hobby projecten, kan ik het gewoon wiren aan mijn leadhubcrm supabase project? Wellicht dat ze dan wel ook ergens de logging van de backend structuur willen neerzetten"
- EN: "The assignment allows n8n equivalents, so I'm thinking Supabase Edge Functions. I already have two hobby projects on Supabase free tier — can I wire it to my LeadHub CRM project? They might also want to see backend logging somewhere."
- Rationale: Supabase Edge Functions are a more transparent automation layer than n8n — every step is code, not a visual drag-and-drop. Reusing the existing Supabase project avoids free-tier limits. Added `succeed_intake_log` table for full pipeline traceability — reviewers can inspect every step.

**Prompt 3 (assignment brief + scope guard):**
- NL: "setup a private repo... here is the context: [full assignment brief]. Put this in a .md file, update CLAUDE.md to reference it, setup an alert if we go out of scope. After this I want to brainstorm."
- EN: Same — user provided the full assignment text and asked to save it, add scope guard, and brainstorm before building.
- Rationale: Save the assignment as a reference doc. Add explicit scope boundaries in CLAUDE.md so we don't over-engineer a 90-minute assessment. Brainstorm first to align on vision before writing code.
