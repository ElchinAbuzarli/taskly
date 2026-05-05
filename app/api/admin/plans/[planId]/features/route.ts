import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/auth';

const schema = z.object({
  featureId: z.string().min(1),
  included: z.boolean().default(true),
  order: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ planId: string }> }) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await context.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const planFeature = await prisma.planFeature.upsert({
    where: { planId_featureId: { planId, featureId: parsed.data.featureId } },
    update: {
      included: parsed.data.included,
      order: parsed.data.order ?? 0,
    },
    create: {
      planId,
      featureId: parsed.data.featureId,
      included: parsed.data.included,
      order: parsed.data.order ?? 0,
    },
  });

  return NextResponse.json({ planFeature });
}
