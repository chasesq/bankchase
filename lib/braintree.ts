import braintree from 'braintree'

const merchantId = process.env.BRAINTREE_MERCHANT_ID || '4s5h8jbcq8b8jj58'
const publicKey = process.env.BRAINTREE_PUBLIC_KEY || process.env.API_KEY || process.env.apiKey || process.env.API_Key || 'ghb9tf2dbp774cnh'
const privateKey = process.env.BRAINTREE_PRIVATE_KEY || process.env.API_KEY_2 || process.env.apiKey_2 || process.env.Private_Key || process.env.Secret

export function getBraintreeGateway() {
  if (!publicKey || !privateKey) {
    throw new Error('Braintree sandbox credentials are not configured')
  }

  return new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId,
    publicKey,
    privateKey,
  })
}
