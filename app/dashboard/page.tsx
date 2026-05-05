import { getUserWorkspaceContext } from '@/lib/access';
import { FEATURE_GATES } from '@/components/dashboard/Sidebar';
import Link from 'next/link';

export default async function DashboardHomePage() {
  const context = await getUserWorkspaceContext();
  const entitlements = context?.entitlements;
  const planCode = entitlements?.plan.code ?? 'none';
  const planName = entitlements?.plan.name ?? 'No active plan';
  const keys = context?.planFeatureKeys ?? [];
  const codes = context?.planFeatureCodes ?? [];
  const isAdmin = Boolean(context?.user?.isAdmin);

  return (
    <>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Dashboard Overview</h2>
        <p>Welcome {context?.user?.name}. Your panel access is fully based on purchased plan features.</p>
        <p><strong>Current Plan:</strong> {planName} <span className="admin-code">({planCode})</span></p>
        <p className="admin-code">Active capability keys: {keys.join(', ') || 'none'}</p>
        <p className="admin-code">Active feature codes: {codes.join(', ') || 'none'}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="admin-btn primary" href="/dashboard/billing">Change Plan</Link>
          <Link className="admin-btn" href="/pricing">View Pricing Matrix</Link>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Page Access By Plan Features</h3>
        <table className="admin-table">
          <thead>
            <tr><th>Page</th><th>Required Key</th><th>Status</th></tr>
          </thead>
          <tbody>
            {Object.entries(FEATURE_GATES).map(([page, key]) => {
              const allowed = isAdmin || keys.includes(key) || codes.includes(key);
              return (
                <tr key={page}>
                  <td>{page}</td>
                  <td className="admin-code">{key}</td>
                  <td>{allowed ? 'Accessible' : 'Locked'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
