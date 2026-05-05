'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';

type WorkspaceAccess = {
  workspaceId: string;
  workspaceName: string;
  role: string;
  plan: { code: string; name: string } | null;
  featureCodes: string[];
  capabilityKeys: string[];
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  workspaces: WorkspaceAccess[];
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch('/api/admin/users');
    const json = await res.json();
    if (!res.ok) return setError(extractErrorMessage(json.error, 'Users yuklenmedi'));
    setUsers(json.users ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  return (
    <AdminGuard>
      <div className="admin-content-card">
        <h2 style={{ marginTop: 0 }}>Users & Access</h2>
        <p className="admin-subtitle">Click a user row to open detailed package and feature access.</p>
        {error ? <p className="admin-msg-err">{error}</p> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Workspaces</th>
              <th>Plans</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const uniquePlans = Array.from(new Set(user.workspaces.map((workspace) => workspace.plan?.name ?? 'No active plan')));
              return (
                <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedUserId(user.id)}>
                  <td>
                    <strong>{user.name}</strong>
                    <div className="admin-code">{user.email}</div>
                  </td>
                  <td>
                    <span className="admin-code">{user.isAdmin ? 'Admin' : 'User'}</span>
                  </td>
                  <td>{user.workspaces.length}</td>
                  <td>{uniquePlans.join(', ')}</td>
                  <td><button className="admin-btn" type="button" onClick={() => setSelectedUserId(user.id)}>Open</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedUser ? (
        <div
          onClick={() => setSelectedUserId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            padding: 18,
            display: 'grid',
            placeItems: 'center',
            zIndex: 60,
          }}
        >
          <div className="admin-content-card" style={{ width: 'min(1100px, 100%)', maxHeight: '92vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedUser.name}</h2>
                <p className="admin-subtitle" style={{ margin: '4px 0 0' }}>
                  {selectedUser.email} • {selectedUser.isAdmin ? 'Admin' : 'User'}
                </p>
              </div>
              <button className="admin-btn" onClick={() => setSelectedUserId(null)}>Close</button>
            </div>

            <h3 style={{ marginBottom: 10 }}>Workspace Access Details</h3>
            <div className="pricing-grid">
              {selectedUser.workspaces.map((workspace) => (
                <article key={workspace.workspaceId} className="pricing-card" style={{ minHeight: 260 }}>
                  <h4 className="pricing-title">{workspace.workspaceName}</h4>
                  <p className="pricing-sub">Role: {workspace.role}</p>
                  <p className="admin-code" style={{ marginTop: 0 }}>
                    Plan: {workspace.plan ? `${workspace.plan.name} (${workspace.plan.code})` : 'No active plan'}
                  </p>
                  <div style={{ marginTop: 10 }}>
                    <strong>Capability Keys</strong>
                    <p className="admin-code" style={{ marginTop: 6 }}>{workspace.capabilityKeys.join(', ') || 'none'}</p>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <strong>Feature Codes</strong>
                    <p className="admin-code" style={{ marginTop: 6 }}>{workspace.featureCodes.join(', ') || 'none'}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AdminGuard>
  );
}
