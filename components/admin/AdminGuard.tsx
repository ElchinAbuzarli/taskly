'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/features', label: 'Features' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/mappings', label: 'Mappings' },
];

type AuthStatus = 'checking' | 'guest' | 'forbidden' | 'authed';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>('checking');

  async function check() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      setStatus('guest');
      return;
    }

    const json = await res.json();
    if (!json.user?.isAdmin) {
      setStatus('forbidden');
      return;
    }

    setStatus('authed');
  }

  useEffect(() => {
    check();
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setStatus('guest');
  }

  if (status === 'checking') {
    return <main className="admin-layout"><div className="admin-content-card">Admin panel yuklenir...</div></main>;
  }

  if (status === 'guest') {
    return (
      <main className="admin-layout">
        <section className="admin-content-card" style={{ maxWidth: 520 }}>
          <h2>Admin ucun daxil olun</h2>
          <p className="admin-subtitle">Admin panel eyni login sistemi ile isleyir. Evvelce normal login edin.</p>
          <Link className="admin-btn primary" href="/auth">Go to Login</Link>
        </section>
      </main>
    );
  }

  if (status === 'forbidden') {
    return (
      <main className="admin-layout">
        <section className="admin-content-card" style={{ maxWidth: 520 }}>
          <h2>Access denied</h2>
          <p className="admin-subtitle">Bu hesab admin deyil. Admin panel yalniz isAdmin=true userler ucundur.</p>
          <Link className="admin-btn" href="/app">Back to App</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <h1 className="admin-brand">Taskly Admin</h1>
        <p className="admin-subtitle">Idare paneli</p>
        <table className="admin-side-table">
          <tbody>
            {LINKS.map((link) => (
              <tr key={link.href}>
                <td>
                  <Link href={link.href} className={`admin-link ${pathname === link.href ? 'active' : ''}`}>
                    {link.label}
                  </Link>
                </td>
              </tr>
            ))}
            <tr>
              <td><button className="admin-btn" onClick={logout}>Logout</button></td>
            </tr>
          </tbody>
        </table>
      </aside>
      <section className="admin-main">{children}</section>
    </main>
  );
}
