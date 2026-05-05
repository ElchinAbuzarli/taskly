import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const schema = z.object({
  workspaceId: z.string().min(1),
  planCode: z.string().min(1),
  cardNumber: z.string().min(12),
  cardHolder: z.string().min(2),
  expiry: z.string().min(4),
  cvc: z.string().min(3),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { code: parsed.data.planCode } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const memberOfWorkspace = user.memberships.some((m) => m.workspaceId === parsed.data.workspaceId);
    if (!memberOfWorkspace) {
      return NextResponse.json({ error: 'You do not belong to this workspace' }, { status: 403 });
    }

    const subscription = await prisma.subscription.upsert({
      where: { workspaceId: parsed.data.workspaceId },
      update: {
        planId: plan.id,
        status: 'active',
        stripeSubscriptionId: `fake_sub_${parsed.data.workspaceId}`,
      },
      create: {
        workspaceId: parsed.data.workspaceId,
        planId: plan.id,
        status: 'active',
        stripeSubscriptionId: `fake_sub_${parsed.data.workspaceId}`,
      },
    });

    await prisma.workspace.upsert({
      where: { id: parsed.data.workspaceId },
      update: { currentPlanId: plan.id },
      create: {
        id: parsed.data.workspaceId,
        name: 'New Workspace',
        currentPlanId: plan.id,
      },
    });

    return NextResponse.json({
      message: 'Fake payment accepted and subscription updated.',
      payment: {
        status: 'paid',
        amount: plan.monthlyPrice,
        currency: 'usd',
        method: `card_ending_${parsed.data.cardNumber.slice(-4)}`,
      },
      subscription,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
