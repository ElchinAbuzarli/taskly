import { NextRequest, NextResponse } from 'next/server';
import { requireCapability } from '@/lib/access';

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const access = await requireCapability(workspaceId, 'advanced_reporting');
  if (!access.ok) return access.response;

  return NextResponse.json({
    events: [
      { id: 'evt-1', title: 'Launch planning', date: '2026-05-10' },
      { id: 'evt-2', title: 'Team retro', date: '2026-05-14' },
    ],
    message: 'Calendar data is available for your plan.',
  });
}
