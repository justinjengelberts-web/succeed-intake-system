# Prompt Log

All prompts used during development, logged with the original Dutch, English translation, and rationale. This shows how I directed the AI throughout the build, not just the output.

## Session 1 — 2026-04-07 (Setup + Architecture)

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

## Session 2 — 2026-04-07 (Build + Debug + Polish)

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

## Session 3 — 2026-04-07 (Review + Quality Iteration)

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

**Prompt 21 (sensitive data audit):**
- NL: "Can we check the prompt log to mask environment variables/supabaseprojectids/googleserviceaccounts etc if these were shared just mask them with '*'"
- EN: "Check the prompt log for leaked secrets and mask them."
- Rationale: Found Google Sheets ID in prompt 6. Masked it. Verified no other secrets (project refs, API keys, service account emails) appear in any tracked file.

**Prompt 22 (follow-up hallucination fix):**
- NL: "the dean is met with a message containing this: 'An 87/100 score puts you among our top-tier partners' But he does not need to know about our internal lead scoring... also 'most partners see 40-60% of their places filled through our platform' how does the llm know this?"
- EN: "The follow-up leaks internal scores and invents statistics about Succeed. Fix the hallucinations."
- Rationale: Three issues: (1) score leaked to recipient, (2) fabricated Succeed metrics with no knowledge base, (3) sender's own words parroted back as compliments. Added strict rules: never mention scores, never invent facts, never parrot descriptors. Removed score from prompt context. Reduced word count to 50-90 to eliminate filler.

**Prompt 23 (knowledge base discussion):**
- NL: "Should we do a small research and spin up a small knowledge base to give the AI some more relevant context?"
- EN: "Should we build a knowledge base for more accurate follow-ups?"
- Rationale: Decided against it — out of scope for a 90-minute assessment. The real fix is constraining the LLM to only reference what it actually knows (sender's message + "Succeed connects students with enrichment programmes"). Production would warrant a knowledge base, but for this assessment it would be overengineering and scope creep.

**Prompt 24 (generic flattery fix):**
- NL: "'The combination of the subject and location makes this particularly compelling' — this seems very generic right?"
- EN: "The follow-up still uses vague compliments instead of saying something real."
- Rationale: The LLM had nothing specific left to say after we removed hallucinated claims, so it fell back to empty flattery. Fixed by rewriting tone calibration: high-priority responses now show enthusiasm through directness and urgency (proposing a call immediately) rather than adjectives.

**Prompt 25 (parroting fix):**
- NL: "'particularly the highly selective approach you've outlined' — this is weird again, I said this before right?"
- EN: "The LLM is still parroting 'highly selective' back as a compliment."
- Rationale: Added explicit rule: do not repeat the sender's own descriptors back as compliments — they already know what they told us. Focus on substance instead (subject, location, opportunity for students).

**Prompt 26 (resilience check):**
- NL: "Did we take this requirement into account: Resilience — handle missing data, identify spam, avoid breaking on unexpected input?"
- EN: "Verify the system meets all resilience requirements."
- Rationale: Tested edge cases live: empty JSON (400 error), malformed input (graceful fallback), emoji-only gibberish (scores 0, archived), very long input (processes normally), wrong HTTP method (405). All passed. Resilience fully covered.

**Prompt 27 (separate prompt log):**
- NL: "Can you separate the prompts log to a promptlog.md file, also update it with the latest prompts"
- EN: "Move the prompt log to its own file and add all missing prompts from this session."
- Rationale: Keeps CLAUDE.md focused on project context and architecture. Prompt log is now in docs/prompt-log.md with all 27 prompts from all 3 sessions.
