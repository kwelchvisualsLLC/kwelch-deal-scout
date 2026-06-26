# KWelch Deal Scout

A brand-partnership discovery & outreach tool built for **KWelchVisuals** (Keith Welch Jr.).
React + Vite frontend, Node/Express backend, Anthropic **claude-sonnet-4-6** for the AI features.
Black / gold (#D4AF37) / white only.

## Features
1. **Profile Analyzer** — pull IG stats → Claude maps content pillars, audience & brand-fit categories.
2. **Deal Discovery Engine** — pick categories + deal params → 15–20 realistic brand targets with heat scores.
3. **Outreach Generator** — per-brand cold DM + email + subject line in Keith's voice, editable & copyable.
4. **Pipeline Tracker** — drag-and-drop Kanban (Discovered → Contacted → Negotiation → Closed → Passed), saved to localStorage.
5. **Fresh Leads Feed** — 10 AI-sourced brands plausibly running campaigns now.
6. **Rate Card Generator** — auto-priced from reach, copyable.

## Setup
```bash
npm install
cp .env.example .env          # then paste your ANTHROPIC_API_KEY
npm run dev                   # backend :8787 + frontend :5174
```
Open **http://localhost:5174**.

- Get an API key at https://console.anthropic.com → API Keys.
- **Instagram stats:** the app uses Keith's known stats out of the box. To pull *live* stats,
  subscribe to a RapidAPI Instagram scraper and set `RAPIDAPI_KEY` / `RAPIDAPI_HOST` in `.env`.

## Production
```bash
npm run build      # emits dist/
npm start          # Express serves the API + the built app on :8787
```

## Notes
- The Anthropic key lives only in `server/.env` and is never exposed to the browser — all AI calls go through the backend.
- AI responses are parsed as JSON server-side with a tolerant extractor, so the UI always gets clean data.
