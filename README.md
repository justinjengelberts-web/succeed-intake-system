# Succeed Intelligent Intake System

Technical assessment submission — a multi-step pipeline that processes messy inbound enquiries into structured, prioritized outputs with clear next actions.

## How It Works

```
POST /functions/v1/succeed-intake { "message": "..." }
         |
    1. Extract (Claude API) — parse raw message into structured fields
    2. Score (TypeScript)   — deterministic 0-100 scoring, no LLM
    3. Route (TypeScript)   — score → action + priority label
    4. Follow-up (Claude API) — contextual response draft (score >= 20 only)
    5. Output              — append row to Google Sheets + log to Supabase
```

## Tools Used

| Tool | Role |
|------|------|
| **Supabase Edge Functions** | Automation layer (n8n equivalent) — single webhook orchestrating the pipeline |
| **Claude API (Sonnet 4)** | LLM extraction of structured data + follow-up message generation |
| **Google Sheets** | Source of truth output — one row per enquiry with all fields |
| **Supabase PostgreSQL** | Pipeline logging (`succeed_intake_log`) — full trace of every step |

## Custom Logic: Scoring Engine

The scoring engine (`supabase/functions/succeed-intake/score.ts`) is a deterministic, rule-based TypeScript module — no LLM involved. This is intentional: when someone asks "why did this score 85?", we can point to exact factors rather than "the AI thought so."

**Four weighted dimensions (0-100 total):**
- **Completeness (0-25):** contact info, programme details, audience, pricing
- **Value signals (0-30):** fee level, programme type, institutional sender, .edu domain
- **Platform fit (0-25):** age range match, student-focused audience, relevant subject
- **Intent clarity (0-20):** partnership intent, actionable next step

**Score-to-action mapping:**
| Score | Action | Priority |
|-------|--------|----------|
| 80-100 | `schedule_call` | High |
| 50-79 | `request_info` | Medium |
| 20-49 | `manual_review` | Low |
| 0-19 | `archive` | None (no follow-up) |

## Running the Tests

The test script fires all 5 assignment examples at the deployed edge function:

```bash
export SUCCEED_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/succeed-intake
export SUPABASE_ANON_KEY=<your-key>
deno run --allow-net --allow-env test/examples.ts
```

> Note: The edge function is deployed with `--no-verify-jwt` because Supabase's newer key format (`sb_publishable_`/`sb_secret_`) is not a JWT. The key is sent via the `apikey` header.

## File Structure

```
supabase/functions/succeed-intake/
  index.ts        — orchestrator: parses input, runs all steps, returns result
  extract.ts      — LLM extraction: raw message → structured data
  score.ts        — deterministic scoring engine (custom logic component)
  route.ts        — score → action/priority mapping
  followup.ts     — LLM follow-up generation (tone-calibrated by score)
  sheets.ts       — Google Sheets output (service account JWT auth)
  types.ts        — shared TypeScript interfaces

supabase/migrations/
  200_succeed_intake_log.sql  — pipeline logging table

test/
  examples.ts     — runs all 5 assignment examples end-to-end
```

## Design Decisions

**Why Supabase Edge Functions instead of n8n?** Every step is code — auditable, versionable, testable. More transparent than a visual workflow builder for a technical assessment.

**Why deterministic scoring instead of LLM?** Explainability. Each point in the score maps to a specific rule. This matters when prioritizing real partnership opportunities.

**Why LLM for extraction and follow-up only?** These are the steps that genuinely benefit from language understanding. Scoring and routing are better served by explicit rules you can inspect and tune.

## AI Prompts

All prompts used during development are logged in `CLAUDE.md` with the original Dutch prompt, English translation, and rationale for each decision.
