import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import type { ExtractedData, ScoreBreakdown, RouteResult } from "./types.ts";

/**
 * Google Sheets output — appends one row per enquiry.
 * Uses service account JWT auth (same pattern as LeadHub google-calendar.ts).
 * Non-blocking: if Sheets fails, the pipeline still completes.
 */

async function getAccessToken(
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(3600),
    iat: now,
  };

  // Parse PEM private key — handle escaped newlines from env vars
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\\n/g, "\n")
    .replace(/\s/g, "");

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(
      `Google Auth Error: ${data.error_description || data.error}`
    );
  }
  return data.access_token;
}

export async function appendToSheet(
  enquiryId: string,
  rawInput: string,
  extracted: ExtractedData,
  scoreResult: ScoreBreakdown,
  routeResult: RouteResult,
  followUp: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
    const sheetsId = Deno.env.get("GOOGLE_SHEETS_ID");

    if (!serviceAccountEmail || !privateKey || !sheetsId) {
      return { success: false, error: "Missing Google Sheets credentials" };
    }

    const token = await getAccessToken(serviceAccountEmail, privateKey);

    // Build the row
    const scoreBreakdown = `completeness: ${scoreResult.completeness}/25 | value: ${scoreResult.value_signals}/30 | fit: ${scoreResult.platform_fit}/25 | intent: ${scoreResult.intent_clarity}/20`;
    const row = [
      enquiryId,
      new Date().toISOString(),
      rawInput,
      extracted.sender_type,
      extracted.programme.type || "N/A",
      extracted.programme.subject || "N/A",
      extracted.programme.location || "N/A",
      extracted.programme.audience_description || "N/A",
      extracted.programme.fee
        ? `${extracted.programme.fee_currency || ""}${extracted.programme.fee}`
        : "N/A",
      extracted.contact_info.email || "N/A",
      extracted.intent || "N/A",
      scoreResult.total,
      scoreBreakdown,
      scoreResult.factors.join("\n"),
      routeResult.action,
      routeResult.priority_label,
      followUp || "N/A",
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Sheet1!A:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        error: errData.error?.message || response.statusText,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
