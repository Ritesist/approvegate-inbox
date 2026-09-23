# ApproveGate Inbox — Build Fast with AI (Inbox-to-Action Butler)

Build a greenfield web app for the Build Fast with AI: AI Build Challenge 2026.

## Product
Messy inbox / support-ticket triage with draft replies and a **hard human-approve gate** — nothing sends without approval.

## MVP
1. Ingest: upload CSV/JSON ticket export OR built-in demo fixture (~35–40 messy threads). No live Gmail OAuth required.
2. Triage: P0–P3 priority, category (billing/bug/sales/FYI/other), summary, suggested owner, optional due-by.
3. Drafts: ready-to-send reply + suggested next actions per thread.
4. ApproveGate: Approve / Edit / Reject / Snooze. **Zero auto-send.** Audit log of every draft state change.
5. Eval page: golden-set labels, precision@priority, invariant check "never sent without approve".
6. 1-click demo fixture; mock LLM mode without API keys + optional OPENAI_API_KEY / GEMINI_API_KEY.

## Tech
Next.js (App Router) + TypeScript + Tailwind. SQLite or local JSON. Deployable on Vercel.

## Also create
- README (setup, demo script, architecture)
- docs/PPT_OUTLINE.md (≤10 slides)
- docs/AI_DISCLOSURE.md
- data/fixtures/messy-inbox.json + golden-labels.json
- A few tests for triage parsing + never-auto-send invariant

## Success
`npm install && npm run dev` works; demo fixture + triage + approve gate + audit log work in mock mode; eval page runs.

## Design constraints (mandatory)
- Light color palette only (light backgrounds, soft neutrals, clear contrast). No dark-mode-first UI.
- Do not use emojis anywhere in the UI or copy.
- Keep the interface clean, professional, and readable.
