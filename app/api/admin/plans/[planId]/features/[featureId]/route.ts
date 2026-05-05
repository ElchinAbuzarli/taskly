import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ planId: string; featureId: string }> },
) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, featureId } = await context.params;
  await prisma.planFeature.delete({ where: { planId_featureId: { planId, featureId } } });

  return NextResponse.json({ ok: true });
}
