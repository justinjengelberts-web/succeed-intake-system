# Lead Engineer – Stage 2 Technical Task: Intelligent Intake System

## Overview
- **Time:** ~90 minutes
- **Objective:** Design and build a working system that processes messy inbound enquiries and turns them into structured, actionable outputs.

This task reflects a real problem we face. We are interested in how you think, how you structure systems, and how you use AI and tools to build something quickly and effectively.

This does not need to be production-ready. Focus on building a clear, working approach rather than adding unnecessary complexity.

## The Problem
At Succeed, we receive inbound enquiries from programme providers, high-schools, students, and other organisations.

These messages vary significantly in quality. Some represent high-value partnership opportunities, while others are incomplete or low-quality.

We need a system that can:
- interpret these messages
- structure the information
- assess their value
- determine what should happen next

## Input Data
Your system must process the following inputs:

**Example 1 (High Value):**
> "Hi, we run a summer AI programme in Barcelona for students aged 16–18. We've worked with a few UK schools and want to increase international applications."

**Example 2 (Incomplete):**
> "Hi, I'm a school counsellor looking for enrichment opportunities for students interested in medicine."

**Example 3 (Low Quality / Spam):**
> "Hey! Want to grow your LinkedIn following? Check out our tool at https://www.google.com/search?q=link-xyz.com."

**Example 4 (Complex / High Value):**
> "Hi, we run a highly selective economics programme at Oxford, avg fee £6,000, looking for global reach. Contact: dean@oxford-econ.edu"

**Example 5 (Ambiguous):**
> "Hello, we offer online coding bootcamps. Not sure if this fits your platform but interested in partnerships."

## Your Task
Build a working system that processes these inputs and produces:
- structured data
- a priority score
- a clear next action

Your system should follow a clear multi-step flow (for example: extraction → scoring → action), rather than relying on a single catch-all step.

## System Requirements
Your solution should:
- include a working flow from input → output
- use at least two tools working together
- include an automation layer (e.g. n8n, Make, or equivalent)
- include at least one custom logic component built with the help of an AI coding tool (e.g. validation, scoring, transformation, or routing logic)
- use AI where it meaningfully improves your workflow, alongside your own judgment

## Output
Your system should produce a clear "source of truth" (e.g. Google Sheets, Airtable, Notion, or similar).

For each input, we should be able to see:
- the raw input
- the structured data
- the priority score
- the action
- the factors or logic behind the score

Where appropriate, your system should generate a follow-up message to the sender of the enquiry (i.e. the external provider, school, or user who submitted the message).

This message should represent what Succeed would actually send in response.

The purpose of this message is to:
- move high-value opportunities forward (e.g. propose a call or next step)
- request missing information where needed
- ignore or avoid engaging with low-quality or irrelevant inputs

The message should:
- reflect the context and priority of the enquiry
- differ meaningfully between high-value, incomplete, and low-quality inputs
- be concise and usable in a real workflow

## Resilience
Your system should:
- handle missing or incomplete data gracefully
- identify and flag low-quality or spam inputs
- avoid breaking when inputs do not match your expected structure

## Submission
1. **The System** — provide access, links, or screenshots of your automation and output data
2. **Code / Logic** — share custom logic/scripts; include AI prompts used and brief explanation
3. **Loom Video (5–10 minutes)** — walk through how system works, tools used, one high-quality input end-to-end, one problematic input, one follow-up message example, and one design decision trade-off

## What We Are Evaluating
- how you structure messy problems
- how you design and connect systems
- how you use AI tools effectively
- your judgment and prioritisation
- your ability to build and demonstrate something real
