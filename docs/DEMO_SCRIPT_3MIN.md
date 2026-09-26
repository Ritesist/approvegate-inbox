# ApproveGate Inbox — 3-Minute Spoken Demo Script

**Track:** Inbox-to-Action Butler  
**Audience:** Unstop Build Fast judges / mentors  
**Mode:** Mock AI (zero API keys). Prefer **https://approvegate-inbox.vercel.app**; otherwise `npm run dev` at http://localhost:3000  
**Timing:** ~180 seconds. No emojis. Speak calmly; click as you talk.

---

## Prep (before recording or live)

1. Open the app home page. If the inbox looks empty, click **Seed / Reset Demo** or call triage so ~36 threads appear.
2. Confirm light UI loads. Optional: open `/eval` in a second tab so you can jump quickly at the end.
3. Do not enable OpenAI or Gemini for the judged walkthrough — mock mode is deterministic and offline.

---

## Spoken script (word-for-word friendly)

**[0:00–0:25 | Frame the problem]**  
"ApproveGate Inbox is an Inbox-to-Action Butler. Support teams want AI speed, but unsupervised bots can send wrong refunds or leak bad promises. Our product auto-triages messy tickets and drafts replies, while a hard human-approve gate blocks every outbound send until an operator signs off."

**[0:25–0:55 | Inbox + triage]**  
"Here is the inbox with about thirty-six realistic messy threads. Priority badges sort critical work first. I open thread-001 — a production API outage. The butler already classified it as P0, category bug, suggested an owner and SLA, wrote a short summary, and prepared a ready-to-send draft plus an action checklist."

**[0:55–1:25 | Prove the gate]**  
"Send is disabled while the draft is pending. I click Test Send Invariant Protection. The server returns a forbidden response and logs a blocked send. Nothing reached a customer. That is the NeverSentWithoutApprove invariant — enforced in the API, not only in the UI."

**[1:25–1:55 | Approve, send, revoke]**  
"I Approve the draft. Send unlocks. I Send the approved reply — the thread resolves and the audit ledger records the operator approval and dispatch. On another thread I Approve, then Edit the reply and Save. Approval auto-revokes back to pending, so an unreviewed edit cannot slip through."

**[1:55–2:40 | Eval + audit]**  
"On Evaluation and Invariants we benchmark triage against golden labels — priority precision, recall, F1 — and show zero invariant violations. Audit Trail is append-only: triage runs, edits, approvals, rejects, snoozes, and blocked sends. Exportable for compliance."

**[2:40–3:00 | Close]**  
"Default engine is offline mock AI — no keys. Optional OpenAI or Gemini still cannot auto-send. Ambient AI for triage and drafts; humans alone unlock the gate. Thank you."

---

## Click checklist (silent backup)

| Time | Click / show |
|------|----------------|
| 0:30 | Select `thread-001` (or top P0) |
| 1:00 | **Test Send Invariant Protection** while pending |
| 1:30 | **Approve Draft** then **Send Approved Reply** |
| 1:45 | Another thread: Approve → **Edit Reply** → Save → status returns to pending |
| 2:00 | Navigate to `/eval` — Invariant Proof card |
| 2:20 | Navigate to `/audit` — filter by Operator / System |

---

## One-liner for the form

ApproveGate Inbox auto-triages support threads and drafts replies, with a hard human-approve gate so nothing is ever sent without an operator.
