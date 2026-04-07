# Screenrecording Script (~7 minutes)

Have these open before recording:
- Google Sheet (empty, wiped)
- Code editor with the repo open
- Terminal ready to run the test script
- Supabase dashboard (succeed_intake_log table)

---

## 1. Intro (~30s)

"This is my submission for the intelligent intake system. I'll walk through how it works, run it live, and explain a key design decision."

## 2. Architecture Overview (~1min)

Show `index.ts` in the editor. Walk through the 5 steps briefly:

"The system is a single Supabase Edge Function that runs a 5-step pipeline:
1. **Extract** — Claude parses the raw message into structured data
2. **Score** — deterministic TypeScript engine, no AI, scores 0 to 100
3. **Route** — maps the score to an action: schedule a call, request info, manual review, or archive
4. **Follow-up** — Claude drafts a response, but only if the score is 20 or above. Spam gets nothing.
5. **Output** — writes everything to Google Sheets"

"Every step also logs to a Supabase table so you can trace exactly what happened."

## 3. Tools Working Together (~30s)

"Three tools working together: Supabase Edge Functions as the automation layer, Claude API for extraction and follow-up, and Google Sheets as the source of truth. The Supabase database handles pipeline logging."

## 4. Run It Live (~1min)

Switch to terminal. Run the test script:

```
deno run --allow-net --allow-env test/examples.ts
```

"I'm running all 5 assignment examples against the live endpoint."

Let it run. While it processes, briefly mention what's happening.

## 5. High-Quality Input End-to-End (~1.5min)

Switch to Google Sheet after the run completes. Find Example 4 (Oxford Economics).

"Let's trace a high-value input end-to-end. This is the Oxford economics programme — fee of 6000 pounds, contact from a dean with an .edu email."

Walk through the row:
- **Structured data:** sender type, programme type, subject, location, fee, contact email — all extracted correctly
- **Score:** should be 80+ — point out the breakdown column and individual factors
- **Action:** `schedule_call`, high priority
- **Follow-up message:** read it out — should be enthusiastic, reference their programme specifically, propose a call

## 6. Problematic Input (~1min)

Find Example 3 (LinkedIn spam) in the sheet.

"Now the spam example. The system flagged it as spam, scored it 0, action is archive, no follow-up generated. It doesn't waste time on irrelevant messages."

Optionally also show Example 2 (incomplete — school counsellor): "This one is incomplete. No programme details, no pricing, no contact info. Score is lower, action is manual review or request info, and the follow-up asks for the specific missing details."

## 7. Follow-Up Message Quality (~1min)

Compare two follow-ups side by side in the sheet:
- High-value (Oxford): enthusiastic, references their programme, proposes a call
- Medium (Barcelona AI or incomplete): warmer but asks for missing info

"The follow-ups are tone-calibrated. High-value gets enthusiasm and a specific next step. Incomplete gets a polite request for what's missing. Spam gets nothing."

## 8. Design Decision Trade-Off (~1min)

Show `score.ts` briefly in the editor.

"The key trade-off: I deliberately kept scoring out of the LLM. It would have been faster to ask Claude to score everything in one pass, but then you can't explain why something scored 85. With deterministic rules, every point maps to a specific factor: '+10 high fee', '+12 age range fits Succeed', '+6 institutional email'. That's auditable and tunable. If Succeed's priorities change, you adjust a rule, not a prompt."

## 9. Wrap-Up (~20s)

"Full prompt log is in the repo — every prompt I gave the AI with rationale. The system handles all 5 examples, differentiates quality, and produces actionable output. Thanks for reviewing."

---

## Tips
- Keep it conversational, not scripted-sounding
- Don't read code line by line — point at sections and explain the concept
- If something takes a moment to load, narrate what's happening
- Total target: 6-8 minutes
