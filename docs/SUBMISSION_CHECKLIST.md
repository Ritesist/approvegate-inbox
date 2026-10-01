# Build Fast with AI — Submission Checklist

**Event:** Build Fast with AI (Unstop)  
**Round 2 (Project Submission) deadline:** Thu Oct 1, 2026, 11:59 PM IST  
**Project:** ApproveGate Inbox  
**Track:** Inbox-to-Action Butler  

Use this list when the submission window opens. Mark each item before final submit.

## Required artifacts

| # | Item | Status | Where |
|---|------|--------|-------|
| 1 | Deployed live URL | **READY** — production live | https://approvegate-inbox.vercel.app |
| 2 | Public GitHub repository | **READY** — public, `gh` logged in as Ritesist | https://github.com/Ritesist/approvegate-inbox |
| 3 | 3-minute demo video | **READY** — 2:48 MP4, 1280x720 | https://github.com/Ritesist/approvegate-inbox/releases/download/v1.0-round2/ApproveGate_Demo.mp4 |
| 4 | Deck (10 slides) | **READY** — PDF | https://github.com/Ritesist/approvegate-inbox/releases/download/v1.0-round2/ApproveGate_BuildFast.pdf |
| 5 | Track selection | READY | **Inbox-to-Action Butler** |
| 6 | AI disclosure | READY | `docs/AI_DISCLOSURE.md` |

## Pre-flight (do before clicking Submit)

- [x] `npm test` passes locally (49/49)
- [x] `npm run build` passes locally
- [x] Deployed URL loads inbox with ~36 threads (`https://approvegate-inbox.vercel.app` → HTTP 200; `/api/threads` total=36)
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

**Tech stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vitest, TypeSafe Jev typed judgments (optional key) with a deterministic rules fallback. Built with Antigravity (`agy`) and Cursor/Grok agent assistance.

**Demo credentials:** None required. Runs without any API key (rules fallback).

## Blockers / status (as of Oct 1, 2026)

1. **Vercel:** production live at https://approvegate-inbox.vercel.app (CLI as workstationritalks-8167).
2. **GitHub:** public repo live at https://github.com/Ritesist/approvegate-inbox (account Ritesist, branch `master`).
3. **TypeSafe:** Jev judgments live in production; `/api/judgments` reports counts and `keyConfigured`.
4. **Do not force-push.**
