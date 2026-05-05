import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getPublicPricing } from '@/lib/pricing';
import { getCurrentUser } from '@/lib/session';

const features = [
  {
    title: 'Tasks & Subtasks',
    desc: 'Create tasks, split them into subtasks, assign owners, and track progress clearly.',
  },
  {
    title: 'Team Collaboration',
    desc: 'Work together with comments, mentions, and shared project views in one workspace.',
  },
  {
    title: 'Notes & Docs',
    desc: 'Write docs next to your tasks so planning and execution live in the same place.',
  },
];

const testimonials = [
  'Taskly helps our team stay aligned every week.',
  'Simple UI, fast onboarding, and great collaboration flow.',
  'Board, docs, and calendar in one place is exactly what we needed.',
];

export default async function HomePage() {
  const [plans, currentUser] = await Promise.all([getPublicPricing(), getCurrentUser()]);

  return (
    <main style={{ background: '#ffffff', color: '#111827' }}>
      <header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 20, color: '#4f46e5' }}>Taskly</strong>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href="/auth"
              style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', color: '#111827', fontWeight: 600 }}
            >
              Log In
            </Link>
            <Link
              href="/auth"
              style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 600 }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, margin: 0 }}>Taskly</h1>
        <h2 style={{ fontSize: 36, margin: '16px 0 12px' }}>Manage tasks and docs in one clean workspace.</h2>
        <p style={{ maxWidth: 760, margin: '0 auto', color: '#4b5563' }}>
          Notion-like task management for teams that want board, list, calendar, and docs together.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <Link
            href="/auth"
            style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 8, border: '1px solid #d1d5db', color: '#111827', fontWeight: 600 }}
          >
            Log In
          </Link>
          <Link
            href="/auth"
            style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '12px 18px', borderRadius: 8, fontWeight: 600 }}
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }} id="features">
        <h3 style={{ fontSize: 28, marginBottom: 14 }}>Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {features.map((f) => (
            <article key={f.title} style={cardStyle}>
              <h4 style={{ margin: '0 0 8px' }}>{f.title}</h4>
              <p style={{ margin: 0, color: '#4b5563' }}>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }} id="pricing">
        <h3 style={{ fontSize: 28, marginBottom: 14 }}>Pricing</h3>
        <div className="pricing-grid">
          {plans.map((p, idx) => (
            <article key={p.id} className={`pricing-card ${idx === 1 ? 'recommended' : ''}`}>
              {idx === 1 ? <span className="pricing-badge">Most Popular</span> : null}
              <h4 className="pricing-title">{p.name}</h4>
              <p className="pricing-price">${(p.monthlyPrice / 100).toFixed(0)}/mo</p>
              <p className="pricing-sub">Dynamic features based on selected package.</p>
              <ul className="pricing-features">
                {p.features
                  .filter((f) => f.included)
                  .slice(0, 5)
                  .map((feature) => <li key={feature.code}>{feature.name}</li>)}
              </ul>
              <Link
                href={currentUser ? `/dashboard/billing?plan=${p.code}` : '/auth'}
                className={`pricing-cta ${idx === 1 ? '' : 'secondary'}`}
              >
                {currentUser ? `Select ${p.name}` : 'Login to Select Plan'}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }} id="testimonials">
        <h3 style={{ fontSize: 28, marginBottom: 14 }}>Testimonials</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {testimonials.map((t, i) => (
            <article key={i} style={cardStyle}>
              <p style={{ margin: 0, color: '#374151' }}>&quot;{t}&quot;</p>
            </article>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: '#6b7280' }}>© 2026 Taskly</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#">Privacy</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
};
