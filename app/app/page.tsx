'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

type View = 'board' | 'list' | 'calendar';
type Page = 'home' | 'tasks' | 'docs' | 'settings';
type Priority = 'Low' | 'Medium' | 'High';

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  assignee: string;
  priority: Priority;
  status: 'Todo' | 'In Progress' | 'Done';
};

type CurrentUser = { id: string; name: string; email: string; isAdmin: boolean };

const initialTasks: Task[] = [
  { id: 1, title: 'Design onboarding', description: 'Create first draft screens', dueDate: '2026-05-12', assignee: 'Aylin', priority: 'High', status: 'Todo' },
  { id: 2, title: 'Write API docs', description: 'Document auth and tasks endpoints', dueDate: '2026-05-10', assignee: 'Murad', priority: 'Medium', status: 'In Progress' },
  { id: 3, title: 'QA sprint board', description: 'Review bugs and test cases', dueDate: '2026-05-09', assignee: 'Leyla', priority: 'Low', status: 'Done' },
];

export default function TasklyPlatformPage() {
  const [activePage, setActivePage] = useState<Page>('tasks');
  const [activeView, setActiveView] = useState<View>('board');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [docTitle, setDocTitle] = useState('Product Notes');
  const [docBody, setDocBody] = useState('Taskly docs editor. Write notes, specs and project updates here.');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'status'>>({
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
    priority: 'Medium',
  });

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [tasks, search]);

  const grouped = useMemo(() => ({
    todo: filteredTasks.filter((t) => t.status === 'Todo'),
    progress: filteredTasks.filter((t) => t.status === 'In Progress'),
    done: filteredTasks.filter((t) => t.status === 'Done'),
  }), [filteredTasks]);

  function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        status: 'Todo',
        ...newTask,
      },
    ]);
    setNewTask({ title: '', description: '', dueDate: '', assignee: '', priority: 'Medium' });
  }

  async function loadCurrentUser() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      setCurrentUser(null);
      return;
    }
    const json = await res.json();
    setCurrentUser(json.user ?? null);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111827' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
        <aside style={{ background: '#f3f4f6', borderRight: '1px solid #e5e7eb', padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Taskly</h2>
          <nav style={{ display: 'grid', gap: 8 }}>
            {[
              ['home', 'Home'],
              ['tasks', 'My Tasks'],
              ['tasks', 'Projects'],
              ['docs', 'Docs'],
              ['settings', 'Settings'],
            ].map(([key, label], idx) => {
              const page = (idx === 2 ? 'tasks' : key) as Page;
              const active = activePage === page && !(idx === 2 && activePage !== 'tasks');
              return (
                <button
                  key={`${label}-${idx}`}
                  onClick={() => setActivePage(page)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: active ? '#e0e7ff' : '#fff',
                    color: active ? '#3730a3' : '#111827',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: 16 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, docs..."
              style={{ width: 320, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/" style={{ ...smallBtn, textDecoration: 'none' }}>
                Main Site
              </Link>
              {currentUser ? (
                <>
                  {currentUser.isAdmin ? (
                    <Link href="/admin" style={{ ...smallBtn, textDecoration: 'none' }}>
                      Admin
                    </Link>
                  ) : null}
                  <button style={smallBtn} onClick={logout}>Logout</button>
                </>
              ) : (
                <Link href="/auth" style={{ ...smallBtn, textDecoration: 'none' }}>
                  Log In
                </Link>
              )}
              <button style={iconBtn}>🔔</button>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e0e7ff', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#3730a3' }}>EA</div>
            </div>
          </header>

          <main style={{ padding: 18 }}>
            {activePage === 'tasks' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ margin: 0 }}>Q2 Product Launch</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['board', 'list', 'calendar'] as View[]).map((v) => (
                      <button key={v} onClick={() => setActiveView(v)} style={{ ...smallBtn, background: activeView === v ? '#4f46e5' : '#fff', color: activeView === v ? '#fff' : '#111827' }}>
                        {v[0].toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={createTask} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 14, background: '#fafafa' }}>
                  <strong>Create Task</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr auto', gap: 8, marginTop: 8 }}>
                    <input placeholder="Title" value={newTask.title} onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))} style={input} />
                    <input placeholder="Description" value={newTask.description} onChange={(e) => setNewTask((s) => ({ ...s, description: e.target.value }))} style={input} />
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((s) => ({ ...s, dueDate: e.target.value }))} style={input} />
                    <input placeholder="Assignee" value={newTask.assignee} onChange={(e) => setNewTask((s) => ({ ...s, assignee: e.target.value }))} style={input} />
                    <select value={newTask.priority} onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value as Priority }))} style={input}>
                      <option>Low</option><option>Medium</option><option>High</option>
                    </select>
                    <button style={{ ...smallBtn, background: '#4f46e5', color: '#fff' }} type="submit">Add</button>
                  </div>
                </form>

                {activeView === 'board' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <Column title="To Do" tasks={grouped.todo} />
                    <Column title="In Progress" tasks={grouped.progress} />
                    <Column title="Done" tasks={grouped.done} />
                  </div>
                )}

                {activeView === 'list' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead><tr><th style={th}>Title</th><th style={th}>Assignee</th><th style={th}>Priority</th><th style={th}>Due</th><th style={th}>Status</th></tr></thead>
                    <tbody>
                      {filteredTasks.map((t) => (
                        <tr key={t.id}><td style={td}>{t.title}</td><td style={td}>{t.assignee}</td><td style={td}>{t.priority}</td><td style={td}>{t.dueDate || '-'}</td><td style={td}>{t.status}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeView === 'calendar' && (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                    <p style={{ marginTop: 0, fontWeight: 600 }}>Calendar (mock)</p>
                    <ul>
                      {filteredTasks.map((t) => <li key={t.id}>{t.dueDate || 'No date'} — {t.title}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}

            {activePage === 'docs' && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                <h2 style={{ marginTop: 0 }}>Notes & Docs</h2>
                <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} style={{ ...input, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button style={smallBtn} type="button" onClick={() => setDocBody((s) => `${s}\n• New bullet`)}>Bullet</button>
                  <button style={smallBtn} type="button" onClick={() => setDocBody((s) => `${s}\n# Heading`)}>Heading</button>
                  <button style={smallBtn} type="button" onClick={() => setDocBody((s) => `${s}\n**Bold text**`)}>Bold</button>
                </div>
                <textarea value={docBody} onChange={(e) => setDocBody(e.target.value)} rows={12} style={{ ...input, resize: 'vertical' }} />
              </div>
            )}

            {activePage === 'settings' && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                <h2 style={{ marginTop: 0 }}>Settings</h2>
                <p>Workspace settings placeholder.</p>
              </div>
            )}

            {activePage === 'home' && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                <h2 style={{ marginTop: 0 }}>Home</h2>
                <p>Welcome to Taskly workspace.</p>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}

function Column({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, background: '#fafafa' }}>
      <strong>{title}</strong>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        {tasks.map((t) => (
          <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 8 }}>
            <div style={{ fontWeight: 600 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{t.description}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{t.assignee} • {t.priority} • {t.dueDate || 'No date'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#fff',
};

const smallBtn: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#fff',
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
};

const th: React.CSSProperties = { borderBottom: '1px solid #e5e7eb', padding: 10, textAlign: 'left' };
const td: React.CSSProperties = { borderBottom: '1px solid #f1f5f9', padding: 10 };
