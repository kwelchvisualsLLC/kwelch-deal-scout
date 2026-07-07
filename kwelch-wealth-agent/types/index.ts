export interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePct: number
  marketCap: number
  week52High: number
  week52Low: number
}

export interface Fundamentals {
  ticker: string
  pe: number | null
  eps: number | null
  dividendYield: number | null
  priceToBook: number | null
  roe: number | null
  debtToEquity: number | null
  freeCashFlow: number | null
  forwardPE: number | null
}

export interface PhilosophySignal {
  philosopher: 'Buffett' | 'Gates' | 'Musk' | 'Trump'
  verdict: 'YES' | 'NO' | 'WAIT'
  reasoning: string
  color: string
}

export interface TradeSignal {
  ticker: string
  signal: 'BUY' | 'HOLD' | 'SELL' | 'WATCH'
  confidence: number
  conviction: 'HIGH' | 'MEDIUM' | 'SPECULATIVE'
  thesis: string
  philosophers: PhilosophySignal[]
  positionSize: 'CORE' | 'SATELLITE' | 'SPECULATIVE'
  supportingData: string[]
  keyRisk: string
  action: string
}

export interface Position {
  id: number
  ticker: string
  shares: number
  entryPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  philosophy: string
  conviction: string
}

export interface RobinhoodHolding {
  id: number
  ticker: string
  name: string | null
  quantity: number
  costBasis: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  lastUpdated: string | null
}

export interface RobinhoodAccountSummary {
  totalValue: number
  buyingPower: number
  totalGainLoss: number
  totalGainLossPct: number
  lastSynced: string | null
}

export interface TradeRecord {
  id: number
  ticker: string
  action: 'buy' | 'sell'
  shares: number
  price: number
  timestamp: string
  philosophy: string | null
  alpacaOrderId: string | null
  notes: string | null
  pnl: number | null
}

export interface WatchlistItem {
  id: number
  ticker: string
  alertAbove: number | null
  alertBelow: number | null
  addedDate: string | null
  philosophySignal: string | null
  conviction: string | null
}

export interface InsurancePolicy {
  id: number
  policyType: string
  carrier: string
  policyNumberLast4: string
  deathBenefit: number
  cashValue: number | null
  surrenderValue: number | null
  annualPremium: number
  premiumFrequency: string
  policyStartDate: string
  policyEndDate: string | null
  isPermanent: boolean
  riders: string[]
  loanOutstanding: number | null
  uploadedAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface NetWorth {
  robinhoodValue: number
  paperPortfolioValue: number
  insuranceCashValue: number
  total: number
  retirementGoal: number
  retirementGap: number
}

export interface MonteCarloInput {
  currentAge: number
  currentSavings: number
  monthlyContribution: number
  targetAge: number
  annualIncomeNeed: number
  iterations?: number
}

export interface MonteCarloYearPoint {
  year: number
  conservative: number
  base: number
  optimistic: number
}

export interface MonteCarloResult {
  conservative: number
  base: number
  optimistic: number
  probabilityOfSuccess: number
  yearlyData: MonteCarloYearPoint[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
