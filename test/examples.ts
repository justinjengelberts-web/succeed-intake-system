/**
 * Test script — fires all 5 assignment examples at the deployed Edge Function.
 * Run with: deno run --allow-net test/examples.ts
 *
 * Set environment variables before running:
 *   SUCCEED_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/succeed-intake
 *   SUPABASE_ANON_KEY=<your-anon-key>
 *
 * Note: Supabase's newer key format (sb_publishable_/sb_secret_) is not a JWT,
 * so the edge function must be deployed with --no-verify-jwt. The key is sent
 * via the `apikey` header.
 */

const FUNCTION_URL =
  Deno.env.get("SUCCEED_FUNCTION_URL") ||
  "http://localhost:54321/functions/v1/succeed-intake";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const examples = [
  {
    label: "1. High Value (Barcelona AI Summer)",
    message:
      "Hi, we run a summer AI programme in Barcelona for students aged 16–18. We've worked with a few UK schools and want to increase international applications.",
  },
  {
    label: "2. Incomplete (School Counsellor)",
    message:
      "Hi, I'm a school counsellor looking for enrichment opportunities for students interested in medicine.",
  },
  {
    label: "3. Spam (LinkedIn Tool)",
    message:
      "Hey! Want to grow your LinkedIn following? Check out our tool at https://www.google.com/search?q=link-xyz.com.",
  },
  {
    label: "4. Complex High Value (Oxford Economics)",
    message:
      "Hi, we run a highly selective economics programme at Oxford, avg fee £6,000, looking for global reach. Contact: dean@oxford-econ.edu",
  },
  {
    label: "5. Ambiguous (Coding Bootcamp)",
    message:
      "Hello, we offer online coding bootcamps. Not sure if this fits your platform but interested in partnerships.",
  },
];

console.log("=== Succeed Intake Pipeline — Test Run ===\n");

for (const ex of examples) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📨 ${ex.label}`);
  console.log(`Input: "${ex.message.substring(0, 80)}..."`);
  console.log();

  try {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ANON_KEY ? { apikey: ANON_KEY } : {}),
      },
      body: JSON.stringify({ message: ex.message }),
    });

    if (!res.ok) {
      console.error(`  HTTP ${res.status}: ${await res.text()}`);
      continue;
    }

    const data = await res.json();

    console.log(`  Score:    ${data.score?.total}/100`);
    console.log(
      `  Breakdown: completeness=${data.score?.completeness}/25 | value=${data.score?.value_signals}/30 | fit=${data.score?.platform_fit}/25 | intent=${data.score?.intent_clarity}/20`
    );
    console.log(`  Action:   ${data.route?.action} (${data.route?.priority_label})`);
    console.log(`  Sender:   ${data.extracted?.sender_type}`);
    console.log(`  Sheets:   ${data.sheets_success ? "✅" : "❌"}`);
    console.log(`  Time:     ${data.processing_time_ms}ms`);

    if (data.follow_up) {
      console.log(`\n  Follow-up draft:`);
      console.log(
        `  ${data.follow_up.split("\n").join("\n  ")}`
      );
    } else {
      console.log(`\n  No follow-up (archived/spam)`);
    }

    console.log(`\n  Factors:`);
    for (const f of data.score?.factors || []) {
      console.log(`    • ${f}`);
    }
  } catch (err) {
    console.error(`  Error: ${err}`);
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log("=== Test complete ===\n");
