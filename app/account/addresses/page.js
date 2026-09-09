'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const COUNTRIES = [['KH', 'Cambodia'], ['TH', 'Thailand'], ['VN', 'Vietnam'], ['LA', 'Laos'], ['SG', 'Singapore'], ['US', 'United States']];
const EMPTY = { label: '', recipient_name: '', phone: '', country_code: '', line1: '', line2: '', city: '', state: '', postal_code: '', is_default: false };

export default function AddressesPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // address id being edited
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);

  const load = () => api.addresses().then(r => setAddresses(r.data?.addresses || []));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (a) => {
    setEditing(a.id);
    setForm({ label: a.label || '', recipient_name: a.recipient_name, phone: a.phone, country_code: a.country_code, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state || '', postal_code: a.postal_code, is_default: !!a.is_default });
    setFormOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const r = editing ? await api.updateAddress(editing, form) : await api.addAddress(form);
    if (!r.ok) { toast(r.data?.error || 'Could not save address.', 'error'); return; }
    toast(editing ? 'Address updated.' : 'Address added.', 'success');
    setFormOpen(false); setEditing(null); setForm(EMPTY);
    load();
  };

  const doDelete = async () => {
    const r = await api.deleteAddress(deleting.id);
    setDeleting(null);
    if (!r.ok) { toast(r.data?.error || 'Could not delete.', 'error'); return; }
    toast('Address deleted.', 'success');
    load();
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (!addresses) return <div className="empty">Loading…</div>;

  return (
    <div>
      <div className="section-head" style={{ alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Addresses</h1>
        <button className="btn small" onClick={openAdd}>Add address</button>
      </div>

      {formOpen && (
        <form className="card" style={{ marginBottom: 16 }} onSubmit={save}>
          <h2>{editing ? 'Edit address' : 'Add an address'}</h2>
          <p className="muted small" style={{ marginTop: 0 }}>Saved addresses can be selected at checkout.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="field">
              <label htmlFor="label">Label</label>
              <input id="label" name="label" placeholder="e.g. Home, Office" value={form.label} onChange={set('label')} />
            </div>
            <div className="field">
              <label htmlFor="recipient_name">Recipient name*</label>
              <input id="recipient_name" name="recipient_name" required value={form.recipient_name} onChange={set('recipient_name')} />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone*</label>
              <input id="phone" name="phone" type="tel" required value={form.phone} onChange={set('phone')} />
            </div>
            <div className="field">
              <label htmlFor="country_code">Country*</label>
              <select id="country_code" name="country_code" required value={form.country_code} onChange={set('country_code')}>
                <option value="">Select a country…</option>
                {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="line1">Address line 1*</label>
              <input id="line1" name="line1" required value={form.line1} onChange={set('line1')} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="line2">Address line 2</label>
              <input id="line2" name="line2" value={form.line2} onChange={set('line2')} />
            </div>
            <div className="field">
              <label htmlFor="city">City*</label>
              <input id="city" name="city" required value={form.city} onChange={set('city')} />
            </div>
            <div className="field">
              <label htmlFor="state">State / province</label>
              <input id="state" name="state" value={form.state} onChange={set('state')} />
            </div>
            <div className="field">
              <label htmlFor="postal_code">Postal code*</label>
              <input id="postal_code" name="postal_code" required value={form.postal_code} onChange={set('postal_code')} />
            </div>
          </div>
          <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input type="checkbox" name="is_default" checked={form.is_default} onChange={set('is_default')} />
            Use as my default address
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" type="submit">{editing ? 'Save changes' : 'Add address'}</button>
            <button className="btn secondary" type="button" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && <div className="empty card"><p>No addresses saved yet.</p></div>}
      {addresses.map(a => (
        <div className="card" key={a.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <strong>{a.recipient_name}</strong>
            {a.label && <span className="chip unpaid">{a.label}</span>}
            {a.is_default ? <span className="chip default">Default</span> : null}
          </div>
          <p className="small" style={{ margin: '0 0 4px' }}>
            {a.line1}{a.line2 ? ', ' + a.line2 : ''}, {a.city}, {a.postal_code}, {a.country_code}
          </p>
          <p className="muted small" style={{ margin: '0 0 10px' }}>{a.phone}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary small" onClick={() => openEdit(a)}>Edit</button>
            <button className="btn ghost small" onClick={() => setDeleting(a)}>Delete</button>
          </div>
        </div>
      ))}

      <ConfirmDialog open={!!deleting} title="Delete this address?"
        message={deleting ? `${deleting.recipient_name} — ${deleting.line1}, ${deleting.city}` : ''}
        confirmLabel="Delete" danger
        onConfirm={doDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
