# Build Fast with AI — Submission Checklist

**Event:** Build Fast with AI (Unstop)  
**Window:** Sep 24, 2026 10:00 AM – Sep 26, 2026 10:00 PM IST  
**Project:** ApproveGate Inbox  
**Track:** Inbox-to-Action Butler  

Use this list when the submission window opens. Mark each item before final submit.

## Required artifacts

| # | Item | Status | Where |
|---|------|--------|-------|
| 1 | Deployed live URL | PENDING — needs Vercel login | Paste URL here: _______________ |
| 2 | Public GitHub repository | PENDING — `gh` CLI not logged in; MCP auth as Ritesh-Root available for API | Paste URL here: _______________ |
| 3 | 3-minute demo (script) | READY | `README.md` → section "3-Minute Demo Walkthrough" |
| 4 | PPT / pitch deck (≤10 slides) | READY (markdown outline) | `docs/PPT_OUTLINE.md` — export to PDF/Google Slides before submit |
| 5 | Track selection | READY | **Inbox-to-Action Butler** |
| 6 | AI disclosure | READY | `docs/AI_DISCLOSURE.md` |

## Pre-flight (do before clicking Submit)

- [ ] `npm test` passes locally
- [ ] `npm run build` passes locally
- [ ] Deployed URL loads inbox with ~36 threads
- [ ] Click **Triage All** on deploy if needed; confirm P0s sort to top
- [ ] Demo: Approve → Send works; Edit after Approve revokes gate; blocked send shows invariant
- [ ] `/eval` shows invariant proof (0 violations)
- [ ] `/audit` shows ledger entries
- [ ] Light UI, no emojis
- [ ] GitHub README shows setup + architecture + demo script
- [ ] PPT exported (PDF or Slides link) from `docs/PPT_OUTLINE.md`
- [ ] Unstop form: track = Inbox-to-Action Butler; attach AI disclosure text or link to `docs/AI_DISCLOSURE.md`
- [ ] Record 3-min loom/screen demo if Unstop asks for video (optional but strong)

## Copy-paste blurbs for Unstop form

**One-liner:**  
ApproveGate Inbox is an Inbox-to-Action Butler that auto-triages messy support threads and drafts replies, with a hard human-approve gate so nothing sends without an operator.

**Track:** Inbox-to-Action Butler

**Tech stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vitest, optional OpenAI/Gemini, deterministic mock AI by default. Built with Antigravity (`agy`) and Cursor/Grok agent assistance.

**Demo credentials:** None required. Mock mode, zero API keys.

## Blockers logged (as of Sep 23, 2026 evening IST)

1. **Vercel:** CLI present (`npx vercel`) but **logged out** — cannot deploy until `vercel login` (or Dashboard import after GitHub push).
2. **GitHub CLI:** `gh` not authenticated. Cursor GitHub MCP is connected as **Ritesh-Root**, but repo create/push still needs interactive `gh auth login` or Dashboard create + `git remote add` + push with user credentials.
3. **Do not force-push.** Local `master` history is clean for a normal first push.
