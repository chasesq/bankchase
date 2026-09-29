import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const templateId = typeof body.templateId === 'string'
      ? body.templateId
      : process.env.PLAID_IDV_TEMPLATE_ID;
    if (!templateId) {
      return NextResponse.json(
        { error: 'Identity Verification is not configured. Add PLAID_IDV_TEMPLATE_ID.' },
        { status: 503 },
      );
    }

    const plaidSecret = await getPlaidSecret(user.id);
    const token = await PlaidService.createIdentityVerificationLinkToken({
      clientUserId: user.id,
      emailAddress: user.email,
      templateId,
    }, plaidSecret);
    return NextResponse.json(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create identity verification link token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
