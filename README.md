# ApproveGate Inbox — Inbox-to-Action Butler

A support-ticket triage and response management application built for the **Build Fast with AI: AI Build Challenge 2026**.

ApproveGate combines ambient AI intelligence with an unbypassable **hard human-approve gate**: incoming support tickets are automatically triaged, summarized, categorized, and drafted with suggested actions, but **nothing is ever sent to a customer without explicit human operator approval**.

---

## Key Highlights

- **Frictionless Ingestion:** Built-in fixture with ~36 realistic messy customer threads (outages, billing disputes, procurement RFPs, bugs, and spam), plus universal drag-and-drop CSV and JSON ticket import.
- **Precision Triage:** Automatic P0 to P3 priority classification, category routing (billing, bug, sales, FYI, other), contextual summaries, suggested team ownership, and SLA target deadlines.
- **Ready-to-Send Drafts:** Tailored responses matched to customer tone and issue severity, accompanied by interactive checklists of suggested next operational actions.
- **Hard Human-Approve Gate:** Operators can Approve, Edit, Reject, or Snooze drafts. Outbound dispatch is physically blocked at the API layer unless a prior human approval audit record is verified.
- **Zero Auto-Send Guarantee:** No background cron, automated trigger, or AI model can dispatch an email autonomously. Editing any draft immediately revokes approval.
- **Append-Only Audit Ledger:** Full compliance history of every triage classification, draft generation, manual edit, approval, rejection, and snooze event.
- **Evaluation & Invariant Verification Suite:** Real-time benchmark against 36 ground-truth golden labels calculating precision@priority, recall, F1, and formal invariant compliance.
- **Zero-Key Mock Mode by Default:** Out of the box, ApproveGate runs fully locally with deterministic mock AI—no external API keys or network calls required. Optional OpenAI and Google Gemini integrations available.
- **Enterprise Design Standards:** Clean, professional light-mode aesthetic with zero emojis anywhere in the interface or copy.

---

## Architecture Overview

```
                   +----------------------------------+
                   | Inbound Tickets (CSV/JSON/Fixtures)|
                   +-----------------+----------------+
                                     |
                                     v
                   +----------------------------------+
                   |       AI Butler Intelligence     |
                   |  (Mock Engine / OpenAI / Gemini)  |
                   +-----------------+----------------+
                                     |
              +----------------------+----------------------+
              |                      |                      |
              v                      v                      v
     +-----------------+    +-----------------+    +-----------------+
     | Priority (P0-P3)|    | Category Routing|    | Draft & Actions |
     +-----------------+    +-----------------+    +-----------------+
              |                      |                      |
              +----------------------+----------------------+
                                     |
                                     v
            ====================================================
            ||            HARD HUMAN-APPROVE GATE             ||
            ||         (Zero Auto-Send Protection)            ||
            ====================================================
                      /              |             \
                     /               |              \
                    v                v               v
            +---------------+ +---------------+ +---------------+
            | Approve Draft | |  Edit Draft   | | Reject/Snooze |
            +-------+-------+ +-------+-------+ +---------------+
                    |                 |
                    | (Unlocks Gate)  | (Revokes Approval)
                    v                 v
            +---------------+ +---------------+
            |  Send Reply   | | Reset Pending |
            +-------+-------+ +---------------+
                    |
                    v
            +---------------------------------+
            | Append-Only Audit Trail Ledger  |
            +---------------------------------+
```

---

## Quick Start

### 1. Installation
Ensure Node.js 18+ is installed. Clone the repository and install dependencies:

```bash
npm install
```

### 2. Development Server
Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser. The application is pre-seeded with 36 diverse support tickets.

### 3. Running Automated Tests
Run Vitest to verify triage parsing, evaluation metrics, and the hard approval invariant:

```bash
npm test
```

### 4. Production Build
Verify production compilation:

```bash
npm run build
```

### 5. Deploy to Vercel
ApproveGate is pre-configured for one-click deployment to Vercel (Next.js preset). For step-by-step Dashboard import and CLI instructions, see **[docs/DEPLOY.md](docs/DEPLOY.md)**. For the final demo and submission items, see **[docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md)**.

---

## 3-Minute Demo Walkthrough

Follow these steps to demonstrate the end-to-end capabilities of ApproveGate:

1. **Explore the Inbox (`/`):**
   - Review the pre-loaded tickets in the master pane. Notice how critical P0 tickets (production outages, unauthorized charges, security alerts) are highlighted at the top.
   - Click on `thread-001` ("URGENT: Production API throwing 500 errors"). Observe the AI triage card: Priority P0, Category bug, Owner Core Platform Engineering, 1-hour SLA target, and an apologetic reply draft.
   - Check off suggested next actions in the checklist (e.g., "Escalate to P0 On-Call SRE Bridge"). Notice that each action update is immediately logged into the audit ledger below.

2. **Test Invariant Protection ("Zero Auto-Send"):**
   - On `thread-001`, observe that the "Send Approved Reply" button is disabled.
   - Click the "Test Send Invariant Protection" button. Notice the alert: the server intercepts and blocks the call because the draft has not yet been approved by a human operator.

3. **Approve and Dispatch:**
   - Click "Approve Draft". The banner updates to "Approved by Operator", and the "Send Approved Reply" button turns green.
   - Click "Send Approved Reply". The message is dispatched, the thread is resolved, and an immutable dispatch entry is appended to the audit ledger.

4. **Verify Safety on Modification:**
   - Select another ticket (e.g., `thread-002`). Click "Approve Draft".
   - Now click "Edit Reply", modify the text, and click "Save Changes".
   - Notice that saving changes automatically revokes approval and resets the status to "Pending Approval", ensuring that unreviewed modifications cannot be dispatched accidentally.

5. **Inspect the Evaluation Suite (`/eval`):**
   - Click "Evaluation & Invariants" in the top navigation bar.
   - Review precision, recall, and F1 metrics across P0 to P3 priority levels and categories.
   - Review the "Invariant Proof" card confirming 0 violations and 100% adherence to the `NeverSentWithoutApprove` rule.
   - Click "Run Full Benchmark" to re-verify against the golden label dataset in real time.

6. **Inspect the Audit Trail (`/audit`):**
   - Navigate to "Audit Trail" to view the append-only ledger of every triage run, manual edit, approval, rejection, and blocked send.
   - Filter by actor ("Operator", "AI Butler", "System") or export the audit log to JSON.

---

## Formal Invariant: `NeverSentWithoutApprove`

ApproveGate provides an unbypassable guarantee:

$$\forall m \in \text{Messages}, \text{status}(m) = \text{SENT} \implies \exists a \in \text{AuditLogs}: \text{action}(a) = \text{DRAFT\_APPROVED} \land \text{actor}(a) = \text{OPERATOR} \land t(a) \le t(m)$$

### Implementation Details:
- The dispatch controller verifies that the thread state is `approved` and queries the thread audit trail for an explicit prior approval signed by a human operator.
- Direct API calls to `/api/threads/[id]/action` with action `send` on unapproved tickets throw an `ApproveGateInvariantViolationError` and return HTTP 403 Forbidden.
- The violation event is logged as `send_blocked` in the audit ledger for compliance tracking.

---

## AI Configuration Options

ApproveGate operates completely standalone in Mock Mode without requiring external API keys. To connect live external LLMs:

1. Navigate to **Engine & Settings** (`/settings`).
2. Select your preferred provider:
   - **Mock Engine (Default):** Deterministic, fast, offline.
   - **OpenAI:** Enter your API key (or set `OPENAI_API_KEY` in your environment) and choose between `gpt-4o-mini` or `gpt-4o`.
   - **Google Gemini:** Enter your API key (or set `GEMINI_API_KEY` in your environment) and choose between `gemini-1.5-flash` or `gemini-1.5-pro`.
3. If an external API call fails or encounters rate limits, ApproveGate automatically falls back to the deterministic mock engine.

---

## Directory Structure

```
approvegate-inbox/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with navigation & light styling
│   │   ├── page.tsx               # Primary Inbox & Triage workspace
│   │   ├── eval/page.tsx          # Benchmark & Invariant Verification dashboard
│   │   ├── audit/page.tsx         # Comprehensive audit ledger viewer
│   │   ├── settings/page.tsx      # Engine & Model configuration
│   │   └── api/                   # REST endpoints (threads, actions, triage, eval, seed)
│   ├── components/                # React UI components (badges, panels, modals, lists)
│   ├── lib/
│   │   ├── types.ts               # Core TypeScript domain models
│   │   ├── store.ts               # Storage layer with invariant enforcement
│   │   ├── eval.ts                # Precision/recall/F1 metrics & invariant evaluator
│   │   ├── csv-parser.ts          # Universal CSV/JSON ticket ingestion engine
│   │   └── ai/                    # Mock, OpenAI, and Gemini triage engines
│   └── test/                      # Vitest test suites (triage, invariant, eval)
├── data/
│   └── fixtures/
│       ├── messy-inbox.json       # 36 realistic messy customer support threads
│       └── golden-labels.json     # Ground truth labels for automated benchmarking
├── docs/
│   ├── PPT_OUTLINE.md             # Executive presentation outline (<= 10 slides)
│   ├── AI_DISCLOSURE.md           # Transparent disclosure of AI assistance and models
│   ├── SUBMISSION_CHECKLIST.md    # Unstop Build Fast submit checklist
│   └── DEPLOY.md                  # Vercel deploy steps
├── vercel.json                    # Vercel Next.js project hints
├── package.json
└── README.md
```

---

## Deploy

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for Vercel Dashboard and CLI steps.  
Submission packaging: **[docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md)**.

Mock mode needs no environment variables. Optional: `OPENAI_API_KEY`, `GEMINI_API_KEY`.

---

## License

Created for the Build Fast with AI: AI Build Challenge 2026. Distributed under the MIT License.
