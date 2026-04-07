import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { extract } from "./extract.ts";
import { score } from "./score.ts";
import { route } from "./route.ts";
import { generateFollowUp } from "./followup.ts";
import { appendToSheet } from "./sheets.ts";
import type { StepLog } from "./types.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed. Use POST." },
      { status: 405, headers: CORS_HEADERS }
    );
  }

  const pipelineStart = Date.now();

  // Init Supabase client for logging
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const enquiryId = crypto.randomUUID();

  // Helper: log a pipeline step to the database
  async function logStep(log: StepLog) {
    const { error } = await supabase.from("succeed_intake_log").insert({
      enquiry_id: log.enquiry_id,
      step: log.step,
      input: log.input,
      output: log.output,
      duration_ms: log.duration_ms,
      error: log.error,
    });
    if (error) console.error(`Failed to log step ${log.step}:`, error.message);
  }

  // Parse input — accept JSON { message: "..." } or plain text
  let rawMessage: string;
  try {
    const body = await req.json();
    rawMessage = body.message || body.text || body.content || "";
  } catch {
    try {
      rawMessage = await req.text();
    } catch {
      rawMessage = "";
    }
  }

  if (!rawMessage || rawMessage.trim().length === 0) {
    return Response.json(
      { error: "Empty input. Send { \"message\": \"your enquiry text\" }" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return Response.json(
      { error: "Server configuration error: missing API key" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  try {
    // ── Step 1: Extract (LLM) ──────────────────────────────
    const t1 = Date.now();
    const extracted = await extract(rawMessage, apiKey);
    const d1 = Date.now() - t1;
    await logStep({
      enquiry_id: enquiryId,
      step: "extract",
      input: { raw_message: rawMessage },
      output: extracted,
      duration_ms: d1,
      error: null,
    });

    // ── Step 2: Score (deterministic) ──────────────────────
    const t2 = Date.now();
    const scoreResult = score(extracted);
    const d2 = Date.now() - t2;
    await logStep({
      enquiry_id: enquiryId,
      step: "score",
      input: extracted,
      output: scoreResult,
      duration_ms: d2,
      error: null,
    });

    // ── Step 3: Route ─────────────────────────────────────
    const t3 = Date.now();
    const routeResult = route(scoreResult);
    const d3 = Date.now() - t3;
    await logStep({
      enquiry_id: enquiryId,
      step: "route",
      input: scoreResult,
      output: routeResult,
      duration_ms: d3,
      error: null,
    });

    // ── Step 4: Follow-up (LLM, only if score >= 20) ─────
    let followUp: string | null = null;
    if (scoreResult.total >= 20) {
      const t4 = Date.now();
      try {
        followUp = await generateFollowUp(extracted, scoreResult, routeResult, apiKey);
      } catch (err) {
        console.error("Follow-up generation failed:", err);
      }
      const d4 = Date.now() - t4;
      await logStep({
        enquiry_id: enquiryId,
        step: "followup",
        input: { action: routeResult.action, sender_type: extracted.sender_type },
        output: { follow_up: followUp },
        duration_ms: d4,
        error: followUp ? null : "Follow-up generation failed",
      });
    }

    // ── Step 5: Output to Google Sheets ───────────────────
    const t5 = Date.now();
    const sheetsResult = await appendToSheet(
      enquiryId,
      rawMessage,
      extracted,
      scoreResult,
      routeResult,
      followUp
    );
    const d5 = Date.now() - t5;
    await logStep({
      enquiry_id: enquiryId,
      step: "output",
      input: { enquiry_id: enquiryId },
      output: sheetsResult,
      duration_ms: d5,
      error: sheetsResult.error || null,
    });

    // ── Return full pipeline result ───────────────────────
    return Response.json(
      {
        enquiry_id: enquiryId,
        raw_input: rawMessage,
        extracted,
        score: scoreResult,
        route: routeResult,
        follow_up: followUp,
        sheets_success: sheetsResult.success,
        sheets_error: sheetsResult.error || null,
        processing_time_ms: Date.now() - pipelineStart,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Pipeline error:", err);
    return Response.json(
      {
        error: "Pipeline processing failed",
        enquiry_id: enquiryId,
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
