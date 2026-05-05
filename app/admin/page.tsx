'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';

type Feature = { id: string };
type Plan = { id: string; features: { id: string }[] };

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybe = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const firstForm = maybe.formErrors?.[0];
    if (firstForm) return firstForm;
    const firstField = maybe.fieldErrors ? Object.values(maybe.fieldErrors).flat()[0] : undefined;
    if (firstField) return firstField;
  }
  return fallback;
}

export default function AdminDashboardPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [fRes, pRes] = await Promise.all([fetch('/api/admin/features'), fetch('/api/admin/plans')]);
    const fJson = await fRes.json();
    const pJson = await pRes.json();
    if (!fRes.ok) return setError(extractErrorMessage(fJson.error, 'Features yuklenmedi'));
    if (!pRes.ok) return setError(extractErrorMessage(pJson.error, 'Plans yuklenmedi'));
    setFeatures(fJson.features);
    setPlans(pJson.plans);
  }

  useEffect(() => { load(); }, []);

  const mappingCount = useMemo(() => plans.reduce((a, p) => a + p.features.length, 0), [plans]);

  return (
    <AdminGuard>
      <div className="admin-content-card">
        <h2 style={{ marginTop: 0 }}>Dashboard Summary</h2>
        {error ? <p className="admin-msg-err">{error}</p> : null}
        <table className="admin-table">
          <thead>
            <tr><th>Metric</th><th>Value</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Plans</td><td>{plans.length}</td><td rowSpan={3}><button className="admin-btn primary" onClick={load}>Refresh</button></td></tr>
            <tr><td>Total Features</td><td>{features.length}</td></tr>
            <tr><td>Total Mappings</td><td>{mappingCount}</td></tr>
          </tbody>
        </table>
      </div>
    </AdminGuard>
  );
}
