import { NextRequest, NextResponse } from 'next/server';
import { requireCapability } from '@/lib/access';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const workspaceId = body.workspaceId as string | undefined;

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const access = await requireCapability(workspaceId, 'leave_tracking');
  if (!access.ok) return access.response;

  return NextResponse.json({
    token: `fake_api_${workspaceId.slice(-6)}_${Date.now().toString().slice(-6)}`,
    message: 'API access token generated (fake).',
  });
}
