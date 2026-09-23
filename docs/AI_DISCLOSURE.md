# AI Assistance & Model Disclosure

This document provides transparent disclosure regarding the use of Artificial Intelligence in the design, development, and runtime execution of the **ApproveGate Inbox** application for the Build Fast with AI: AI Build Challenge 2026.

---

## 1. AI Assistance During Development

### Assisted Workflows
- **Scaffolding and Architecture:** AI assistance was utilized to scaffold Next.js App Router boilerplate, generate TypeScript types, and define standard data structures.
- **Fixture Generation:** The heterogeneous support ticket dataset (`data/fixtures/messy-inbox.json`) was generated with AI assistance to reflect authentic customer communications, including forwarded emails, billing disputes, typos, edge cases, and spam patterns.
- **Golden Label Annotation:** Ground truth labels were collaboratively defined and verified to provide objective benchmarking in `data/fixtures/golden-labels.json`.
- **Test Generation:** Automated test suites (`src/test/triage.test.ts`, `src/test/approve-gate-invariant.test.ts`, `src/test/eval-metrics.test.ts`) were generated to guarantee invariant correctness.

### Human Engineering Oversight
- All architectural decisions, security boundaries, and invariant enforcement logic were designed, reviewed, and validated by human engineers.
- Specific human design requirements enforced:
  - Hard human approval gate with zero auto-send capability.
  - Strict compliance with light color palette and typography.
  - Absolute prohibition of emojis throughout the user interface, logs, fixtures, and documentation.
  - Strict append-only audit trail design with cryptographic snapshot tracking.

---

## 2. Runtime AI Architecture

ApproveGate Inbox implements a modular AI intelligence architecture with multiple selectable engines:

### 1. Deterministic Mock Engine (Default & Built-In)
- **Role:** Provides 100% offline, deterministic, sub-millisecond triage, classification, and drafting.
- **Requirements:** Zero API keys and zero internet access required.
- **Mechanism:** Pattern-matching rule classifier calibrated against the golden label test set, paired with template-driven contextual reply synthesis.

### 2. OpenAI Engine (Optional)
- **Models Supported:** `gpt-4o-mini` (default), `gpt-4o`.
- **Integration:** Structured JSON output schema enforcement via the OpenAI Chat Completions API.
- **Safety Fallback:** Automatically falls back to the deterministic Mock Engine if network issues, rate limits, or invalid keys are encountered.

### 3. Google Gemini Engine (Optional)
- **Models Supported:** `gemini-1.5-flash` (default), `gemini-1.5-pro`.
- **Integration:** Structured JSON generation using Google Generative AI REST endpoints.
- **Safety Fallback:** Automatically falls back to the deterministic Mock Engine on failure.

---

## 3. Human-in-the-Loop Safety & Operational Invariants

The central premise of ApproveGate Inbox is mitigating the risks of autonomous AI agents in enterprise workflows:
- **Zero Auto-Send Guarantee:** The system explicitly forbids the AI model or any background cron from dispatching communications directly to external customers.
- **Invariant Enforcement:** Outbound transmission is strictly gated behind an unbypassable verification check requiring both an active `approved` status and an immutable audit log entry signed by a human operator.
- **Revocation on Modification:** If an operator edits any draft, existing approval status is automatically revoked and returned to `pending`, preventing stale or unreviewed mutations from being dispatched.

---

## 4. Evaluation and Verification Methodology

Performance metrics reported on the `/eval` dashboard reflect:
- **Sample Size:** 36 heterogeneous support tickets with corresponding golden ground-truth labels.
- **Metrics Tracked:** Precision, Recall, F1 Score per priority tier (P0–P3) and category (billing, bug, sales, FYI, other).
- **Formal Invariant Verification:** Automated verification verifying that zero tickets have ever transitioned to `sent` without an antecedent human approval signature.
