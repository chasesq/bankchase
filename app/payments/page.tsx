import { WorkspaceFeaturePage } from '@/components/workspace-feature-page'
import { PayPalCheckout } from '@/components/paypal-checkout'
import { PayPalSandboxTesting } from '@/components/paypal-sandbox-testing'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <WorkspaceFeaturePage title="Payments" description="Review outgoing and incoming payment activity across your workspace." actions={['Payment activity', 'Recipients', 'Payment settings']} />
      <PayPalCheckout />
      <PayPalSandboxTesting />
    </div>
  )
}
