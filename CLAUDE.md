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

### Session 2 — 2026-04-07

**Prompt 4 (deploy + push):**
- NL: "git push" / "commit first"
- EN: "Commit all project files and push to remote."
- Rationale: Get the full project structure into version control. AI handled staging, commit message, and push.

**Prompt 5 (Google Sheets debugging):**
- NL: "great I believe there were some issues I had not provided the right sheets ID and I had to assign certain rights or share with the sheets e-mail can you check"
- EN: "Check the Google Sheets integration — I think the Sheets ID is wrong and I need to share with the service account email."
- Rationale: Identified two issues: (1) Sheets ID was a numeric value instead of the alphanumeric ID from the URL, (2) the private key was missing its PEM header. Also needed to share the sheet with the service account email as Editor.

**Prompt 6 (Sheets ID from URL):**
- NL: "I got the sheets id right here: /spreadsheets/d/*****/edit?gid=0#gid=0 But Is this the correct one... how do I know this is the one for the Service account"
- EN: "Is this the right sheet for the service account?"
- Rationale: Clarified that the Sheets ID is tied to the spreadsheet, not the account. The service account just needs Editor access via sharing.

**Prompt 7 (Supabase secrets):**
- NL: "run it" (referring to setting Supabase secrets)
- EN: "Set the Google Sheets secrets in Supabase Edge Functions."
- Rationale: Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY as Supabase secrets so the deployed edge function can access them.

**Prompt 8 (new API key format):**
- NL: "supabase has shifted to this new format of api keys so it is the correct key, how it does work correctly with their edge functions now, you should look up in their documentation"
- EN: "Supabase changed their API key format to sb_publishable_/sb_secret_ — look up how to use these with Edge Functions."
- Rationale: Researched Supabase docs and GitHub discussions. Found that new keys aren't JWTs, so Edge Functions must be deployed with `--no-verify-jwt` flag. The key goes in the `apikey` header instead of `Authorization: Bearer`.

**Prompt 9 (run tests):**
- NL: "Lets run it"
- EN: "Run all 5 test examples against the deployed edge function."
- Rationale: End-to-end validation of the full pipeline. All 5 examples processed correctly (extraction, scoring, routing, follow-ups). Identified Sheets write was still failing — traced to private key format issue and hardcoded "Sheet1" tab name (Dutch locale uses "Blad1"). Fixed both issues: re-set the private key with proper escaping, and added dynamic sheet tab name detection.

**Prompt 10 (output audit + response quality):**
- NL: "Can you edit the output and check against the requirements/scope of this project. Should I improve visibility of the sheet? Label titels and colouring, I see we have already setup replies as well are these done by Sonnet 4.6 with my anthropic api at the moment? Also audit these responses they look good but I would want to know if we should have added more instructions for the llm maybe based on /humanizer or /copywriting. Before changing any instructions please analyze and inform"
- EN: "Audit the sheet output against requirements, advise on formatting, confirm which model generates follow-ups, and audit the response quality — should we improve the LLM instructions?"
- Rationale: Comprehensive audit before making changes. Found: (1) sheet needed header row, (2) follow-ups use Claude Sonnet 4 via Anthropic API, (3) responses had issues: too long, generic AI openers, [Name] placeholder bug, no tone calibration by score. Recommended 3 surgical prompt fixes rather than a full rewrite.

**Prompt 11 (implement prompt improvements):**
- NL: "go ahead"
- EN: "Apply the recommended follow-up prompt improvements."
- Rationale: Three changes to followup.ts: (1) fixed [Name] placeholder by using extracted contact name or "Hi there", (2) tightened word count to 80-120 words with "every sentence must earn its place", (3) added score-based tone calibration (80+ = excited, 50-79 = warm, 20-49 = brief). Also added auto-header row to sheets.ts and sheets_error to API response. Verified all improvements with test runs — responses shorter, more specific, no placeholders.

**Prompt 12 (em-dash removal):**
- NL: "Can we make sure the llm refrains from using em-dashes."
- EN: "Add instruction to prevent em-dashes in follow-up responses."
- Rationale: Em-dashes are a telltale sign of AI-generated text. Added explicit instruction to the follow-up prompt: "Never use em-dashes — use commas, periods, or restructure the sentence instead."

**Prompt 13 (prompt log audit):**
- NL: "Where did you log all my prompts?"
- EN: "Check where prompts are being logged and ensure all session prompts are captured."
- Rationale: The assignment requires showing all AI prompts used. Prompt log in CLAUDE.md was behind — only had prompts 1-3 from initial setup. Updated with all prompts from this session.

### Session 3 — 2026-04-07

**Prompt 14 (evaluate against requirements):**
- NL: "I want to evaluate what we currently have against the assignment requirements"
- EN: "Evaluate the full codebase against the assignment brief requirements."
- Rationale: Systematic gap analysis before submission. Found: all core requirements met, but missing README.md, test script used old auth header format, no Loom video yet, no evidence of working output in repo.

**Prompt 15 (address gaps + video):**
- NL: "Let's address the gaps I will make a video but I imagine using OBS to screenrecord would be just fine too right?"
- EN: "Fix the identified gaps. Can I use OBS instead of Loom for the recording?"
- Rationale: OBS is fine — Loom is just their suggestion. Fixed test script auth header (Bearer → apikey for new Supabase key format). Created README.md with architecture, scoring logic, design decisions, and run instructions.

**Prompt 16 (video script + sheet wipe):**
- NL: "Can I also get a script for the screenrecording, and should I wipe the google sheet for visual impact"
- EN: "Write a video recording script and should I clear the Google Sheet before recording?"
- Rationale: Yes — wipe the sheet and run examples live on camera for maximum demo impact. Created docs/video-script.md covering all 6 points the assignment asks for in ~7 minutes.

**Prompt 17 (scoring + follow-up quality audit):**
- NL: "Should we not take into account that we got the dean of oxfords emailaddress in our response btw should we adress him, why do we score him so low this should be a perfect match right?"
- EN: "Why is Oxford scoring so low? We have the dean's email — we should address them properly."
- Rationale: Traced the Oxford score: platform_fit was only 5/25 because no explicit audience/age mentioned. Added implied platform fit boost (+12) for academic/summer_school programmes from institutional senders. Fixed greeting to use role ("Dear Dean,") when name is unavailable.

**Prompt 18 (full output evaluation):**
- NL: "This was just one of the cases. I think we should evaluate all, based on the assignment... [detailed analysis of Barcelona pricing question and school counsellor 'thorough review' issues]"
- EN: "Evaluate all 5 outputs against the assignment requirements. The follow-ups don't match what Succeed would actually send — Barcelona gets interrogated about pricing, school counsellor gets 'thorough review' corporate filler."
- Rationale: Fundamental issue: the follow-up prompt didn't distinguish supply-side (programme providers wanting to list) from demand-side (schools/students looking for programmes). Rewrote the prompt with explicit supply/demand routing. Supply-side gets partnership conversation, demand-side gets help finding programmes. Also bumped Oxford implied boost to 12 → score 87.

**Prompt 19 (greeting fixes):**
- NL: "Dear School Counsellor would be good I think and Dear Dean. Those would be professional right?"
- EN: "Confirm 'Dear School Counsellor' and 'Dear Dean' as greetings."
- Rationale: Both professional and appropriate. Fixed title-case for multi-word roles ("school counsellor" → "School Counsellor"). Added extraction prompt hint to infer role from email prefix (dean@ → role: "dean"). Deployed and verified: Oxford scores 87 with "Dear Dean,", school counsellor gets "Dear School Counsellor," with helpful medicine programme response.

**Prompt 20 (prompt log check):**
- NL: "Did you log my prompts in the claude.md"
- EN: "Check if the prompt log in CLAUDE.md is up to date with this session."
- Rationale: It wasn't — added all prompts from session 3 (prompts 14-20).
