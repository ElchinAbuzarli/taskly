'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const FEATURE_GATES: Record<string, string> = {
  '/dashboard/employees': 'employee_profiles',
  '/dashboard/reports': 'advanced_reporting',
  '/dashboard/api': 'leave_tracking',
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/api', label: 'API Access' },
  { href: '/dashboard/billing', label: 'Billing' },
];

type Props = {
  planFeatureKeys: string[];
  planFeatureCodes: string[];
  isAdmin: boolean;
  hasPlan: boolean;
};

export default function Sidebar({ planFeatureKeys, planFeatureCodes, isAdmin, hasPlan }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function isLocked(href: string) {
    if (isAdmin) return false;
    const requiredFeature = FEATURE_GATES[href];
    if (!requiredFeature) return false;
    if (!hasPlan) return true;
    return !(planFeatureKeys.includes(requiredFeature) || planFeatureCodes.includes(requiredFeature));
  }

  return (
    <aside className="admin-card dashboard-sidebar" style={{ minWidth: 230 }}>
      <h3 className="dashboard-sidebar-title">Navigation</h3>
      {!hasPlan && !isAdmin ? <p className="admin-msg-err">Choose a plan to unlock features.</p> : null}
      <ul className="admin-list dashboard-nav-list">
        {NAV_ITEMS.map((item) => {
          const locked = isLocked(item.href);
          const active = pathname === item.href;

          if (locked) {
            return (
              <li key={item.href}>
                <button
                  className="admin-btn dashboard-nav-btn locked"
                  onClick={() => router.push('/dashboard/upgrade')}
                >
                  {item.label} 🔒
                </button>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`admin-btn dashboard-nav-btn ${active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
