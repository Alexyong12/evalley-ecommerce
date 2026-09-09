'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.login({ identifier, password });
    setBusy(false);
    if (!r.ok) { toast(r.data?.error || 'Sign in failed.', 'error'); return; }
    const next = params.get('next') || '/account';
    window.location.href = next;
  };

  return (
    <div className="container">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Sign in</h1>
        <div className="field">
          <label htmlFor="identifier">Email or phone*</label>
          <input id="identifier" name="identifier" type="text" required
            value={identifier} onChange={e => setIdentifier(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password*</label>
          <div className="pwd-wrap">
            <input id="password" name="password" type={show ? 'text' : 'password'} required
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="pwd-toggle" aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow(s => !s)}>{show ? '🙈' : '👁'}</button>
          </div>
          <span className="hint">{show ? 'Password is visible' : 'Password is hidden'}</span>
        </div>
        <button className="btn" type="submit" style={{ width: '100%' }}
          disabled={busy || !identifier.trim() || !password}>Sign in</button>
        <p className="muted small" style={{ textAlign: 'center' }}>
          No account yet? <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 700 }}>Create one</Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="container empty">Loading…</div>}><LoginForm /></Suspense>;
}
