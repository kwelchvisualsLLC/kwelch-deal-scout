import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { INSURANCE_EXTRACTION_PROMPT } from '@/lib/agent-prompt'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

const MAX_PDF_BYTES = 30 * 1024 * 1024 // stay under the 32MB API request limit

interface ExtractedPolicy {
  policy_type: string | null
  carrier: string | null
  policy_number_last4: string | null
  death_benefit: number | null
  cash_value: number | null
  surrender_value: number | null
  annual_premium: number | null
  premium_frequency: string | null
  policy_start_date: string | null
  policy_end_date: string | null
  is_permanent: boolean | null
  riders: string[] | null
  loan_outstanding: number | null
  primary_beneficiary_count: number | null
  contingent_beneficiary_count: number | null
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail('ANTHROPIC_API_KEY is not configured. Add it to .env.local.', 500)
  }

  let file: File | null
  try {
    const formData = await request.formData()
    file = formData.get('file') as File | null
  } catch {
    return fail('Expected multipart/form-data with a "file" field.', 400)
  }

  if (!file) return fail('No file provided. Attach a PDF as "file".', 400)
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return fail('Only PDF files are accepted.', 400)
  }
  if (file.size > MAX_PDF_BYTES) {
    return fail('PDF is too large — maximum 30MB.', 413)
  }

  // Process entirely in memory; the PDF is never written to disk
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  try {
    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            { type: 'text', text: INSURANCE_EXTRACTION_PROMPT },
          ],
        },
      ],
    })

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    // Tolerate accidental markdown fences around the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return fail('AI extraction did not return valid JSON. Try a clearer policy document.', 422)
    }

    const extracted = JSON.parse(jsonMatch[0]) as ExtractedPolicy
    const now = new Date().toISOString()

    const result = getDb()
      .prepare(
        `INSERT INTO insurance_policies (
          policy_type, carrier, policy_number_last4, death_benefit, cash_value, surrender_value,
          annual_premium, premium_frequency, policy_start_date, policy_end_date, is_permanent,
          riders, loan_outstanding, primary_beneficiary_count, contingent_beneficiary_count,
          uploaded_at, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        extracted.policy_type,
        extracted.carrier,
        extracted.policy_number_last4,
        extracted.death_benefit ?? 0,
        extracted.cash_value ?? 0,
        extracted.surrender_value ?? 0,
        extracted.annual_premium ?? 0,
        extracted.premium_frequency ?? 'Monthly',
        extracted.policy_start_date,
        extracted.policy_end_date,
        extracted.is_permanent ? 1 : 0,
        JSON.stringify(extracted.riders ?? []),
        extracted.loan_outstanding ?? 0,
        extracted.primary_beneficiary_count ?? 0,
        extracted.contingent_beneficiary_count ?? 0,
        now,
        now
      )

    return ok({ id: Number(result.lastInsertRowid), ...extracted })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fail('AI extraction returned malformed JSON. Try re-uploading the policy.', 422)
    }
    const message = error instanceof Error ? error.message : 'Extraction failed'
    return fail(`Policy extraction failed: ${message}`, 502)
  }
}
