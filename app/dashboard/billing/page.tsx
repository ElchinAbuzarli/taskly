import { redirect } from 'next/navigation';
import BillingClient from '@/components/dashboard/BillingClient';
import { getUserWorkspaceContext } from '@/lib/access';
import { getPublicPricing } from '@/lib/pricing';

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const context = await getUserWorkspaceContext();
  if (!context?.user) redirect('/auth');
  if (!context.workspaceId) {
    return (
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Billing</h2>
        <p>No workspace found for this account.</p>
      </div>
    );
  }

  const plans = await getPublicPricing();
  const params = await searchParams;
  const requestedPlan = params.plan;
  const validRequestedPlan = requestedPlan && plans.some((p) => p.code === requestedPlan) ? requestedPlan : null;

  return (
    <BillingClient
      workspaceId={context.workspaceId}
      plans={plans}
      currentPlanCode={context.entitlements?.plan.code ?? null}
      initialSelectedPlanCode={validRequestedPlan}
    />
  );
}
