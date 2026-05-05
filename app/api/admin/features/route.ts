import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/auth';

const createFeatureSchema = z.object({
  key: z.string().min(2).optional().nullable(),
  name: z.string().min(2),
  description: z.string().optional(),
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function generateUniqueCode(name: string) {
  const base = slugify(name) || 'feature';
  let candidate = base;
  let index = 1;

  while (true) {
    const existing = await prisma.feature.findFirst({ where: { code: candidate } });
    if (!existing) return candidate;
    index += 1;
    candidate = `${base}_${index}`;
  }
}

export async function GET(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const features = await prisma.feature.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ features });
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createFeatureSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.key) {
    const existingByKey = await prisma.feature.findFirst({ where: { key: parsed.data.key } });
    if (existingByKey) {
      return NextResponse.json({ error: 'Feature key must be unique' }, { status: 409 });
    }
  }

  const code = await generateUniqueCode(parsed.data.name);
  const feature = await prisma.feature.create({
    data: {
      code,
      key: parsed.data.key ?? null,
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });
  return NextResponse.json({ feature }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.feature.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
