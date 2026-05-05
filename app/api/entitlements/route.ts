import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/access';

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.ok) return access.response;
  return NextResponse.json(access.entitlements);
}
