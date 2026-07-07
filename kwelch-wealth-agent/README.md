# KWELCH WEALTH AGENT

A private, full-stack AI wealth management dashboard built for Keith Welch Jr. It connects a real Robinhood account via Plaid, parses life insurance policies with Claude AI, runs stock analysis through four investment philosophies (Buffett, Gates, Musk, Trump), executes simulated trades on Alpaca's paper API, and projects retirement with Monte Carlo simulation. A streaming AI agent chat ties it all together with full knowledge of the tracked financial picture.

## Prerequisites

- **Node.js 18+**
- Free accounts / API keys for:
  - [Anthropic](https://console.anthropic.com) — AI agent + PDF extraction
  - [Plaid](https://dashboard.plaid.com) — Robinhood connection
  - [Alpaca](https://alpaca.markets) — paper trading
  - [Alpha Vantage](https://www.alphavantage.co/support/#api-key) — stock fundamentals

## Setup

```bash
git clone <repo>
cd kwelch-wealth-agent
npm install
cp .env.example .env.local
# fill in every key in .env.local (see below)
npm run dev
```

Open http://localhost:3000.

### Environment variables (`.env.local`)

| Key | Where to get it |
| --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | dashboard.plaid.com → Team Settings → Keys (use the **sandbox** secret to start) |
| `PLAID_ENV` | `sandbox` for testing, `production` when live |
| `ALPACA_KEY` / `ALPACA_SECRET` | alpaca.markets → Paper Trading → API Keys |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` |
| `ALPHA_VANTAGE_KEY` | alphavantage.co → free API key |
| `ENCRYPTION_KEY` | run `openssl rand -hex 32` |

## Service setup guides

**Plaid** — dashboard.plaid.com → create an app → enable the **Investments** product → copy client ID + sandbox secret. In sandbox, Plaid Link accepts test credentials (`user_good` / `pass_good`).

**Alpaca** — alpaca.markets → sign up → switch to **Paper Trading** in the dashboard → generate API keys. Paper trading is free and never touches real money.

**Alpha Vantage** — alphavantage.co → claim a free API key (25 requests/day on the free tier; fundamentals are cached for 24h to stay under it).

## First run

The SQLite database (`wealth.db`) auto-creates and seeds on the first request:

- 5 paper positions (AAPL, NVDA, BRK.B, MSFT, TSLA)
- 6 watchlist tickers (PLTR, OXY, KO, AMD, RTX, IYR)
- 1 welcome message from the agent

## Connecting Robinhood

Go to **Portfolio → ROBINHOOD tab → Connect Robinhood via Plaid** and log in. Holdings sync automatically and are cached for 30 minutes; use the Sync button to force a refresh. Plaid access tokens are AES-256 encrypted at rest.

## Adding insurance policies

Go to **Insurance → Upload Policy** and drag in a PDF. Claude extracts the policy type, carrier, death benefit, cash value, premiums, riders, and beneficiary counts. The PDF is processed entirely in memory — it is never written to disk.

## Notes

- **Paper mode**: all trading is simulated. If Alpaca keys are missing, trades still record locally against reference prices so the workflow can be tested end-to-end.
- The Alpaca integration calls the paper REST API directly with `fetch` (no legacy SDK), keeping the server bundle lean.
- Chat history, watchlist, positions, policies, and market-data caches all live in `wealth.db` (gitignored).

## Production

1. Set `PLAID_ENV=production` and swap in your production Plaid secret.
2. Deploy to Vercel: `vercel --prod` (add all env vars in the Vercel dashboard). Note: SQLite needs a persistent disk — on serverless hosts, mount a volume or swap `lib/db.ts` to Turso/LiteFS.
3. Keep `NEXT_PUBLIC_APP_MODE=PAPER` until you have verified signals — the app is a research tool, not an execution engine.

---

*All signals are informational only. Not licensed financial advice. Consult a registered fiduciary before trading with real capital.*
