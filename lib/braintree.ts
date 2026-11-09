import braintree from 'braintree'

const merchantId = process.env.Merchant_ID || process.env.BRAINTREE_MERCHANT_ID || '4s5h8jbcq8b8jj58'
const publicKey = process.env.Public_Key || process.env.BRAINTREE_PUBLIC_KEY || process.env.API_KEY || process.env.apiKey || process.env.API_Key
const privateKey = process.env.Private_Key || process.env.Private_Keys || process.env.BRAINTREE_PRIVATE_KEY || process.env.API_KEY_2 || process.env.apiKey_2 || process.env.Secret

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
