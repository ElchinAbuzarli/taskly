import Link from 'next/link';
import { getPublicPricing } from '@/lib/pricing';

export default async function DashboardUpgradePage() {
  const plans = await getPublicPricing();

  return (
    <div className="admin-card">
      <h2 style={{ marginTop: 0 }}>Choose a plan</h2>
      <p>This section is locked in your current plan. Upgrade to unlock more pages.</p>
      <div className="pricing-grid" style={{ marginTop: 12 }}>
        {plans.map((plan, idx) => (
          <article key={plan.id} className={`pricing-card ${idx === 1 ? 'recommended' : ''}`} style={{ minHeight: 300 }}>
            {idx === 1 ? <span className="pricing-badge">Recommended</span> : null}
            <h3 className="pricing-title">{plan.name}</h3>
            <p className="pricing-price">${(plan.monthlyPrice / 100).toFixed(0)}/month</p>
            <ul className="pricing-features">
              {plan.features.filter((f) => f.included).slice(0, 4).map((f) => <li key={f.code}>{f.name}</li>)}
            </ul>
            <Link className={`pricing-cta ${idx === 1 ? '' : 'secondary'}`} href={`/dashboard/billing?plan=${plan.code}`}>
              Select {plan.name}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
