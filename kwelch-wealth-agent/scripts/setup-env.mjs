// One-time bootstrap: creates .env.local from .env.example and fills in a
// freshly generated ENCRYPTION_KEY. Run with: npm run setup
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const EXAMPLE = new URL('../.env.example', import.meta.url)
const TARGET = new URL('../.env.local', import.meta.url)

if (existsSync(TARGET)) {
  console.log('.env.local already exists — leaving it untouched.')
  process.exit(0)
}

const key = randomBytes(32).toString('hex')
const template = readFileSync(EXAMPLE, 'utf8').replace(/^ENCRYPTION_KEY=.*$/m, `ENCRYPTION_KEY=${key}`)
writeFileSync(TARGET, template)

console.log('Created .env.local with a generated ENCRYPTION_KEY.')
console.log('Now paste in your keys:')
console.log('  ANTHROPIC_API_KEY   → console.anthropic.com')
console.log('  PLAID_CLIENT_ID/SECRET → dashboard.plaid.com')
console.log('  ALPACA_KEY/SECRET   → alpaca.markets (paper trading)')
console.log('  ALPHA_VANTAGE_KEY   → alphavantage.co')
