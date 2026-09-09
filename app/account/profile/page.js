'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [showPwForm, setShowPwForm] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [newId, setNewId] = useState('');
  const [idPw, setIdPw] = useState('');
  const [idCodeSent, setIdCodeSent] = useState(false);
  const [idCode, setIdCode] = useState('');
  const fileRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);

  const load = () => api.session().then(r => {
    const u = r.data?.user;
    if (u) { setUser(u); setName(u.name); setBirthdate(u.birthdate || ''); }
  });
  useEffect(() => { load(); }, []);

  const saveDetails = async (e) => {
    e.preventDefault();
    const r = await api.updateProfile({ name, birthdate });
    if (!r.ok) { toast(r.data?.error || 'Could not save.', 'error'); return; }
    toast('Profile updated.', 'success');
    load();
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const r = await api.uploadAvatar(fd);
    if (!r.ok) { toast(r.data?.error || 'Upload failed.', 'error'); }
    else { toast('Photo updated.', 'success'); load(); }
    e.target.value = '';
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    const r = await api.changePassword({ current_password: curPw, password: newPw, password_confirmation: newPw2 });
    if (!r.ok) { toast(r.data?.error || 'Could not update password.', 'error'); return; }
    toast('Password updated.', 'success');
    setCurPw(''); setNewPw(''); setNewPw2(''); setShowPwForm(false);
  };

  const sendIdCode = async (e) => {
    e.preventDefault();
    const r = await api.requestIdentifierChange({ identifier: newId, current_password: idPw });
    if (!r.ok) { toast(r.data?.error || 'Could not send code.', 'error'); return; }
    toast(`Code sent to ${newId}.`, 'success');
    setIdCodeSent(true);
  };

  const confirmIdChange = async (e) => {
    e.preventDefault();
    const r = await api.confirmIdentifierChange({ code: idCode });
    if (!r.ok) { toast(r.data?.error || 'Could not confirm.', 'error'); return; }
    toast('Email/phone updated.', 'success');
    setIdCodeSent(false); setNewId(''); setIdPw(''); setIdCode('');
    load();
  };
  if (!user) return <div className="empty">Loading…</div>;
  return (
    <div>
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 18, alignItems: 'center' }}>
        {user.avatar
          ? <img className="avatar" src={user.avatar} alt="Profile photo" />
          : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>👤</div>}
        <div className="grow" style={{ flex: 1 }}>
          <div className="small muted" style={{ letterSpacing: 1.5 }}>PROFILE</div>
          <h1 style={{ margin: '2px 0' }}>{user.name}</h1>
          <div className="muted small">Member since {user.created_at?.slice(0, 10)}</div>
          <div className="small" style={{ marginTop: 6 }}>
            {user.identifier_type === 'email' ? 'Email' : 'Phone'} <strong>{user.identifier}</strong>{' '}
            <span className="chip approved">Verified</span>
          </div>
        </div>
        <div>
          <button className="btn secondary small" onClick={() => fileRef.current?.click()}>Change photo</button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head" style={{ marginBottom: showPwForm ? 12 : 0 }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>Password</h2>
            <span className="muted small">At least 8 characters. You will need your current one to change it.</span>
          </div>
          <button className="btn secondary small" onClick={() => setShowPwForm(s => !s)}>Change password</button>
        </div>
        {showPwForm && (
          <form onSubmit={updatePassword} style={{ maxWidth: 380 }}>
            <div className="field">
              <label htmlFor="current_password">Current password*</label>
              <input id="current_password" name="current_password" type="password" required
                value={curPw} onChange={e => setCurPw(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">New password*</label>
              <input id="password" name="password" type="password" required minLength={8}
                value={newPw} onChange={e => setNewPw(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password_confirmation">Confirm new password*</label>
              <input id="password_confirmation" name="password_confirmation" type="password" required
                value={newPw2} onChange={e => setNewPw2(e.target.value)} />
              {newPw2 && newPw !== newPw2 && <span className="error">Passwords do not match.</span>}
            </div>
            <button className="btn" type="submit" disabled={!curPw || newPw.length < 8 || newPw !== newPw2}>Update password</button>
          </form>
        )}
      </div>

      <form className="card" style={{ marginBottom: 16 }} onSubmit={saveDetails}>
        <h2>Personal details</h2>
        <p className="muted small" style={{ marginTop: 0 }}>Your name, date of birth and photo.</p>
        <div style={{ maxWidth: 380 }}>
          <div className="field">
            <label htmlFor="name">Name*</label>
            <input id="name" name="name" type="text" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="birthdate">Date of birth</label>
            <input id="birthdate" name="birthdate" type="date" max={today}
              value={birthdate} onChange={e => setBirthdate(e.target.value)} />
          </div>
          <button className="btn" type="submit">Save changes</button>
        </div>
      </form>

      <div className="card">
        <h2>Email and phone</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          We send a code to the new address before anything changes, so a typo cannot lock you out.
        </p>
        {!idCodeSent ? (
          <form onSubmit={sendIdCode} style={{ maxWidth: 380 }}>
            <div className="field">
              <label htmlFor="identifier">New email or phone*</label>
              <input id="identifier" name="identifier" type="text" required
                value={newId} onChange={e => setNewId(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="identifier_password">Current password*</label>
              <input id="identifier_password" name="current_password" type="password" required
                value={idPw} onChange={e => setIdPw(e.target.value)} />
              <span className="hint">Password is hidden</span>
            </div>
            <button className="btn" type="submit" disabled={!newId.trim() || !idPw}>Send code</button>
          </form>
        ) : (
          <form onSubmit={confirmIdChange} style={{ maxWidth: 380 }}>
            <p className="small">Enter the code sent to <strong>{newId}</strong>.</p>
            <div className="field">
              <label htmlFor="id_code">One-time code*</label>
              <input id="id_code" name="code" inputMode="numeric" maxLength={6} required
                value={idCode} onChange={e => setIdCode(e.target.value.replace(/\D/g, ''))} />
            </div>
            <button className="btn" type="submit" disabled={idCode.length < 6}>Confirm change</button>
            <button className="btn ghost" type="button" style={{ marginLeft: 8 }}
              onClick={() => setIdCodeSent(false)}>Back</button>
          </form>
        )}
      </div>
    </div>
  );
}
