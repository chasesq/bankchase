import { z } from 'zod'

const sourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  publisher: z.string().min(1),
  published: z.string().date(),
})

const investmentSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  company: z.object({
    name: z.string().min(1),
    domain: z.string().min(1),
    website: z.string().url(),
    description: z.string().min(1),
    sector: z.string().min(1),
    headquarters: z.string().min(1),
  }),
  stage: z.string().min(1),
  stage_as_written: z.string().min(1),
  amount: z.object({
    usd_millions: z.number().nonnegative(),
    as_written: z.string().min(1),
    currency: z.literal('USD'),
  }),
  valuation: z.number().nonnegative().nullable(),
  total_as_written: z.string().min(1),
  announced_on: z.string().date(),
  date_precision: z.enum(['day', 'month', 'year']),
  certainty: z.string().min(1),
  verified: z.boolean(),
  provisional: z.boolean(),
  earlier_round: z.boolean(),
  is_extension: z.boolean(),
  lead_investors: z.array(z.string().min(1)),
  other_investors: z.array(z.string().min(1)),
  evidence: z.string().min(1),
  sources: z.array(sourceSchema),
  source_count: z.number().int().nonnegative(),
  trending: z.boolean().nullable(),
})

const payloadSchema = z.object({
  data: z.array(z.unknown()),
  next_cursor: z.string().nullable(),
})

export type FirecrawlInvestment = z.infer<typeof investmentSchema>
export type NormalizedInvestment = Omit<FirecrawlInvestment, 'company' | 'sources'> & {
  company_name: string
  company_domain: string
  company_website: string
  company_description: string
  sector: string
  headquarters: string
  sources: Array<z.infer<typeof sourceSchema>>
}

export function validateAndTransformFirecrawlJson(input: unknown): {
  records: NormalizedInvestment[]
  nextCursor: string | null
} {
  const payload = payloadSchema.parse(input)
  const records = payload.data.map((record, index) => {
    const parsed = investmentSchema.parse(record)
    return {
      id: parsed.id,
      url: parsed.url,
      stage: parsed.stage,
      stage_as_written: parsed.stage_as_written,
      amount: parsed.amount,
      valuation: parsed.valuation,
      total_as_written: parsed.total_as_written,
      announced_on: parsed.announced_on,
      date_precision: parsed.date_precision,
      certainty: parsed.certainty,
      verified: parsed.verified,
      provisional: parsed.provisional,
      earlier_round: parsed.earlier_round,
      is_extension: parsed.is_extension,
      lead_investors: parsed.lead_investors,
      other_investors: parsed.other_investors,
      evidence: parsed.evidence,
      source_count: parsed.source_count,
      trending: parsed.trending,
      company_name: parsed.company.name,
      company_domain: parsed.company.domain,
      company_website: parsed.company.website,
      company_description: parsed.company.description,
      sector: parsed.company.sector,
      headquarters: parsed.company.headquarters,
      sources: parsed.sources,
    } satisfies NormalizedInvestment
  })

  return { records, nextCursor: payload.next_cursor }
}

export function safeValidateAndTransformFirecrawlJson(input: unknown) {
  const result = payloadSchema.safeParse(input)
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.') || 'root',
        message: issue.message,
      })),
    }
  }

  const records: NormalizedInvestment[] = []
  const errors: Array<{ path: string; message: string }> = []

  result.data.data.forEach((record, index) => {
    const parsed = investmentSchema.safeParse(record)
    if (!parsed.success) {
      errors.push(
        ...parsed.error.issues.map((issue) => ({
          path: `data.${index}${issue.path.length ? `.${issue.path.join('.')}` : ''}`,
          message: issue.message,
        })),
      )
      return
    }

    const { company, ...investment } = parsed.data
    records.push({
      ...investment,
      company_name: company.name,
      company_domain: company.domain,
      company_website: company.website,
      company_description: company.description,
      sector: company.sector,
      headquarters: company.headquarters,
    })
  })

  return errors.length
    ? { success: false as const, records, nextCursor: result.data.next_cursor, errors }
    : { success: true as const, records, nextCursor: result.data.next_cursor }
}

export { investmentSchema, payloadSchema }
