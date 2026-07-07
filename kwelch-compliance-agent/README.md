# KWELCH COMPLIANCE AGENT

Private AI CFO + Big 4-style tax partner for **Keith Welch Jr. — KWelchVisuals LLC** (CA entity #202202610345, Fairfield CA, single-member LLC / Schedule C).

It tracks every LLC compliance deadline (CA SOS, IRS, CA FTB), pulls real financials from QuickBooks, runs simultaneous federal + California tax analysis, hunts for money owed *to* you (unclaimed property, refunds), maintains a live compliance health score, and puts a senior tax strategist on call 24/7.

## Quick start

```bash
cd kwelch-compliance-agent
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev                        # http://localhost:3000
```

On first run the SQLite database (`wealth.db`) is created and auto-seeded with the current-year compliance calendar:

1. CA LLC Franchise Tax $800 — April 15 — **critical**
2. CA Statement of Information $20 — biennial (Jan 31, even years)
3. Federal Estimated Tax Q1–Q4 (Apr 15 / Jun 15 / Sep 15 / Jan 15)
4. CA FTB Estimated Tax (same dates, 30/40/0/30 weighting)
5. Federal 1040 + Schedule C — April 15
6. CA Form 540 — April 15

**Monday-morning flow:** open the app → `/settings` → enter your EIN (encrypted immediately) → `/quickbooks` → **Sync QuickBooks** → within a minute the dashboard shows your exact tax liability, next deadline, compliance score, and the refund tracker shows where government money may be waiting.

## Pages

| Route | What it does |
|---|---|
| `/` | Dashboard — compliance score ring, alert feed, next deadlines, QB stats |
| `/agent` | AI Tax Agent — streaming chat, web search verifies live IRS/FTB dates, knows your entity + QB numbers |
| `/deadlines` | Full deadline calendar — filter, mark paid/filed, add custom deadlines |
| `/taxes` | Federal + CA tax analysis, SE tax, QBI, quarterly estimates with chart, SEP-IRA limit |
| `/quickbooks` | QB sync (P&L, AR aging, cash flow via Intuit MCP) + AI deduction scanner |
| `/entity` | LLC health — CA SOS record, franchise tax & SOI obligations, live status verification |
| `/refunds` | Money owed TO you — CA unclaimed property, IRS/FTB refunds, settlements |
| `/settings` | Business profile + AES-256-GCM encrypted EIN storage |

## Architecture

- **Next.js 16** (App Router, TypeScript) · **Tailwind v4** with brand tokens (#0A0A0A bg, #C9A84C gold)
- **SQLite** via better-sqlite3 (`wealth.db`, WAL mode, auto-seeded, gitignored)
- **Anthropic API** (`claude-sonnet-4-6`):
  - `/api/agent` — streaming SSE chat with the `web_search` server tool
  - `lib/quickbooks-client.ts` — QuickBooks MCP connector (`mcp_servers` param → `https://ai-inc.quickbooks.intuit.com/v1/mcp`), results cached 30 min in SQLite
  - deduction scanner + CA SOS live check
- **Tax engine** (`lib/tax-engine.ts`) — 2024 federal brackets (10–37%), CA brackets (1–12.3% + mental health tax), SE tax (net × 0.9235 × 15.3%), ½ SE deduction, QBI 20%, standard deduction $14,600, CA $800 franchise tax, quarterly schedules (fed 25%×4, CA 30/40/0/30)
- **Compliance score** — 100 minus 20/overdue-critical, 10/overdue-high, 5/due-in-7-days-unpaid; rendered as an SVG ring

## Security

- EIN is AES-256-GCM encrypted at rest, displayed only as `**-***1234`, never logged, never sent to any external API
- `wealth.db`, `.env.local`, and the dev `.encryption-key` are gitignored
- Every SQL query is parameterized (better-sqlite3 prepared statements)
- The AI agent receives financial context but **never** the EIN

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | AI agent, deduction scanner, SOS check, QB sync |
| `QB_MCP_ACCESS_TOKEN` | for QB sync | Intuit QuickBooks MCP authorization |
| `ENCRYPTION_KEY` | recommended | Master secret for EIN encryption (falls back to a generated dev key) |
| `DATABASE_PATH` | optional | SQLite location (default `./wealth.db`) |

> Not licensed tax advice. Verify with a licensed fiduciary.
