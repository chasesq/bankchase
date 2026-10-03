import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = /required|must be|positive|array/i.test(message) ? 400 : 502;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const accessTokens = Array.isArray(body.accessTokens) ? body.accessTokens : [];
    if (!accessTokens.length) return NextResponse.json({ error: 'accessTokens must contain at least one Plaid access token.' }, { status: 400 });
    if (accessTokens.some((token: unknown) => typeof token !== 'string' || !token)) {
      return NextResponse.json({ error: 'accessTokens must contain non-empty strings.' }, { status: 400 });
    }
    const result = await PlaidService.createAssetReport({
      accessTokens,
      daysRequested: body.daysRequested,
      webhook: body.webhook,
      includeInsights: body.includeInsights,
      addOns: body.addOns,
      clientReportId: body.clientReportId,
      secret: await getPlaidSecret(user.id),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create asset report.');
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const assetReportId = request.nextUrl.searchParams.get('assetReportId');
    if (!assetReportId) return NextResponse.json({ error: 'assetReportId is required.' }, { status: 400 });
    const result = await PlaidService.getAssetReport(assetReportId, await getPlaidSecret(user.id), {
      includeInsights: request.nextUrl.searchParams.get('includeInsights') === 'true',
      fastReport: request.nextUrl.searchParams.get('fastReport') === 'true',
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve asset report.');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    if (typeof body.assetReportId !== 'string' || !body.assetReportId) {
      return NextResponse.json({ error: 'assetReportId is required.' }, { status: 400 });
    }
    const result = await PlaidService.refreshAssetReport(body.assetReportId, await getPlaidSecret(user.id));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to refresh asset report.');
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

