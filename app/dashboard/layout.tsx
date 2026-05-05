import '../admin/admin.css';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { getUserWorkspaceContext } from '@/lib/access';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const context = await getUserWorkspaceContext();

  if (!context?.user) {
    redirect('/auth');
  }

  return (
    <main className="admin-container" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Sidebar
        planFeatureKeys={context.planFeatureKeys}
        planFeatureCodes={context.planFeatureCodes}
        isAdmin={context.user.isAdmin}
        hasPlan={Boolean(context.entitlements)}
      />
      <section style={{ flex: 1 }}>{children}</section>
    </main>
  );
}
