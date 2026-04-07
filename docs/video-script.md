# Video Script (~7 minutes)

Golden rules: one idea per section. Show first, explain while they look. Pause after key moments. Never read bullet points aloud.

---

## Before you hit record

Open these in order so you can tab between them naturally:
1. Code editor — `index.ts` visible
2. Terminal — `bash test/run-examples.sh` typed but not yet run
3. Google Sheet — empty, wiped
4. This script — second monitor, not visible to recording

---

## 1. Hook them in 15 seconds

> SHOW: Code editor with index.ts

"So the problem is: Succeed gets messy inbound enquiries, everything from Oxford deans to LinkedIn spam, and they all land in the same inbox. I built a system that reads them, figures out what they're worth, and drafts the right response automatically. Let me show you how."

*Why this works: you stated the problem and promised a demo in under 15 seconds. They're hooked.*

---

## 2. Walk the pipeline (~1 min)

> SHOW: Scroll slowly through index.ts, pause on each step call

Don't list all five steps mechanically. Walk it like a story:

"A message comes in as a POST request. First, Claude reads it and extracts structure: who's this from, what are they offering, is there contact info. That structured data then goes into a scoring engine, and this is important, the scoring is pure TypeScript. No AI. I'll come back to why.

The score determines what happens next: is this a call-worthy lead, do we need more info, or is it spam we should ignore? If it's worth responding to, Claude drafts a follow-up that matches the situation. Everything lands in Google Sheets and every step gets logged."

*Point at the code as you mention each step. Don't read function names, just gesture.*

---

## 3. Run it live (~1 min)

> SHOW: Switch to terminal

"Let's run all five assignment examples against the live endpoint right now."

Hit enter. While it runs:

"Each request hits the Supabase Edge Function, goes through all five steps, and writes a row to the Google Sheet. You'll see the scores and actions come back in the terminal."

*Let the output print. Don't talk over every line. Let them read. When the last one finishes:*

"All five processed. Let's look at what landed in the sheet."

---

## 4. The Oxford dean — end to end (~1.5 min)

> SHOW: Switch to Google Sheet. Scroll to the Oxford row.

"This is the one I want to walk through properly. Someone writes in saying they run a highly selective economics programme at Oxford, six thousand pounds, and they leave a dean@oxford-econ.edu email.

Look at what the system did with that."

*Pause. Let them see the row. Then walk through it naturally:*

"It identified this as a programme provider, extracted economics, Oxford, the fee, the email. Score: 87 out of 100. And you can see exactly why here in the factors column: ten points for the high fee, eight for being an academic programme, six for the institutional email domain, twelve for implied student audience.

Action: schedule a call. And the follow-up starts with 'Dear Dean' because it inferred the role from the email prefix. The response proposes a specific call, it references their programme, and it doesn't mention any internal scoring."

---

## 5. How it handles the bad ones (~1 min)

> SHOW: Scroll to spam row, then school counsellor row

"Now the other end. This LinkedIn spam message: scored zero, archived, no follow-up generated. The system doesn't waste time on it.

This one's more interesting though."

*Scroll to school counsellor row.*

"A school counsellor looking for medicine enrichment. This isn't someone offering a programme, they're looking for one. That's a fundamentally different conversation. The system recognises that and instead of saying 'we're reviewing your enquiry', which would be meaningless because there's nothing to review, it actually helps them. Points them toward medicine programmes, asks practical questions like student numbers and timing."

*This is your strongest moment. The supply-side vs demand-side distinction shows real thinking.*

---

## 6. The responses actually differ (~45s)

> SHOW: Scroll through follow-up column across all rows

"Quick comparison of the follow-ups. Oxford gets enthusiasm and a call proposal. Barcelona gets warmth and a request for contact details so we can move forward. The school counsellor gets genuine help finding programmes. The bootcamp gets an honest 'we need more details'. And spam gets nothing.

Every response is something Succeed could actually send. No corporate filler, no hallucinated statistics about the platform."

---

## 7. Why I kept scoring out of the AI (~1 min)

> SHOW: Switch to editor, open score.ts

"So the design decision I want to talk about. I could have asked Claude to score everything in one pass, extraction and scoring together. That would have been faster to build.

But then when someone asks 'why did Oxford score 87?', the answer is 'the AI thought so'. That's not good enough for a system that decides who gets a call back.

With deterministic rules, every single point traces to a specific factor."

*Scroll to the factors section of the code.*

"Plus ten for a fee above three thousand. Plus twelve for an academic programme from an institutional sender. Plus six for an .edu email. That's auditable. And if Succeed's priorities change next quarter, you change a rule, you don't rewrite a prompt and hope it behaves."

---

## 8. Close it (~20s)

> SHOW: Whatever feels natural — sheet, code, or just you

"Everything is in the repo: the full code, a prompt log of every AI prompt I used with the original Dutch, English translation, and my reasoning. The system handles all five examples, differentiates quality, and produces output you could actually use. Thanks for watching."

*Stop recording.*
