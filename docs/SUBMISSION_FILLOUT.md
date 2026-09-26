# ApproveGate Build Fast — Submission Fillout (Unstop)

Paste the fields below directly into the Unstop submission form. Updated Sat Sep 26, 2026 (IST) for the TypeSafe Jev integration.

Project title: ApproveGate Inbox

Track: Inbox-to-Action Butler

## Short description (one-liner)

ApproveGate Inbox triages support threads, drafts replies, and uses TypeSafe Jev typed judgments (with a rules fallback and a human-review threshold) behind a hard human-approve gate, so nothing is sent without an operator.

## Project description

ApproveGate Inbox is an AI-assisted support workspace that turns messy customer threads into prioritized, summarized, categorized work with suggested owners, SLA targets, and reply drafts. For each thread, TypeSafe's Jev model returns typed judgments in a single request: the probability that a human must approve (Noul), the next action type (Choice), and urgency on the P0 to P3 scale (Score). If TypeSafe is unavailable, slow, or not confident, the app falls back to its deterministic rules engine, and anything below a confidence threshold is labeled Needs review. The final customer-facing decision always stays with a human.

## Problem

Support teams can lose urgent outages, billing disputes, and security concerns inside noisy inboxes. Fully manual triage is slow and inconsistent, while autonomous reply systems can send an incorrect or unsafe message. Operators need the speed of AI assistance without giving up control of outbound communication.

## Solution

ApproveGate triages threads from P0 to P3, routes categories, summarizes context, suggests next actions, and drafts a response. TypeSafe Jev adds calibrated, typed judgments per thread (needs approval, action type, urgency) using only the subject and a short snippet, with a 4-second timeout, an in-memory cache for cost control, and automatic fallback to rules on any error or low confidence. Each thread shows a light label (for example "Jev 0.87" or "Rules") and "Needs review" when confidence is below 0.70. A hard human-approve gate is enforced at the API layer: a reply cannot be sent without a verified operator approval, and editing a draft immediately revokes that approval. An append-only audit ledger records the workflow, and the evaluation page checks behavior against 36 golden-label tickets.

## Impact

ApproveGate reduces the work required to identify urgent tickets and prepare a consistent first response, while making the safety boundary visible and testable. Operators get faster prioritization, clearer ownership, an explicit signal for which AI judgments need a second look, and an auditable record of each decision. The project passes 16/16 tests (including TypeSafe failure-fallback tests), eval is 36/36 on priority and category, and the `NeverSentWithoutApprove` invariant reports zero violations.

## Supporting fields

Tech stack: Next.js 14 App Router, React, TypeScript, Tailwind CSS, Vitest, TypeSafe Jev (`@typesafe-ai/sdk`, server-side only) with a deterministic rules fallback, optional OpenAI/Gemini connectors, and an append-only audit ledger. Hosted on Vercel.

AI tools disclosure summary: AI assistance supported scaffolding, fixture generation, test drafts, UI iterations, the TypeSafe integration, and documentation. Human review set the product concept, safety boundaries, design constraints, invariant behavior, and final packaging. At runtime, TypeSafe Jev supplies advisory typed judgments when a key is configured; otherwise the deterministic rules engine runs with no network calls. No AI path can bypass the hard human approval gate.

## Links

Live URL: https://approvegate-inbox.vercel.app

TypeSafe demo endpoint: https://approvegate-inbox.vercel.app/api/judgments

Rules-only demo view: https://approvegate-inbox.vercel.app/?judge=rules

GitHub URL: not published (no public repository)

Screenshot: /workspace/submit-packages/build-fast-approvegate/screenshot_typesafe.png

Demo script: /workspace/submit-packages/build-fast-approvegate/DEMO_SCRIPT_3MIN.md
