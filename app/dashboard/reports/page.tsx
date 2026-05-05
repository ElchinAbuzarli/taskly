import { requireCapabilityPage } from '@/lib/dashboard-auth';

export default async function ReportsPage() {
  await requireCapabilityPage('advanced_reporting');

  return (
    <div className="admin-card">
      <h2 style={{ marginTop: 0 }}>Advanced Reports</h2>
      <p>This page is unlocked by capability key: advanced_reporting</p>
    </div>
  );
}
