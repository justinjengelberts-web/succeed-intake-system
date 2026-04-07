# Succeed – Intelligent Intake System

## Project Context
Technical assessment for Lead Engineer position at Succeed. Stage 2: build a working system that processes messy inbound enquiries into structured, prioritized outputs with clear next actions.

Succeed connects students with enrichment programmes (summer schools, bootcamps, academic programmes). They receive inbound enquiries from programme providers, schools, students, and other organizations.

## What We're Building
A multi-step intake processing pipeline:
1. **Extraction** — parse raw messages into structured data (sender type, programme details, contact info, intent)
2. **Scoring** — priority score based on value signals (fee mentioned, target audience fit, partnership intent, completeness)
3. **Action routing** — determine next step (schedule call, request info, flag as spam, archive)
4. **Follow-up generation** — draft contextual response per enquiry

## Architecture
- **Automation layer:** n8n (self-hosted or cloud) as the orchestration backbone
- **Custom logic:** TypeScript/Node.js scoring + extraction module (AI-assisted)
- **AI integration:** LLM for message parsing and follow-up generation
- **Output:** Google Sheets as source of truth

## Tech Stack
- n8n (workflow automation)
- TypeScript / Node.js (custom logic)
- Claude API or OpenAI API (LLM for extraction + follow-up generation)
- Google Sheets API (output)

## Requirements Checklist
- [ ] Working flow: input → structured data → score → action → follow-up
- [ ] At least 2 tools working together
- [ ] Automation layer (n8n)
- [ ] At least 1 custom logic component built with AI coding tool
- [ ] AI used meaningfully (not just a single catch-all)
- [ ] Source of truth output (Google Sheets)
- [ ] Handles incomplete data gracefully
- [ ] Identifies spam
- [ ] Doesn't break on unexpected input
- [ ] 5-10 min Loom walkthrough

## Prompt Log

All prompts used during development are logged below with their English translation and rationale.

### Session 1 — 2026-04-07

**Prompt 1 (project setup):**
- NL: "Lijkt me dat we even een andere map moeten gaan werken om dit te gaan bouwen met een Claude.md die al mijn prompts logt en wellicht omdat ik in NL prompt ook de Engelse tegenhanger"
- EN: "We should work in a separate directory for this, with a CLAUDE.md that logs all my prompts and since I prompt in Dutch, also include the English equivalent"
- Rationale: Clean separation from main project. Prompt logging required by submission guidelines — they want to see how I directed the AI, not just the output.

## Scoring Logic (design notes)

Priority score 0-100 based on weighted factors:
- **Completeness** (0-25): contact info, programme details, audience, pricing
- **Value signals** (0-30): fee mentioned, established programme, international reach, institutional sender
- **Platform fit** (0-25): target audience matches Succeed's focus (students, enrichment, academic programmes)
- **Intent clarity** (0-20): clear partnership intent, specific ask, actionable next step

### Score → Action mapping:
- 80-100: High priority → schedule call, draft enthusiastic response
- 50-79: Medium priority → request missing info, draft clarifying response
- 20-49: Low priority → flag for manual review, draft polite decline or info request
- 0-19: Spam/irrelevant → archive, no response

## File Structure
```
succeed-intake-system/
├── CLAUDE.md              # This file — project context + prompt log
├── README.md              # Submission documentation
├── src/
│   ├── extract.ts         # Message extraction logic
│   ├── score.ts           # Scoring engine
│   ├── classify.ts        # Spam detection + sender classification
│   ├── followup.ts        # Follow-up message generation
│   └── types.ts           # Shared types
├── n8n/
│   └── workflow.json      # Exported n8n workflow
├── test/
│   └── examples.ts        # Test with the 5 provided examples
└── package.json
```
