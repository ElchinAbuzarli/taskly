import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
