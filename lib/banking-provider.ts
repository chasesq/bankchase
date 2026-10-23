export type BankingMode = "simulated" | "connected"

export type BankingProviderStatus = {
  mode: BankingMode
  provider: "internal" | "quiltt" | "plaid"
  available: boolean
  message: string
}

/** Server-side capability boundary for simulated and connected banking data. */
export interface BankingProvider {
  readonly status: BankingProviderStatus
  getAccounts(userId: string): Promise<unknown[]>
  getTransactions(userId: string, accountId?: string): Promise<unknown[]>
}

export class SimulatedBankingProvider implements BankingProvider {
  readonly status: BankingProviderStatus = {
    mode: "simulated",
    provider: "internal",
    available: true,
    message: "Using application-owned simulated accounts.",
  }

  async getAccounts(_userId: string) {
    return []
  }

  async getTransactions(_userId: string, _accountId?: string) {
    return []
  }
}

export function getBankingProviderStatus(): BankingProviderStatus {
  const connected = Boolean(process.env.QUILTT_API_KEY_SECRET)
  return connected
    ? {
        mode: "connected",
        provider: "quiltt",
        available: true,
        message: "Akoya account linking through Quiltt is configured.",
      }
    : new SimulatedBankingProvider().status
}

export function getBankingProvider(): BankingProvider {
  // Plaid operations remain behind this boundary until a user-linked item and
  // server-side token storage are available. Never expose provider secrets to UI.
  return new SimulatedBankingProvider()
}
