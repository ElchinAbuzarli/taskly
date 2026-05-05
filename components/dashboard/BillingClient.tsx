'use client';

import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PricingFeature = {
  code: string;
  key: string | null;
  name: string;
  included: boolean;
};

type PricingPlan = {
  id: string;
  code: string;
  name: string;
  monthlyPrice: number;
  features: PricingFeature[];
};

type Props = {
  workspaceId: string;
  plans: PricingPlan[];
  currentPlanCode: string | null;
  initialSelectedPlanCode?: string | null;
};

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybe = error as { message?: string; formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    if (typeof maybe.message === 'string' && maybe.message) return maybe.message;
    const firstForm = maybe.formErrors?.[0];
    if (firstForm) return firstForm;
    const firstField = maybe.fieldErrors ? Object.values(maybe.fieldErrors).flat()[0] : undefined;
    if (firstField) return firstField;
  }
  return fallback;
}

async function readJsonSafe(res: Response) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { error?: unknown; message?: string };
  } catch {
    return null;
  }
}

export default function BillingClient({ workspaceId, plans, currentPlanCode, initialSelectedPlanCode }: Props) {
  const router = useRouter();
  const [planCode, setPlanCode] = useState(initialSelectedPlanCode ?? currentPlanCode ?? plans[0]?.code ?? '');
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [cardHolder, setCardHolder] = useState('Demo User');
  const [expiry, setExpiry] = useState('12/30');
  const [cvc, setCvc] = useState('123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedPlan = useMemo(() => plans.find((p) => p.code === planCode) ?? null, [plans, planCode]);

  async function checkout(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, planCode, cardNumber, cardHolder, expiry, cvc }),
    });
    const json = await readJsonSafe(res);
    setLoading(false);

    if (!res.ok) {
      setError(extractErrorMessage(json?.error ?? json?.message, 'Checkout failed'));
      return;
    }

    setMessage('Plan updated successfully. Your feature access is refreshed.');
    router.refresh();
  }

  return (
    <div className="admin-card">
      <h2 style={{ marginTop: 0 }}>Billing & Plan</h2>
      <p style={{ marginTop: 0, color: '#64748b' }}>Pick a package card first, then complete fake checkout below.</p>
      {message ? <p className="admin-msg-ok">{message}</p> : null}
      {error ? <p className="admin-msg-err">{error}</p> : null}

      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 10px' }}>
          Current plan: <span className="admin-code">{currentPlanCode ?? 'none'}</span>
        </p>
        <div className="pricing-grid">
          {plans.map((plan, idx) => {
            const includedCount = plan.features.filter((f) => f.included).length;
            const isSelected = plan.code === planCode;
            const isCurrent = plan.code === currentPlanCode;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanCode(plan.code)}
                className={`pricing-card ${idx === 1 ? 'recommended' : ''}`}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: isSelected ? '#2563eb' : undefined,
                  boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : undefined,
                  minHeight: 280,
                }}
              >
                {idx === 1 ? <span className="pricing-badge">Most Popular</span> : null}
                <h3 className="pricing-title">{plan.name}</h3>
                <p className="pricing-price">${(plan.monthlyPrice / 100).toFixed(0)}/mo</p>
                <p className="pricing-sub">{includedCount} included features</p>
                <ul className="pricing-features">
                  {plan.features.filter((f) => f.included).slice(0, 4).map((f) => <li key={f.code}>{f.name}</li>)}
                </ul>
                <span className={`pricing-cta ${isSelected ? '' : 'secondary'}`}>
                  {isCurrent ? 'Current Plan' : isSelected ? `Selected: ${plan.name}` : `Select ${plan.name}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={checkout} className="admin-content-card">
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Fake Payment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Selected Plan</label>
            <input className="admin-input" value={selectedPlan ? `${selectedPlan.name} ($${(selectedPlan.monthlyPrice / 100).toFixed(0)}/mo)` : '-'} readOnly />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Card Number</label>
            <input className="admin-input" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Card Holder</label>
            <input className="admin-input" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Expiry</label>
            <input className="admin-input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>CVC</label>
            <input className="admin-input" value={cvc} onChange={(e) => setCvc(e.target.value)} />
          </div>
        </div>
        <button className="admin-btn primary" style={{ marginTop: 12 }} type="submit" disabled={loading || !planCode}>
          {loading ? 'Processing...' : 'Checkout & Activate Plan'}
        </button>
      </form>

      {selectedPlan ? (
        <>
          <h3 style={{ marginBottom: 8 }}>Selected plan features</h3>
          <table className="admin-table">
            <thead>
              <tr><th>Feature</th><th>Code</th><th>Capability Key</th><th>Status</th></tr>
            </thead>
            <tbody>
              {selectedPlan.features.map((feature) => (
                <tr key={feature.code}>
                  <td>{feature.name}</td>
                  <td className="admin-code">{feature.code}</td>
                  <td className="admin-code">{feature.key ?? '-'}</td>
                  <td>{feature.included ? 'Included' : 'Not included'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 4,
};
