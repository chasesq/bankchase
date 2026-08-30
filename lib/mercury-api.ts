import "server-only"

import { createClient } from "@/lib/supabase/server"

const MERCURY_API_BASE = "https://api.mercury.com/api/v1"
const MERCURY_VAULT_BASE = "https://vault-api.mercury.com/api/v1"

const mercuryToken = () =>
  process.env.MERCURY_API_KEY ?? process.env.MERCURY_API_TOKEN ?? process.env.MERCURY_ACCESS_TOKEN

type MercuryRequestOptions = RequestInit & { vault?: boolean }

export class MercuryApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "MercuryApiError"
    this.status = status
    this.details = details
  }
}

function getToken() {
  const token = mercuryToken()
  if (!token) throw new MercuryApiError("Mercury is not connected", 503)
  return token
}

export function isMercuryConfigured() {
  return Boolean(mercuryToken())
}

export async function requireMercuryUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new MercuryApiError("Unauthorized", 401)
  return data.user
}

export async function mercuryRequest<T>(path: string, options: MercuryRequestOptions = {}): Promise<T> {
  const token = getToken()
  const { vault, headers, ...init } = options
  const response = await fetch(`${vault ? MERCURY_VAULT_BASE : MERCURY_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    let details: unknown
    try { details = await response.json() } catch { details = undefined }
    throw new MercuryApiError(`Mercury request failed (${response.status})`, response.status, details)
  }

  if (response.status === 204) return undefined as T
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/pdf")) return (await response.arrayBuffer()) as T
  return response.json() as Promise<T>
}

export type MercuryCategory = {
  id: string
  name: string
  visibleForCardSpend: boolean
  visibleForOther: boolean
  visibleForReimbursements: boolean
}

export type MercuryOrganization = {
  id: string
  kind: "personal" | "business"
  legalBusinessName: string
  dbas: Array<{ dbaName: string; dbaIsDefault: boolean }>
  subscriptionTier: string
  billingCadence: "monthly" | "annual"
  ein?: string | null
}

export type MercuryUser = {
  userId: string
  firstName: string
  lastName: string
  email: string
  organizationRole: "administrator" | "bookkeeper" | "customUser" | "cardOnlyUser" | "employee"
}

export type MercuryCustomer = {
  id: string
  name: string
  email: string
  deletedAt?: string | null
  address?: { name?: string; address1: string; address2?: string | null; city: string; region: string; postalCode: string; country: string } | null
}

export type MercurySafe = {
  id: string
  documentUrl: string
  expiresAt: string
  investmentAmount: number
  investmentDate: string
  valuationType: "PreMoney" | "PostMoney" | "NoValuation"
  valuationCap?: number | null
  discountRate?: number | null
  canceledAt?: string | null
  paidAt?: string | null
  signedByInvestorAt?: string | null
  signedByOwnerAt?: string | null
  investor: { signatoryName: string; signatoryEmail: string; legalEntityName: string; investorType: string }
  organization: { legalEntityName: string; signatoryEmail: string; signatoryName: string; signatoryTitle: string }
}

export type MercuryAccount = {
  id: string
  name?: string
  kind?: string
  type?: string
  accountNumber?: string
  routingNumber?: string
  availableBalance?: number
  currentBalance?: number
  balance?: number
  status?: string
}

export type MercuryStatement = {
  id: string
  accountId?: string
  startDate?: string
  endDate?: string
  statementDate?: string
  endingBalance?: number
  downloadUrl?: string
  pdfUrl?: string
  csvUrl?: string
}

export async function listAccounts(query = "") {
  return mercuryRequest<{ accounts: MercuryAccount[]; page?: { nextPage?: string; previousPage?: string } }>(`/accounts${query}`)
}

export async function listStatements(accountId: string, query = "") {
  return mercuryRequest<{ statements: MercuryStatement[]; page?: { nextPage?: string; previousPage?: string } }>(`/account/${encodeURIComponent(accountId)}/statements${query}`)
}

export async function listCategories(query = "") {
  return mercuryRequest<{ categories: MercuryCategory[]; page: { nextPage?: string; previousPage?: string } }>(`/categories${query}`)
}

export async function listUsers(query = "") {
  return mercuryRequest<{ users: MercuryUser[]; page: { nextPage?: string; previousPage?: string } }>(`/users${query}`)
}

export async function getOrganization() {
  return mercuryRequest<{ organization: MercuryOrganization }>("/organization")
}

export async function listCustomers(query = "") {
  return mercuryRequest<{ customers: MercuryCustomer[]; page: { nextPage?: string; previousPage?: string } }>(`/ar/customers${query}`)
}

export async function listSafes() {
  return mercuryRequest<MercurySafe[]>("/safes")
}

export async function getCard(cardId: string) {
  return mercuryRequest(`/cards/${encodeURIComponent(cardId)}`)
}

export async function revealAgentCard(cardId: string) {
  return mercuryRequest<{ cardNumber: string; cvc: string; expiration: { month: number; year: number } }>(`/cards/${encodeURIComponent(cardId)}/reveal`, { vault: true })
}
