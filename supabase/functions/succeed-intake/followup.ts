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

  const prompt = `You are writing on behalf of Succeed, a platform that connects students with enrichment programmes (summer schools, bootcamps, academic programmes).

Based on the enquiry analysis below, draft a concise follow-up email. The tone should be professional, warm, and action-oriented.

ACTION: ${routeResult.action}
PRIORITY: ${routeResult.priority_label}
SENDER TYPE: ${extracted.sender_type}
PROGRAMME: ${programmeSummary}
SCORE: ${scoreResult.total}/100
MISSING INFO: ${missingFields}

Guidelines based on action:
- schedule_call: Enthusiastic, propose a specific next step (call/meeting), mention what excites us about their programme. Be specific — reference their programme details.
- request_info: Polite, express interest, ask for the 2-3 most important missing details (be specific about what we need).
- manual_review: Acknowledging, say we're reviewing their enquiry, set expectation for timeline.

Keep the email under 150 words. Do not include a subject line. Sign off as "The Succeed Team".`;

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
