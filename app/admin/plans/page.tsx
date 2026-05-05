'use client';

import { FormEvent, useEffect, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';

type Feature = { id: string; code: string; name: string };
type PlanFeature = { id: string; feature: { id: string; code: string; name: string } };
type Plan = { id: string; code: string; name: string; monthlyPrice: number; features: PlanFeature[] };

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

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [form, setForm] = useState({ name: '', monthlyPrice: 0 });
  const [selectedFeatureByPlan, setSelectedFeatureByPlan] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [planRes, featureRes] = await Promise.all([fetch('/api/admin/plans'), fetch('/api/admin/features')]);
    const planJson = await planRes.json();
    const featureJson = await featureRes.json();
    if (!planRes.ok) return setError(extractErrorMessage(planJson.error, 'Plans yuklenmedi'));
    if (!featureRes.ok) return setError(extractErrorMessage(featureJson.error, 'Features yuklenmedi'));
    setPlans(planJson.plans);
    setFeatures(featureJson.features);
  }

  useEffect(() => { load(); }, []);

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Plan yaradilmadi'));
    setForm({ name: '', monthlyPrice: 0 });
    setMessage('Plan yaradildi');
    load();
  }

  async function addFeatureToPlan(planId: string) {
    const featureId = selectedFeatureByPlan[planId];
    if (!featureId) return setError('Feature secin');
    setError(null);
    const res = await fetch(`/api/admin/plans/${planId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureId, included: true }),
    });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Feature plana elave edilmedi'));
    setMessage('Feature plana elave edildi');
    load();
  }

  async function removeFeatureFromPlan(planId: string, featureId: string) {
    setError(null);
    const res = await fetch(`/api/admin/plans/${planId}/features/${featureId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Feature plandan silinmedi'));
    setMessage('Feature plandan silindi');
    load();
  }

  return (
    <AdminGuard>
      <div className="admin-content-card">
        <h2 style={{ marginTop: 0 }}>Plans</h2>
        {message ? <p className="admin-msg-ok">{message}</p> : null}
        {error ? <p className="admin-msg-err">{error}</p> : null}
        <form onSubmit={createPlan}>
          <table className="admin-table">
            <tbody>
              <tr><td>Code</td><td><span className="admin-code">Auto-generated from Name</span></td></tr>
              <tr><td>Name</td><td><input className="admin-input" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></td></tr>
              <tr><td>Monthly Price (cent)</td><td><input className="admin-input" type="number" value={form.monthlyPrice} onChange={(e) => setForm((s) => ({ ...s, monthlyPrice: Number(e.target.value) }))} /></td></tr>
              <tr><td></td><td><button className="admin-btn primary" type="submit">Create plan</button></td></tr>
            </tbody>
          </table>
        </form>
      </div>

      <div className="admin-content-card">
        <h3 style={{ marginTop: 0 }}>All Plans</h3>
        <div className="pricing-grid">
          {plans.map((plan, idx) => {
            const includedFeatures = plan.features.length;
            return (
              <article key={plan.id} className={`pricing-card ${idx === 1 ? 'recommended' : ''}`} style={{ minHeight: 220 }}>
                {idx === 1 ? <span className="pricing-badge">Popular</span> : null}
                <h4 className="pricing-title">{plan.name}</h4>
                <p className="pricing-price">${(plan.monthlyPrice / 100).toFixed(0)}/mo</p>
                <p className="pricing-sub">Included features: {includedFeatures}</p>
                <p className="admin-code">code: {plan.code}</p>
                <div style={{ marginTop: 8 }}>
                  <strong style={{ fontSize: 14 }}>Add Feature</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <select
                      className="admin-select"
                      value={selectedFeatureByPlan[plan.id] ?? ''}
                      onChange={(e) => setSelectedFeatureByPlan((s) => ({ ...s, [plan.id]: e.target.value }))}
                    >
                      <option value="">Feature secin</option>
                      {features.map((feature) => (
                        <option key={feature.id} value={feature.id}>
                          {feature.name} ({feature.code})
                        </option>
                      ))}
                    </select>
                    <button className="admin-btn primary" type="button" onClick={() => addFeatureToPlan(plan.id)}>
                      Add
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <strong style={{ fontSize: 14 }}>Plan Features</strong>
                  <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                    {plan.features.length === 0 ? <span className="admin-code">No features yet</span> : null}
                    {plan.features.map((pf) => (
                      <div key={pf.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <span className="admin-code">{pf.feature.name} ({pf.feature.code})</span>
                        <button className="admin-btn" type="button" onClick={() => removeFeatureFromPlan(plan.id, pf.feature.id)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AdminGuard>
  );
}
