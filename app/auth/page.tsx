'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AuthUser = { id: string; name: string; email: string; isAdmin: boolean };

const initialRegister = { name: '', email: '', password: '', workspaceName: '' };
const initialLogin = { email: '', password: '' };

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
    return JSON.parse(raw) as { error?: unknown; user?: AuthUser };
  } catch {
    return null;
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function register(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm),
    });
    const json = await readJsonSafe(res);
    if (!res.ok) {
      if (res.status === 409) {
        setLoginForm((s) => ({ ...s, email: registerForm.email }));
        return setError('Bu email artiq qeydiyyatdadir. Login bolmesinden daxil olun.');
      }
      return setError(extractErrorMessage(json?.error, 'Register failed'));
    }
    if (!json?.user) return setError('Register failed');
    setUser(json.user);
    setRegisterForm(initialRegister);
    setMessage('Register successful.');
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    });
    const json = await readJsonSafe(res);
    if (!res.ok) return setError(extractErrorMessage(json?.error, 'Login failed'));
    if (!json?.user) return setError('Login failed');
    const loggedInUser = json.user as AuthUser;
    setUser(loggedInUser);
    setLoginForm(initialLogin);
    setMessage('Login successful.');
    router.push(loggedInUser.isAdmin ? '/admin' : '/dashboard');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMessage('Logged out.');
  }

  return (
    <main className="container" style={{ paddingTop: 30 }}>
      <h1>Login / Register</h1>
      {message ? <p style={{ color: '#0f766e' }}>{message}</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {user ? (
        <div className="card">
          <p><strong>{user.name}</strong> ({user.email})</p>
          <p className="code">isAdmin: {String(user.isAdmin)}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn" href="/app">Go to App</Link>
            {user.isAdmin ? <Link className="btn" href="/admin">Go to Admin</Link> : null}
            <button className="btn" onClick={logout}>Logout</button>
          </div>
        </div>
      ) : (
        <section className="grid">
          <form className="card" onSubmit={register}>
            <h3>Register</h3>
            <input style={inputStyle} placeholder="Name" value={registerForm.name} onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))} />
            <input style={inputStyle} placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))} />
            <input style={inputStyle} type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm((s) => ({ ...s, password: e.target.value }))} />
            <input style={inputStyle} placeholder="Workspace Name" value={registerForm.workspaceName} onChange={(e) => setRegisterForm((s) => ({ ...s, workspaceName: e.target.value }))} />
            <button className="btn" type="submit">Register</button>
          </form>

          <form className="card" onSubmit={login}>
            <h3>Login</h3>
            <input style={inputStyle} placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))} />
            <input style={inputStyle} type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))} />
            <button className="btn" type="submit">Login</button>
          </form>
        </section>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Admin Login Credentials</h3>
        <p style={{ marginBottom: 6 }}><strong>Email:</strong> <span className="code">admin@taskly.local</span></p>
        <p style={{ marginTop: 0 }}><strong>Password:</strong> <span className="code">123456</span></p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 8,
  marginBottom: 8,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #d1d5db',
};
