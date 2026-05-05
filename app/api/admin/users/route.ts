import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      memberships: {
        include: {
          workspace: {
            include: {
              subscription: {
                include: {
                  plan: {
                    include: {
                      features: {
                        where: { included: true },
                        orderBy: { order: 'asc' },
                        include: { feature: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const data = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    workspaces: user.memberships.map((membership) => {
      const subscription = membership.workspace.subscription;
      const plan = subscription?.plan ?? null;
      const includedFeatures = plan?.features.map((pf) => ({
        code: pf.feature.code,
        key: pf.feature.key,
        name: pf.feature.name,
      })) ?? [];

      return {
        workspaceId: membership.workspace.id,
        workspaceName: membership.workspace.name,
        role: membership.role,
        plan: plan
          ? {
              code: plan.code,
              name: plan.name,
            }
          : null,
        featureCodes: includedFeatures.map((f) => f.code),
        capabilityKeys: includedFeatures.map((f) => f.key).filter(Boolean),
        features: includedFeatures,
      };
    }),
  }));

  return NextResponse.json({ users: data });
}
