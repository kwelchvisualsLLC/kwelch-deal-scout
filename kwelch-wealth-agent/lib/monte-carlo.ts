export interface MonteCarloInput {
  currentAge: number
  currentSavings: number
  monthlyContribution: number
  targetAge: number
  annualIncomeNeed: number
  iterations?: number
}

export interface MonteCarloResult {
  conservative: number // 10th percentile final value
  base: number // 50th percentile final value
  optimistic: number // 90th percentile final value
  probabilityOfSuccess: number // % of runs that meet income need via 4% rule
  yearlyData: { year: number; conservative: number; base: number; optimistic: number }[]
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const {
    currentAge,
    currentSavings,
    monthlyContribution,
    targetAge,
    annualIncomeNeed,
    iterations = 1000,
  } = input

  const years = Math.max(1, targetAge - currentAge)
  const monthlyRate = { mean: 0.07 / 12, stdDev: 0.15 / Math.sqrt(12) }

  const finalValues: number[] = []
  const yearlyPercentiles: Map<number, number[]> = new Map()

  for (let i = 0; i < iterations; i++) {
    let balance = currentSavings

    for (let year = 1; year <= years; year++) {
      for (let month = 0; month < 12; month++) {
        // Box-Muller for normal distribution
        const u1 = Math.random()
        const u2 = Math.random()
        const z = Math.sqrt(-2 * Math.log(u1 || Number.MIN_VALUE)) * Math.cos(2 * Math.PI * u2)
        const monthReturn = monthlyRate.mean + monthlyRate.stdDev * z
        balance = balance * (1 + monthReturn) + monthlyContribution
      }

      if (!yearlyPercentiles.has(year)) yearlyPercentiles.set(year, [])
      yearlyPercentiles.get(year)!.push(balance)
    }

    finalValues.push(balance)
  }

  finalValues.sort((a, b) => a - b)

  const conservative = finalValues[Math.floor(iterations * 0.1)]
  const base = finalValues[Math.floor(iterations * 0.5)]
  const optimistic = finalValues[Math.floor(iterations * 0.9)]

  // Safe withdrawal rate: 4% rule
  const successCount = finalValues.filter((v) => v * 0.04 >= annualIncomeNeed).length
  const probabilityOfSuccess = (successCount / iterations) * 100

  const yearlyData = Array.from({ length: years }, (_, i) => {
    const year = i + 1
    const vals = (yearlyPercentiles.get(year) || []).sort((a, b) => a - b)
    return {
      year: currentAge + year,
      conservative: vals[Math.floor(vals.length * 0.1)] || 0,
      base: vals[Math.floor(vals.length * 0.5)] || 0,
      optimistic: vals[Math.floor(vals.length * 0.9)] || 0,
    }
  })

  return { conservative, base, optimistic, probabilityOfSuccess, yearlyData }
}
