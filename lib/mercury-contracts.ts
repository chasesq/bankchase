export type MercuryCardNetwork = "visa" | "mastercard"
export type MercuryCardStatus = "active" | "inactive" | "frozen" | "cancelled" | "expired"
export type MercuryCardType = "virtual" | "physical"
export type MercuryTransferStatus = "pendingApproval" | "processing" | "completed" | "failed"

export type MercuryCard = {
  cardId: string
  createdAt: string
  lastFourDigits: string
  nameOnCard: string
  network: MercuryCardNetwork
  physicalCardStatus: MercuryCardStatus
  spendLimit: { amountCents: number; atmAmountCents: number; interval: "daily" | "weekly" | "monthly" }
  status: MercuryCardStatus
  type: MercuryCardType
  updatedAt: string
  userId: string
}

export type MercuryTransferRequest = {
  accountId: string
  amount: number
  createdAt: string
  memo?: string
  numberOfApproversRequired: number
  paymentMethod: "ach" | "wire" | "internal"
  recipientId: string
  requestId: string
  requestedByUserId: string
  requesterMayApprove: boolean
  reviews: Array<{ reviewedAt: string; reviewerUserId: string; status: "approved" | "rejected" | "pending" }>
  scheduledSendDate?: string
  status: MercuryTransferStatus
}

export function centsToDollars(amountCents: number) {
  return Math.round(amountCents) / 100
}

export function maskLastFour(lastFourDigits: string) {
  return `•••• ${lastFourDigits.slice(-4)}`
}

export function normalizeTransferStatus(status: string): MercuryTransferStatus {
  if (status === "pending" || status === "pendingApproval") return "pendingApproval"
  if (status === "processing") return "processing"
  if (status === "completed" || status === "succeeded") return "completed"
  return "failed"
}

export function isPendingTransfer(status: string) {
  return status === "pending" || status === "pendingApproval" || status === "processing"
}
