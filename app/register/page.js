'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { validateName, validatePassword, validateBirthdate } from '@/lib/validate';
import { useToast } from '@/components/Toast';

export default function RegisterPage() {
  const toast = useToast();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [fieldError, setFieldError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const mismatch = confirm.length > 0 && password !== confirm;
  const nameError = name.length > 0 ? validateName(name) : '';
  const pwError = password.length > 0 ? validatePassword(password, { name, identifier }) : '';
  const dobError = birthdate ? validateBirthdate(birthdate) : '';
  const formValid = !validateName(name) && identifier.trim() && !validatePassword(password, { name, identifier })
    && !dobError && password === confirm;

  const submitForm = async (e) => {
    e.preventDefault();
    setBusy(true); setFieldError('');
    const r = await api.register({ name, identifier, birthdate, password, password_confirmation: confirm });
    setBusy(false);
    if (!r.ok) { setFieldError(r.data?.error || 'Registration failed.'); toast(r.data?.error || 'Registration failed.', 'error'); return; }
    setStep('otp');
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.verifyOtp({ identifier, code });
    setBusy(false);
    if (!r.ok) { toast(r.data?.error || 'Verification failed.', 'error'); return; }
    toast('Welcome! Your account has been created.', 'success');
    window.location.href = '/account';
  };

  const resend = async () => {
    const r = await api.resendOtp({ identifier });
    if (!r.ok) { toast(r.data?.error || 'Could not resend.', 'error'); return; }
    toast('A new code was sent.', 'success');
    setCooldown(30);
    const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  if (step === 'otp') {
    return (
      <div className="container">
        <form className="card auth-card" onSubmit={verify}>
          <h1>Enter your code</h1>
          <p className="muted small">Sent to {identifier}.</p>
          <div className="field">
            <label htmlFor="code">One-time code*</label>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code"
              maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
          </div>
          <button className="btn" type="submit" style={{ width: '100%' }}
            disabled={busy || code.length < 6}>Verify and continue</button>
          <button className="btn ghost" type="button" style={{ width: '100%', marginTop: 8 }}
            disabled={cooldown > 0} onClick={resend}>
            {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <form className="card auth-card" onSubmit={submitForm}>
        <h1>Create an account</h1>
        <div className="field">
          <label htmlFor="name">Name*</label>
          <input id="name" name="name" type="text" required minLength={8} maxLength={60}
            value={name} onChange={e => setName(e.target.value)} />
          {nameError
            ? <span className="error" style={{ color: 'var(--bad)', fontSize: '0.85rem' }}>{nameError}</span>
            : <span className="hint">8–60 characters, letters only.</span>}
        </div>
        <div className="field">
          <label htmlFor="identifier">Email or phone*</label>
          <input id="identifier" name="identifier" type="text" required
            value={identifier} onChange={e => setIdentifier(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="birthdate">Date of birth</label>
          <input id="birthdate" name="birthdate" type="date" max={today}
            value={birthdate} onChange={e => setBirthdate(e.target.value)} />
          {dobError && <span className="error" style={{ color: 'var(--bad)', fontSize: '0.85rem' }}>{dobError}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password*</label>
          <div className="pwd-wrap">
            <input id="password" name="password" type={showPw ? 'text' : 'password'} required minLength={8} maxLength={64}
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="pwd-toggle" aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(s => !s)}>{showPw ? '🙈' : '👁'}</button>
          </div>
          {pwError
            ? <span className="error" style={{ color: 'var(--bad)', fontSize: '0.85rem' }}>{pwError}</span>
            : <span className="hint">8–64 chars with an uppercase, lowercase, number and symbol.</span>}
        </div>
        <div className="field">
          <label htmlFor="password_confirmation">Confirm password*</label>
          <input id="password_confirmation" name="password_confirmation" type={showPw ? 'text' : 'password'} required
            value={confirm} onChange={e => setConfirm(e.target.value)} />
          {mismatch && <span className="error">Passwords do not match.</span>}
        </div>
        {fieldError && <p className="error" style={{ color: 'var(--bad)', fontSize: '0.85rem' }}>{fieldError}</p>}
        <button className="btn" type="submit" style={{ width: '100%' }} disabled={busy || !formValid}>Continue</button>
        <p className="muted small" style={{ textAlign: 'center' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
