export interface ParsedCreditAlert {
  amount: number | null
  accountLast4: string | null
  sender: string | null
  date: string | null
  balance: number | null
}

const AMOUNT_PATTERN = /(?:Amt|Amount|\$)\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i
const ACCOUNT_PATTERN = /(?:Acct|Account|ending in)\s*:?\s*(?:\*{2,}|x{2,}|#?\s*)?(\d{4})(?!\d)/i
const BALANCE_PATTERN = /(?:Avail(?:able)?\s+Bal(?:ance)?|Bal(?:ance)?)\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i
const DATE_PATTERN = /(?:Date|Time)\s*:\s*(.+?)(?=\n|$)/i

function toAmount(value?: string): number | null {
  if (!value) return null
  const amount = Number(value.replace(/,/g, ""))
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function cleanSender(value: string): string | null {
  const sender = value
    .replace(/^CR\s*\/\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;]+$/, "")

  return sender || null
}

/** Parse common bank credit-alert SMS formats without throwing on malformed input. */
export function parseCreditAlert(smsText: string): ParsedCreditAlert {
  const text = typeof smsText === "string" ? smsText : ""
  const amount = toAmount(text.match(AMOUNT_PATTERN)?.[1])
  const accountLast4 = text.match(ACCOUNT_PATTERN)?.[1] ?? null
  const balance = toAmount(text.match(BALANCE_PATTERN)?.[1])
  const date = text.match(DATE_PATTERN)?.[1]?.trim() || null

  const description = text.match(/(?:Desc|Description)\s*:\s*(.+?)(?=\n|$)/i)?.[1]
  const senderFromDescription = description?.match(/CR\s*\/\s*(.+)$/i)?.[1]
  const senderFromFrom = text.match(/\bfrom\s+([A-Za-z][A-Za-z .'-]*?)(?=\s+(?:on|Date|Amt|Amount|Acct|Account)\b|[.,]|$)/i)?.[1]

  return {
    amount,
    accountLast4,
    sender: cleanSender(senderFromDescription || senderFromFrom || ""),
    date,
    balance,
  }
}

export interface CreditAlertInput {
  senderName: string
  amount: number
  receiverAccountLast4: string
  date?: Date
  balance?: number
  reference?: string
}

/** Generate a clearly labeled incoming-credit notification. */
export function generateCreditAlert(input: CreditAlertInput): string {
  if (!Number.isFinite(input.amount) || input.amount < 0) throw new Error("Amount must be a non-negative number")
  if (!/^\d{4}$/.test(input.receiverAccountLast4)) throw new Error("Account last four must contain exactly four digits")
  if (!input.senderName.trim()) throw new Error("Sender name is required")

  const timestamp = (input.date ?? new Date()).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const lines = [
    "Credit Alert",
    `Acct: ***${input.receiverAccountLast4}`,
    `Amt: $${input.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Desc: CR/${input.senderName.trim()}${input.reference ? ` / ${input.reference.trim()}` : ""}`,
    `Date: ${timestamp}`,
  ]

  if (input.balance !== undefined) {
    if (!Number.isFinite(input.balance) || input.balance < 0) throw new Error("Balance must be a non-negative number")
    lines.push(`Avail Bal: $${input.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}")
  }

  return lines.join("\n")
}

export function generateBankAlerts(input: CreditAlertInput & { receiverName: string }): {
  creditAlert: string
  debitAlert: string
} {
  const timestamp = (input.date ?? new Date()).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
  return {
    creditAlert: generateCreditAlert(input),
    debitAlert: `BankChase Alert: You sent $${input.amount.toFixed(2)} to ${input.receiverName.trim()} on ${timestamp}. If you did not approve this, contact support.`,
  }
}

export type { CreditAlertInput as GenerateCreditAlertInput }

export const creditAlertPatterns = {
  amount: AMOUNT_PATTERN,
  account: ACCOUNT_PATTERN,
  balance: BALANCE_PATTERN,
}

export default parseCreditAlert
