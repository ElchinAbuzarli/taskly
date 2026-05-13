import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createUserSession, hashPassword } from '@/lib/session';

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: { message: 'DATABASE_URL is not configured' } }, { status: 500 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });

    if (!user || user.passwordHash !== hashPassword(parsed.data.password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await createUserSession(user.id);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      workspaces: user.memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
