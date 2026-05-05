import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/auth';

const planSchema = z.object({
  name: z.string().min(2),
  monthlyPrice: z.number().int().min(0),
  annualPrice: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  stripePriceId: z.string().nullable().optional(),
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function generateUniquePlanCode(name: string) {
  const base = slugify(name) || 'plan';
  let candidate = base;
  let index = 1;

  while (true) {
    const existing = await prisma.plan.findFirst({ where: { code: candidate } });
    if (!existing) return candidate;
    index += 1;
    candidate = `${base}_${index}`;
  }
}

export async function GET(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plans = await prisma.plan.findMany({
    orderBy: { monthlyPrice: 'asc' },
    include: {
      features: {
        include: { feature: true },
      },
    },
  });

  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const code = await generateUniquePlanCode(parsed.data.name);
  const plan = await prisma.plan.create({ data: { ...parsed.data, code } });
  return NextResponse.json({ plan }, { status: 201 });
}
