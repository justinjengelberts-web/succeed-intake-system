import type { ExtractedData, ScoreBreakdown } from "./types.ts";

/**
 * Deterministic scoring engine — no LLM involved.
 * This is the custom logic component built with AI-assisted development.
 *
 * Scores an extracted enquiry across 4 weighted dimensions:
 * - Completeness (0-25): how much info did they provide?
 * - Value signals (0-30): indicators of a high-value opportunity
 * - Platform fit (0-25): does this match Succeed's focus?
 * - Intent clarity (0-20): is the ask clear and actionable?
 *
 * Returns a breakdown with human-readable factors explaining every point.
 */
export function score(data: ExtractedData): ScoreBreakdown {
  // Spam override — short-circuit to zero
  if (data.is_spam) {
    return {
      completeness: 0,
      value_signals: 0,
      platform_fit: 0,
      intent_clarity: 0,
      total: 0,
      factors: ["Identified as spam — score overridden to 0"],
    };
  }

  const factors: string[] = [];

  // === COMPLETENESS (0-25) ===
  let completeness = 0;
  if (data.completeness_flags.has_contact_info) {
    completeness += 7;
    factors.push("+7 contact info provided");
  }
  if (data.completeness_flags.has_programme_details) {
    completeness += 7;
    factors.push("+7 programme details provided");
  }
  if (data.completeness_flags.has_audience) {
    completeness += 6;
    factors.push("+6 audience specified");
  }
  if (data.completeness_flags.has_pricing) {
    completeness += 5;
    factors.push("+5 pricing mentioned");
  }

  // === VALUE SIGNALS (0-30) ===
  let value_signals = 0;

  // Fee signals
  if (data.programme.fee !== null && data.programme.fee > 0) {
    if (data.programme.fee >= 3000) {
      value_signals += 10;
      factors.push(`+10 high fee (${data.programme.fee_currency || ""}${data.programme.fee})`);
    } else {
      value_signals += 5;
      factors.push(`+5 fee mentioned (${data.programme.fee_currency || ""}${data.programme.fee})`);
    }
  }

  // Programme type signals
  if (
    data.programme.type === "academic" ||
    data.programme.type === "summer_school"
  ) {
    value_signals += 8;
    factors.push("+8 academic/summer school programme");
  } else if (data.programme.type === "enrichment") {
    value_signals += 6;
    factors.push("+6 enrichment programme");
  } else if (data.programme.type === "bootcamp") {
    value_signals += 4;
    factors.push("+4 bootcamp programme");
  }

  // Institutional contact signals
  if (
    data.contact_info.role &&
    /dean|director|head|principal|professor|provost/i.test(
      data.contact_info.role
    )
  ) {
    value_signals += 6;
    factors.push("+6 senior/institutional contact");
  }

  // Institutional email domain
  if (
    data.contact_info.email &&
    /\.edu|\.ac\.|university|oxford|cambridge/i.test(data.contact_info.email)
  ) {
    value_signals += 6;
    factors.push("+6 institutional email domain");
  }

  value_signals = Math.min(value_signals, 30);

  // === PLATFORM FIT (0-25) ===
  let platform_fit = 0;

  // Age range — Succeed focuses on students roughly 12-25
  const ageMin = data.programme.audience_age_min;
  const ageMax = data.programme.audience_age_max;
  if (ageMin !== null && ageMax !== null && ageMin >= 12 && ageMax <= 25) {
    platform_fit += 12;
    factors.push(`+12 age range fits Succeed (${ageMin}-${ageMax})`);
  } else if (ageMin !== null || ageMax !== null) {
    platform_fit += 5;
    factors.push("+5 some age info provided");
  }

  // Audience description keywords
  const audienceDesc = (
    data.programme.audience_description || ""
  ).toLowerCase();
  if (
    /student|school|sixth.?form|a.?level|gcse|ib|high.?school|undergraduate/i.test(
      audienceDesc
    )
  ) {
    platform_fit += 8;
    factors.push("+8 student-focused audience");
  }

  // Programme subject relevance
  const subj = (data.programme.subject || "").toLowerCase();
  if (
    /stem|science|tech|engineering|math|medicine|economics|law|business|ai|computer|coding|programming/i.test(
      subj
    )
  ) {
    platform_fit += 5;
    factors.push("+5 relevant subject area");
  }

  // Implied platform fit — academic/summer school programmes from institutional
  // senders are inherently student-focused, even without explicit audience details
  if (
    (data.programme.type === "academic" || data.programme.type === "summer_school") &&
    (data.sender_type === "programme_provider" || data.sender_type === "organisation") &&
    platform_fit < 15
  ) {
    const boost = 12;
    platform_fit += boost;
    factors.push(`+${boost} implied student audience (institutional academic programme)`);
  }

  platform_fit = Math.min(platform_fit, 25);

  // === INTENT CLARITY (0-20) ===
  let intent_clarity = 0;

  if (data.completeness_flags.has_clear_intent) {
    intent_clarity += 10;
    factors.push("+10 clear intent expressed");
  }

  const intentText = (data.intent || "").toLowerCase();
  if (
    /partner|collaborat|list|feature|promote|reach|recruit|connect|applications/i.test(
      intentText
    )
  ) {
    intent_clarity += 5;
    factors.push("+5 partnership/listing intent");
  }
  if (/call|meet|discuss|demo|schedule|next step/i.test(intentText)) {
    intent_clarity += 5;
    factors.push("+5 actionable next step mentioned");
  }

  intent_clarity = Math.min(intent_clarity, 20);

  const total = completeness + value_signals + platform_fit + intent_clarity;

  return {
    completeness,
    value_signals,
    platform_fit,
    intent_clarity,
    total,
    factors,
  };
}
