import { redirect } from 'next/navigation';
import { getUserWorkspaceContext } from '@/lib/access';

type CapabilityRequirement = {
  capabilityKey?: string;
  featureCode?: string;
};

export async function requireCapabilityPage(requirement: string | CapabilityRequirement) {
  const context = await getUserWorkspaceContext();
  const normalized: CapabilityRequirement = typeof requirement === 'string' ? { capabilityKey: requirement, featureCode: requirement } : requirement;

  if (!context?.user) {
    redirect('/auth');
  }

  if (context.user.isAdmin) return context;

  if (!context.entitlements) {
    redirect('/dashboard/upgrade');
  }

  const hasCapabilityKey = normalized.capabilityKey ? context.planFeatureKeys.includes(normalized.capabilityKey) : false;
  const hasFeatureCode = normalized.featureCode ? context.planFeatureCodes.includes(normalized.featureCode) : false;

  if (!hasCapabilityKey && !hasFeatureCode) {
    redirect('/dashboard/upgrade');
  }

  return context;
}
