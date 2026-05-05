import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getWorkspaceEntitlements } from '@/lib/pricing';

export async function getUserWorkspaceContext() {
  const user = await getCurrentUser();
  if (!user) return null;

  const activeMembership = user.memberships[0];
  if (!activeMembership) {
    return {
      user,
      workspaceId: null,
      entitlements: null,
      planFeatureKeys: [] as string[],
      planFeatureCodes: [] as string[],
    };
  }

  const entitlements = await getWorkspaceEntitlements(activeMembership.workspaceId);

  return {
    user,
    workspaceId: activeMembership.workspaceId,
    entitlements,
    planFeatureKeys: entitlements?.capabilityKeys ?? [],
    planFeatureCodes: entitlements?.features.filter((feature) => feature.included).map((feature) => feature.code) ?? [],
  };
}

export async function requireWorkspaceAccess(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const isMember = user.memberships.some((membership) => membership.workspaceId === workspaceId);
  if (!isMember) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'You do not belong to this workspace' }, { status: 403 }),
    };
  }

  const entitlements = await getWorkspaceEntitlements(workspaceId);
  if (!entitlements) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'No subscription found for workspace' }, { status: 404 }),
    };
  }

  return { ok: true as const, user, entitlements };
}

export async function requireCapability(workspaceId: string, capabilityKey: string) {
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.ok) return access;

  if (access.user.isAdmin) return access;

  const allowed = access.entitlements.capabilityKeys.includes(capabilityKey);
  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: 'Capability not included in your current plan',
          capabilityKey,
          plan: access.entitlements.plan.code,
        },
        { status: 403 },
      ),
    };
  }

  return access;
}
