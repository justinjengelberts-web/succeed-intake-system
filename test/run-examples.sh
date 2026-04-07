#!/bin/bash
# Run all 5 assignment examples against the deployed edge function.
# Usage: export SUCCEED_FUNCTION_URL=<your-url> && bash test/run-examples.sh

URL="${SUCCEED_FUNCTION_URL:?Set SUCCEED_FUNCTION_URL before running}"

echo "============================================"
echo "  Succeed Intake Pipeline — Live Test Run"
echo "============================================"
echo ""

examples=(
  '1. High Value (Barcelona AI Summer)|Hi, we run a summer AI programme in Barcelona for students aged 16-18. We have worked with a few UK schools and want to increase international applications.'
  '2. Incomplete (School Counsellor)|Hi, I am a school counsellor looking for enrichment opportunities for students interested in medicine.'
  '3. Spam (LinkedIn Tool)|Hey! Want to grow your LinkedIn following? Check out our tool at https://www.google.com/search?q=link-xyz.com.'
  '4. Complex High Value (Oxford Economics)|Hi, we run a highly selective economics programme at Oxford, avg fee 6000 GBP, looking for global reach. Contact: dean@oxford-econ.edu'
  '5. Ambiguous (Coding Bootcamp)|Hello, we offer online coding bootcamps. Not sure if this fits your platform but interested in partnerships.'
)

for entry in "${examples[@]}"; do
  IFS='|' read -r label message <<< "$entry"

  echo "--------------------------------------------"
  echo "  $label"
  echo "--------------------------------------------"
  echo ""

  result=$(curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    --data-raw "{\"message\":\"$message\"}")

  score=$(echo "$result" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
  action=$(echo "$result" | grep -o '"action":"[^"]*"' | head -1 | cut -d'"' -f4)
  priority=$(echo "$result" | grep -o '"priority_label":"[^"]*"' | head -1 | cut -d'"' -f4)
  sender=$(echo "$result" | grep -o '"sender_type":"[^"]*"' | head -1 | cut -d'"' -f4)
  sheets=$(echo "$result" | grep -o '"sheets_success":[a-z]*' | cut -d: -f2)
  time_ms=$(echo "$result" | grep -o '"processing_time_ms":[0-9]*' | cut -d: -f2)

  echo "  Score:    $score/100"
  echo "  Action:   $action ($priority)"
  echo "  Sender:   $sender"
  echo "  Sheets:   $sheets"
  echo "  Time:     ${time_ms}ms"
  echo ""
done

echo "============================================"
echo "  All 5 examples complete — check the sheet"
echo "============================================"
