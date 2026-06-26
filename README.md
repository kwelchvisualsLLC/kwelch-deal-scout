# KWelch Deal Scout

A brand-partnership discovery & outreach tool for **KWelchVisuals** (Keith Welch Jr.).
React + Vite, styled black / gold (#D4AF37) / white. AI runs on Anthropic **claude-sonnet-4-6**.

**Live:** https://kwelchvisualsllc.github.io/kwelch-deal-scout/

## How it works
It's a **pure static app** — the AI calls go straight from your browser to the Anthropic API
using a key you paste into **Settings** (stored only on your device, in localStorage). No backend
server needed, which is why it can live on free GitHub Pages. Add your key once (⚙ top-right) and
the AI features turn on. The **Rate Card** works with no key at all.

## Features
1. **Profile Analyzer** — stats → content pillars, audience & ranked brand-fit categories.
2. **Deal Discovery Engine** — categories + deal params → 15–20 brand targets with heat scores.
3. **Outreach Generator** — per-brand cold DM + email + subject in Keith's voice, editable & copyable.
4. **Pipeline Tracker** — drag-and-drop Kanban, saved to localStorage.
5. **Fresh Leads Feed** — 10 AI-sourced brands plausibly running campaigns now.
6. **Rate Card Generator** — auto-priced from reach, copyable (no key required).

## Run locally
```bash
npm install
npm run web        # http://localhost:5174
```

## Deploy an update
```bash
bash deploy.sh     # builds + pushes to GitHub Pages, ~30-60s to go live
```

## Notes
- Your Anthropic key never leaves your browser except to call Claude directly. Get one at
  console.anthropic.com → API Keys.
- `server/` contains an optional Express backend version (not used by the live static build).
