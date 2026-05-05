import { requireCapabilityPage } from '@/lib/dashboard-auth';

export default async function ApiPage() {
  await requireCapabilityPage('leave_tracking');

  return (
    <div className="admin-card">
      <h2 style={{ marginTop: 0 }}>API Access</h2>
      <p>This page is unlocked by capability key: leave_tracking</p>
    </div>
  );
}
