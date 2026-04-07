import type { ScoreBreakdown, RouteResult } from "./types.ts";

/**
 * Score → action mapping with clear thresholds.
 * Deterministic — no LLM involved.
 */
export function route(scoreResult: ScoreBreakdown): RouteResult {
  const { total } = scoreResult;

  if (total >= 80) {
    return {
      action: "schedule_call",
      priority_label: "high",
      reason: `Score ${total}/100: High-value opportunity. Recommending immediate outreach.`,
    };
  }

  if (total >= 50) {
    return {
      action: "request_info",
      priority_label: "medium",
      reason: `Score ${total}/100: Promising but needs more information before proceeding.`,
    };
  }

  if (total >= 20) {
    return {
      action: "manual_review",
      priority_label: "low",
      reason: `Score ${total}/100: Requires human judgment — not enough signal to automate.`,
    };
  }

  return {
    action: "archive",
    priority_label: "none",
    reason: `Score ${total}/100: Low relevance or spam. No follow-up needed.`,
  };
}
