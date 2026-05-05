import { prisma } from '@/lib/prisma';

export async function getPublicPricing() {
  if (!process.env.DATABASE_URL) return [];

  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
      include: {
        features: {
          orderBy: { order: 'asc' },
          include: { feature: true },
        },
      },
    });
    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      features: plan.features.map((pf) => ({
        code: pf.feature.code,
        key: pf.feature.key,
        name: pf.feature.name,
        description: pf.feature.description,
        included: pf.included,
        order: pf.order,
      })),
    }));
  } catch {
    return [];
  }
}

export async function getWorkspaceEntitlements(workspaceId: string) {
  if (!process.env.DATABASE_URL) return null;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: {
        plan: {
          include: {
            features: {
              orderBy: { order: 'asc' },
              include: { feature: true },
            },
          },
        },
      },
    });
    if (!subscription) return null;

    const features = subscription.plan.features.map((pf) => ({
      code: pf.feature.code,
      key: pf.feature.key,
      name: pf.feature.name,
      included: pf.included,
      order: pf.order,
    }));

    return {
      workspaceId,
      plan: {
        id: subscription.plan.id,
        code: subscription.plan.code,
        name: subscription.plan.name,
      },
      features,
      capabilityKeys: features.filter((f) => f.included && Boolean(f.key)).map((f) => f.key as string),
    };
  } catch {
    return null;
  }
}

export async function hasFeature(workspaceId: string, featureCode: string) {
  const entitlements = await getWorkspaceEntitlements(workspaceId);
  if (!entitlements) return false;

  return entitlements.features.some((f) => f.code === featureCode && f.included);
}
