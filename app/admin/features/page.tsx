'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';

type Feature = {
  id: string;
  code: string;
  key?: string | null;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  features: {
    included: boolean;
    order: number;
    feature: { id: string; code: string; key?: string | null; name: string };
  }[];
};

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

const CAPABILITY_KEY_OPTIONS = [
  { value: '', label: 'No gating key (descriptive only)' },
  { value: 'employee_profiles', label: 'employee_profiles (Employees page)' },
  { value: 'advanced_reporting', label: 'advanced_reporting (Reports page)' },
  { value: 'leave_tracking', label: 'leave_tracking (API/Billing gated page)' },
  { value: '__custom__', label: 'Custom key...' },
];

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ key: '', name: '', description: '' });
  const [selectedKeyOption, setSelectedKeyOption] = useState('');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [featureRes, plansRes] = await Promise.all([fetch('/api/admin/features'), fetch('/api/admin/plans')]);
    const featureJson = await featureRes.json();
    const plansJson = await plansRes.json();

    if (!featureRes.ok) return setError(extractErrorMessage(featureJson.error, 'Features yuklenmedi'));
    if (!plansRes.ok) return setError(extractErrorMessage(plansJson.error, 'Plans yuklenmedi'));

    setFeatures(featureJson.features);
    setPlans(plansJson.plans);
  }

  useEffect(() => {
    load();
  }, []);

  async function createFeature(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: form.key.trim() === '' ? null : form.key.trim(),
        name: form.name,
        description: form.description,
      }),
    });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Yaradilmadi'));
    setForm({ key: '', name: '', description: '' });
    setSelectedKeyOption('');
    setMessage('Feature yaradildi');
    load();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/features?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Silinmedi'));
    setMessage('Feature silindi');
    if (selectedFeatureId === id) setSelectedFeatureId(null);
    load();
  }

  const selectedFeature = useMemo(
    () => features.find((f) => f.id === selectedFeatureId) ?? null,
    [features, selectedFeatureId],
  );

  const linkedPlans = useMemo(() => {
    if (!selectedFeature) return [];
    return plans
      .map((plan) => {
        const relation = plan.features.find((pf) => pf.feature.id === selectedFeature.id);
        if (!relation) return null;
        return {
          id: plan.id,
          name: plan.name,
          code: plan.code,
          included: relation.included,
          order: relation.order,
        };
      })
      .filter(Boolean) as { id: string; name: string; code: string; included: boolean; order: number }[];
  }, [plans, selectedFeature]);

  return (
    <AdminGuard>
      <div className="admin-content-card">
        <h2 style={{ marginTop: 0 }}>Features Library</h2>
        {message ? <p className="admin-msg-ok">{message}</p> : null}
        {error ? <p className="admin-msg-err">{error}</p> : null}
        <form onSubmit={createFeature}>
          <table className="admin-table">
            <tbody>
              <tr><td>Code</td><td><span className="admin-code">Auto-generated from Name</span></td></tr>
              <tr>
                <td>Capability Key</td>
                <td>
                  <select className="admin-select" value={selectedKeyOption} onChange={(e) => {
                    const option = e.target.value;
                    setSelectedKeyOption(option);
                    if (option !== '__custom__') setForm((s) => ({ ...s, key: option }));
                  }}>
                    {CAPABILITY_KEY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  {selectedKeyOption === '__custom__' ? <input className="admin-input" value={form.key} onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))} /> : null}
                </td>
              </tr>
              <tr><td>Name</td><td><input className="admin-input" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></td></tr>
              <tr><td>Description</td><td><input className="admin-input" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} /></td></tr>
              <tr><td></td><td><button className="admin-btn primary" type="submit">Create feature</button></td></tr>
            </tbody>
          </table>
        </form>
      </div>

      <div className="admin-content-card">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Key</th><th>Name</th><th>Description</th><th>Action</th></tr></thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.id} onClick={() => setSelectedFeatureId(f.id)} style={{ cursor: 'pointer' }}>
                <td className="admin-code">{f.code}</td>
                <td className="admin-code">{f.key || '-'}</td>
                <td>{f.name}</td>
                <td>{f.description || '-'}</td>
                <td>
                  <button
                    className="admin-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(f.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedFeature ? (
        <div
          onClick={() => setSelectedFeatureId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div className="admin-content-card" onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Feature Details</h3>
              <button className="admin-btn" onClick={() => setSelectedFeatureId(null)}>Close</button>
            </div>

            <table className="admin-table" style={{ marginTop: 12 }}>
              <tbody>
                <tr><td style={{ width: 180 }}>Code</td><td className="admin-code">{selectedFeature.code}</td></tr>
                <tr><td>Capability Key</td><td className="admin-code">{selectedFeature.key || '-'}</td></tr>
                <tr><td>Name</td><td>{selectedFeature.name}</td></tr>
                <tr><td>Description</td><td>{selectedFeature.description || '-'}</td></tr>
                <tr><td>Created At</td><td>{selectedFeature.createdAt ? new Date(selectedFeature.createdAt).toLocaleString() : '-'}</td></tr>
                <tr><td>Updated At</td><td>{selectedFeature.updatedAt ? new Date(selectedFeature.updatedAt).toLocaleString() : '-'}</td></tr>
              </tbody>
            </table>

            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Plan Usage</h4>
            <table className="admin-table">
              <thead><tr><th>Plan</th><th>Code</th><th>Included</th><th>Order</th></tr></thead>
              <tbody>
                {linkedPlans.length === 0 ? (
                  <tr><td colSpan={4}>This feature is not mapped to any plan yet.</td></tr>
                ) : (
                  linkedPlans.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td className="admin-code">{row.code}</td>
                      <td>{row.included ? 'Yes' : 'No'}</td>
                      <td>{row.order}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </AdminGuard>
  );
}
