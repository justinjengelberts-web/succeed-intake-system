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

  // Use contact name if available, fall back to role, then generic
  let greeting = "Hi there,";
  if (extracted.contact_info.name) {
    greeting = `Dear ${extracted.contact_info.name},`;
  } else if (extracted.contact_info.role) {
    // Title-case the role: "school counsellor" → "School Counsellor"
    const role = extracted.contact_info.role
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    greeting = `Dear ${role},`;
  }

  // Determine if this is supply-side (offering a programme) or demand-side (looking for programmes)
  const isDemandSide = extracted.sender_type === "school" || extracted.sender_type === "student";

  const prompt = `You are writing on behalf of Succeed, a platform that connects students with enrichment programmes (summer schools, bootcamps, academic programmes).

Draft a follow-up email. Be direct, every sentence must earn its place. No filler phrases like "We appreciate you considering", "Please feel free to", "Thank you for reaching out about your", "our team is conducting a thorough review". Open with something specific to their enquiry, not a generic thank-you.

STRICT RULES:
- NEVER mention scores, ratings, or internal ranking systems. The recipient does not know they are being scored.
- NEVER invent facts, statistics, or claims about Succeed (e.g. "X% of places filled", "we work with N schools"). You have no knowledge base about Succeed's metrics or track record. Only state what is obviously true from context: Succeed connects students with enrichment programmes.
- NEVER parrot the sender's own description back as a reason students want their programme. Instead, connect their programme to genuine student needs (e.g. location appeal, subject demand, career relevance).

ACTION: ${routeResult.action}
PRIORITY: ${routeResult.priority_label}
SENDER TYPE: ${extracted.sender_type}
ENQUIRY DIRECTION: ${isDemandSide ? "DEMAND-SIDE (looking for programmes)" : "SUPPLY-SIDE (offering a programme)"}
PROGRAMME: ${programmeSummary}
MISSING INFO: ${missingFields}

CRITICAL — respond differently based on enquiry direction:

${isDemandSide ? `This person is LOOKING FOR programmes on Succeed (a school, counsellor, or student).
- Help them. Tell them Succeed can connect them with relevant programmes.
- If they mentioned a subject or interest, acknowledge it specifically.
- Point them toward next steps: browsing the platform, or sharing more about what they need so we can match them.
- Do NOT say "we're reviewing your enquiry" or "we'll get back to you" — there is nothing to review. Be helpful now.` : `This person is OFFERING a programme and wants to partner with Succeed.
- Treat them as a potential partner, not an applicant being evaluated.
- For request_info: ask for what Succeed actually needs to list them (contact details, a call to discuss partnership). Do NOT ask about "pricing structure" like an interrogation. Frame it as "let's explore how we work together."
- For schedule_call: be enthusiastic about their specific programme. Propose a call.
- For manual_review: be brief and honest. Acknowledge their interest, say we'll follow up within a few days. No corporate padding.`}

Tone calibration, match enthusiasm to the score:
- Score 80-100: Genuinely excited. You want this partnership. Be specific about why.
- Score 50-79: Interested and warm. Show you've read their message carefully.
- Score 20-49: Polite and brief. Acknowledge, set expectations, don't oversell.

Start the email with exactly: "${greeting}"
80-120 words maximum. Do not include a subject line. Sign off as "The Succeed Team". Never output placeholder brackets like [Name] or [Contact]. Never use em-dashes. Use commas, periods, or restructure the sentence instead.`;

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
