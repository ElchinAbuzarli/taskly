'use client';

import { FormEvent, useEffect, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';

type Feature = { id: string; code: string; key?: string | null };
type PlanFeature = { id: string; included: boolean; order: number; feature: Feature };
type Plan = { id: string; code: string; name: string; features: PlanFeature[] };

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

export default function AdminMappingsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [form, setForm] = useState({ planId: '', featureId: '', included: true, order: 0 });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadAll() {
    const [pRes, fRes] = await Promise.all([fetch('/api/admin/plans'), fetch('/api/admin/features')]);
    const pJson = await pRes.json();
    const fJson = await fRes.json();

    if (!pRes.ok) return setError(extractErrorMessage(pJson.error, 'Plans yuklenmedi'));
    if (!fRes.ok) return setError(extractErrorMessage(fJson.error, 'Features yuklenmedi'));

    setPlans(pJson.plans);
    setFeatures(fJson.features);

    if (!form.planId && pJson.plans[0]) setForm((s) => ({ ...s, planId: pJson.plans[0].id }));
    if (!form.featureId && fJson.features[0]) setForm((s) => ({ ...s, featureId: fJson.features[0].id }));
  }

  useEffect(() => { loadAll(); }, []);

  async function saveMapping(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/admin/plans/${form.planId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureId: form.featureId, included: form.included, order: form.order }),
    });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Mapping save edilmedi'));

    setMessage('Mapping save edildi');
    loadAll();
  }

  async function remove(planId: string, featureId: string) {
    setError(null);
    const res = await fetch(`/api/admin/plans/${planId}/features/${featureId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Silinmedi'));
    setMessage('Mapping silindi');
    loadAll();
  }

  return (
    <AdminGuard>
      <div className="admin-content-card">
        <h2 style={{ marginTop: 0 }}>Plan - Feature Mapping</h2>
        {message ? <p className="admin-msg-ok">{message}</p> : null}
        {error ? <p className="admin-msg-err">{error}</p> : null}
        <form onSubmit={saveMapping}>
          <table className="admin-table">
            <tbody>
              <tr>
                <td>Plan</td>
                <td>
                  <select className="admin-select" value={form.planId} onChange={(e) => setForm((s) => ({ ...s, planId: e.target.value }))}>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Feature</td>
                <td>
                  <select className="admin-select" value={form.featureId} onChange={(e) => setForm((s) => ({ ...s, featureId: e.target.value }))}>
                    {features.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Included</td>
                <td><input type="checkbox" checked={form.included} onChange={(e) => setForm((s) => ({ ...s, included: e.target.checked }))} /></td>
              </tr>
              <tr>
                <td>Order</td>
                <td><input className="admin-input" type="number" value={form.order} onChange={(e) => setForm((s) => ({ ...s, order: Number(e.target.value) }))} /></td>
              </tr>
              <tr>
                <td></td>
                <td><button className="admin-btn primary" type="submit">Save mapping</button></td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>

      <div className="admin-content-card">
        <table className="admin-table">
          <thead><tr><th>Plan</th><th>Feature</th><th>Capability Key</th><th>Included</th><th>Order</th><th>Action</th></tr></thead>
          <tbody>
            {plans.flatMap((plan) => plan.features.map((pf) => (
              <tr key={`${plan.id}-${pf.feature.id}`}>
                <td>{plan.name}</td>
                <td className="admin-code">{pf.feature.code}</td>
                <td className="admin-code">{pf.feature.key || '-'}</td>
                <td>{pf.included ? 'Yes' : 'No'}</td>
                <td>{pf.order}</td>
                <td><button className="admin-btn" onClick={() => remove(plan.id, pf.feature.id)}>Remove</button></td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </AdminGuard>
  );
}
