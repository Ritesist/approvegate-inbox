# Deploy ApproveGate Inbox (Vercel)

## Prerequisites
- Node.js 18+
- A Vercel account (https://vercel.com)
- GitHub repository for the project (recommended) **or** Vercel CLI

## Option A — Vercel Dashboard (GitHub import)
1. Push this repo to GitHub (public or private).
2. Open https://vercel.com/new and **Import** the repository.
3. Framework Preset: **Next.js** (auto-detected via `vercel.json`).
4. Root Directory: leave default.
5. Environment variables (optional):
   - `OPENAI_API_KEY` — only if you want live OpenAI triage
   - `GEMINI_API_KEY` — only if you want live Gemini triage
   - Mock engine works with **zero** keys (recommended for judges).
6. Click **Deploy**. Copy the production URL for Unstop submission.

## Option B — Vercel CLI
```bash
npm i -g vercel   # or: npx vercel
vercel login
cd /path/to/approvegate-inbox
vercel            # preview
vercel --prod     # production
```

## Demo readiness after deploy
1. Open the deployed URL.
2. Click **Triage All** once if threads appear untriaged (cold start / new instance).
3. Or use **Reset Demo** / seed endpoint, then **Triage All**.
4. Walk the 3-minute demo in the README.

## Serverless note
State is stored in `data/store.json` when the filesystem is writable, and falls back to **in-memory** on read-only serverless runtimes. Mutations on Vercel may not persist across cold starts or instances. For judging, that is fine: fixtures rehydrate and **Triage All** / **Reset Demo** restore a clean walkthrough in seconds.

## Local production smoke check
```bash
npm install
npm test
npm run build
npm start
```
