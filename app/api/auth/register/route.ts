import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createUserSession, hashPassword } from '@/lib/session';

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  workspaceName: z.string().min(2).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const freePlan = await prisma.plan.findUnique({ where: { code: 'free' } });
  if (!freePlan) return NextResponse.json({ error: 'Free plan not found. Run seed first.' }, { status: 500 });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      isAdmin: false,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.workspaceName ?? `${parsed.data.name}'s Workspace`,
      currentPlanId: freePlan.id,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'owner',
    },
  });

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      planId: freePlan.id,
      status: 'active',
      stripeSubscriptionId: `fake_sub_${workspace.id}`,
    },
  });

  await createUserSession(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    workspace: { id: workspace.id, name: workspace.name },
  });
}
