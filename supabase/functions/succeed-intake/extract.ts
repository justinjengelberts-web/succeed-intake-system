import type { ExtractedData } from "./types.ts";

const EXTRACTION_PROMPT = `You are a data extraction assistant for Succeed, a platform that connects students with enrichment programmes (summer schools, bootcamps, academic programmes).

Extract structured data from the following inbound enquiry message. Be precise — extract what is explicitly stated or strongly implied. Use null for anything not mentioned.

For contact_info.role: infer the role when it is strongly implied. For example, if the email prefix is "dean@" the role is "dean". If someone says "I'm a school counsellor", the role is "school counsellor".

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "sender_type": "programme_provider" | "school" | "student" | "organisation" | "spam" | "unknown",
  "sender_name": string | null,
  "contact_info": {
    "email": string | null,
    "name": string | null,
    "role": string | null
  },
  "programme": {
    "name": string | null,
    "type": "summer_school" | "bootcamp" | "academic" | "enrichment" | "other" | null,
    "subject": string | null,
    "location": string | null,
    "fee": number | null,
    "fee_currency": string | null,
    "audience_age_min": number | null,
    "audience_age_max": number | null,
    "audience_description": string | null
  },
  "intent": string | null,
  "is_spam": boolean,
  "completeness_flags": {
    "has_contact_info": boolean,
    "has_programme_details": boolean,
    "has_audience": boolean,
    "has_pricing": boolean,
    "has_clear_intent": boolean
  }
}`;

const DEFAULT_EXTRACTED: ExtractedData = {
  sender_type: "unknown",
  sender_name: null,
  contact_info: { email: null, name: null, role: null },
  programme: {
    name: null,
    type: null,
    subject: null,
    location: null,
    fee: null,
    fee_currency: null,
    audience_age_min: null,
    audience_age_max: null,
    audience_description: null,
  },
  intent: null,
  is_spam: false,
  completeness_flags: {
    has_contact_info: false,
    has_programme_details: false,
    has_audience: false,
    has_pricing: false,
    has_clear_intent: false,
  },
};

export async function extract(
  rawMessage: string,
  apiKey: string
): Promise<ExtractedData> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nMESSAGE:\n${rawMessage}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error(`Claude API error: ${response.status} ${response.statusText}`);
    return { ...DEFAULT_EXTRACTED };
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || "";

  try {
    return JSON.parse(text) as ExtractedData;
  } catch {
    // Fallback: try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as ExtractedData;
      } catch {
        // Give up — return safe defaults
      }
    }
    console.error("Failed to parse extraction response:", text.substring(0, 200));
    return { ...DEFAULT_EXTRACTED };
  }
}
