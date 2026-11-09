import { WorkspaceFeaturePage } from '@/components/workspace-feature-page'
import { PayPalCheckout } from '@/components/paypal-checkout'
import { BraintreeCheckout } from '@/components/braintree-checkout'
import { PayPalDonate } from '@/components/paypal-donate'
import { PayPalSandboxTesting } from '@/components/paypal-sandbox-testing'
import { PayPalVenmo } from '@/components/paypal-venmo'
import { FundingBalance } from '@/components/funding-balance'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <WorkspaceFeaturePage title="Payments" description="Review outgoing and incoming payment activity across your workspace." actions={['Payment activity', 'Recipients', 'Payment settings']} />
      <FundingBalance />
      <PayPalCheckout />
      <BraintreeCheckout />
      <PayPalDonate />
      <PayPalVenmo />
      <PayPalSandboxTesting />
    </div>
  )
}
