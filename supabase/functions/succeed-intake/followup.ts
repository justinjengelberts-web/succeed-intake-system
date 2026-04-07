import type { ExtractedData, ScoreBreakdown, RouteResult } from "./types.ts";

/**
 * Generates a contextual follow-up message using Claude API.
 * Only called when score >= 20 (no follow-up for archived/spam).
 */
export async function generateFollowUp(
  extracted: ExtractedData,
  scoreResult: ScoreBreakdown,
  routeResult: RouteResult,
  apiKey: string
): Promise<string | null> {
  // Build programme summary
  const parts: string[] = [];
  if (extracted.programme.type) parts.push(`Type: ${extracted.programme.type}`);
  if (extracted.programme.subject) parts.push(`Subject: ${extracted.programme.subject}`);
  if (extracted.programme.location) parts.push(`Location: ${extracted.programme.location}`);
  if (extracted.programme.fee) {
    parts.push(`Fee: ${extracted.programme.fee_currency || ""}${extracted.programme.fee}`);
  }
  if (extracted.programme.audience_description) {
    parts.push(`Audience: ${extracted.programme.audience_description}`);
  }
  const programmeSummary = parts.length > 0 ? parts.join(", ") : "No programme details provided";

  // Build missing fields list
  const missing: string[] = [];
  if (!extracted.completeness_flags.has_contact_info) missing.push("contact information");
  if (!extracted.completeness_flags.has_programme_details) missing.push("programme details");
  if (!extracted.completeness_flags.has_audience) missing.push("target audience details");
  if (!extracted.completeness_flags.has_pricing) missing.push("pricing/fee information");
  if (!extracted.completeness_flags.has_clear_intent) missing.push("specific partnership goals");
  const missingFields = missing.length > 0 ? missing.join(", ") : "None";

  // Use contact name if available, otherwise default greeting
  const greeting = extracted.contact_info.name
    ? `Dear ${extracted.contact_info.name},`
    : "Hi there,";

  const prompt = `You are writing on behalf of Succeed, a platform that connects students with enrichment programmes (summer schools, bootcamps, academic programmes).

Draft a follow-up email. Be direct — every sentence must earn its place. No filler phrases like "We appreciate you considering", "Please feel free to", or "Thank you for reaching out about your". Open with something specific to their enquiry, not a generic thank-you.

ACTION: ${routeResult.action}
PRIORITY: ${routeResult.priority_label}
SENDER TYPE: ${extracted.sender_type}
PROGRAMME: ${programmeSummary}
SCORE: ${scoreResult.total}/100
MISSING INFO: ${missingFields}

Tone calibration — match enthusiasm to the score:
- Score 80-100: Genuinely excited. You want this partnership. Be specific about why.
- Score 50-79: Interested and warm. Show you've read their message carefully.
- Score 20-49: Polite and brief. Acknowledge, set expectations, don't oversell.

Guidelines based on action:
- schedule_call: Propose a specific next step (call/meeting). Reference their programme details — show you paid attention.
- request_info: Ask for the 2-3 most important missing details. Be specific about what we need and why.
- manual_review: Brief acknowledgement, set a timeline expectation (3-5 business days). Don't pad with corporate filler.

Start the email with exactly: "${greeting}"
80-120 words maximum. Do not include a subject line. Sign off as "The Succeed Team". Never output placeholder brackets like [Name] or [Contact]. Never use em-dashes (—) — use commas, periods, or restructure the sentence instead.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    console.error(`Claude API error (followup): ${response.status}`);
    return null;
  }

  const result = await response.json();
  return result.content?.[0]?.text || null;
}
