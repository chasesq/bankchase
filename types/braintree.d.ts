declare module 'braintree' {
  export const Environment: { Sandbox: unknown; Production: unknown }
  export class BraintreeGateway {
    constructor(options: { environment: unknown; merchantId: string; publicKey: string; privateKey: string })
    clientToken: { generate(options: Record<string, never>): Promise<{ clientToken: string }> }
    transaction: { sale(options: { amount: string; paymentMethodNonce: string; options: { submitForSettlement: boolean } }): Promise<{ success: boolean; message?: string; transaction: { id: string; status: string } }> }
  }
}

declare module 'braintree-web-drop-in' {
  export function create(options: { authorization: string; container: string }): Promise<{
    requestPaymentMethod(): Promise<{ nonce: string }>
    teardown(): Promise<void>
  }>
}
