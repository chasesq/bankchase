import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('demo_transfers')
      .select('amount, status, transfer_type')
      .eq('admin_user_id', user.id);

    if (error) throw error;

    const transfers = data || [];
    return NextResponse.json({
      total_transfers: transfers.length,
      total_amount: transfers.reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0),
      completed_transfers: transfers.filter((transfer) => transfer.status === 'completed').length,
      pending_transfers: transfers.filter((transfer) => transfer.status === 'pending').length,
      internal_transfers: transfers.filter((transfer) => transfer.transfer_type === 'internal').length,
      external_transfers: transfers.filter((transfer) => transfer.transfer_type === 'external').length,
    });
  } catch (error) {
    console.error('[v0] Demo stats error:', error);
    return NextResponse.json({ error: 'Failed to load demo stats' }, { status: 500 });
  }
}
