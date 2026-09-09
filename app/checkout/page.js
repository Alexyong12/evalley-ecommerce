'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { fmt } from '@/lib/format';

const METHODS = [
  ['khqr', 'KHQR', "You'll be sent to your bank to pay."],
  ['vb', 'Vattanac Bank', "You'll be sent to your bank to pay."],
  ['card', 'Visa/Master Card', "You'll be sent to your bank to pay."],
  ['cod', 'Cash on Delivery', 'Pay the courier in cash when your order arrives.'],
];

export default function CheckoutPage() {
  const toast = useToast();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [shipping, setShipping] = useState('');
  const [billing, setBilling] = useState('');
  const [method, setMethod] = useState('khqr');
  const [note, setNote] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.cart().then(r => setCart(r.data));
    api.addresses().then(r => {
      const list = r.data?.addresses || [];
      setAddresses(list);
      const def = list.find(a => a.is_default);
      if (def) setShipping(String(def.id));
    });
  }, []);

  if (!cart || addresses === null) return <div className="container empty">Loading…</div>;

  if (cart.items.length === 0) {
    return (
      <div className="container empty">
        <h1>Nothing to check out</h1>
        <p>Your cart has no available items.</p>
        <Link href="/products" className="btn">Continue shopping</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    const r = await api.coupon(coupon);
    if (!r.ok) { setDiscountPct(0); toast(r.data?.error || 'Invalid coupon code.', 'error'); return; }
    setDiscountPct(r.data.discount_pct);
    toast(r.data.message, 'success');
  };

  const discount = +(cart.subtotal * discountPct / 100).toFixed(2);
  const grand = +(cart.subtotal + cart.delivery - discount).toFixed(2);

  const placeOrder = async () => {
    setBusy(true);
    const r = await api.checkout({
      shipping_address_id: Number(shipping), billing_address_id: billing ? Number(billing) : undefined,
      payment_method_code: method, note, coupon: discountPct ? coupon : undefined,
    });
    setBusy(false);
    if (!r.ok) { toast(r.data?.error || 'Checkout failed.', 'error'); return; }
    window.location.href = r.data.redirect;
  };

  const addrLabel = (a) => `${a.label ? a.label + ' · ' : ''}${a.recipient_name} — ${a.line1}, ${a.city}`;

  return (
    <div className="container" style={{ marginTop: 24 }}>
      <h1>Checkout</h1>
      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="shipping_address_id">Shipping address*</label>
              <select id="shipping_address_id" name="shipping_address_id" required
                value={shipping} onChange={e => setShipping(e.target.value)}>
                <option value="">Select an address…</option>
                {addresses.map(a => <option key={a.id} value={a.id}>{addrLabel(a)}</option>)}
              </select>
              <span className="hint">A flat $2.00 delivery rate applies.</span>
            </div>
            <Link href="/account/addresses" className="btn secondary small">Add an address</Link>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="billing_address_id">Billing address</label>
              <select id="billing_address_id" name="billing_address_id"
                value={billing} onChange={e => setBilling(e.target.value)}>
                <option value="">Same as shipping</option>
                {addresses.map(a => <option key={a.id} value={a.id}>{addrLabel(a)}</option>)}
              </select>
              <span className="hint">Leave as “same as shipping” unless it differs.</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Payment method</h2>
            {METHODS.map(([codeV, label, desc]) => (
              <label key={codeV} className="radio-line">
                <input type="radio" name="payment_method_code" value={codeV}
                  checked={method === codeV} onChange={() => setMethod(codeV)} />
                <span><strong>{label}</strong><br /><span className="muted small">{desc}</span></span>
              </label>
            ))}
          </div>

          <div className="card">
            <div className="field">
              <label htmlFor="note">Order note</label>
              <textarea id="note" name="note" rows={3} value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <button className="btn" style={{ width: '100%' }} disabled={busy || !shipping} onClick={placeOrder}>
              {method === 'cod' ? 'Place order' : 'Continue to payment'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Order summary</h2>
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="coupon-code">Coupon</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="coupon-code" name="code" type="text" value={coupon} onChange={e => setCoupon(e.target.value)} />
              <button className="btn secondary small" type="button" onClick={applyCoupon}>Apply</button>
            </div>
          </div>
          {cart.items.map(i => (
            <div className="summary-line" key={i.id}>
              <span>{i.name}{i.variant ? ` (${i.variant})` : ''} <span className="muted small">Qty {i.qty}</span></span>
              <span className="tabular-nums">{fmt(i.line_total)}</span>
            </div>
          ))}
          <div className="summary-line" style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <span>Subtotal</span><span className="tabular-nums">{fmt(cart.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-line"><span>Discount</span><span className="tabular-nums">−{fmt(discount)}</span></div>
          )}
          <div className="summary-line">
            <span>Delivery</span>
            <span className="tabular-nums">{shipping ? `${fmt(cart.delivery)}` : 'Choose an address'}</span>
          </div>
          <div className="summary-line total">
            <span>Grand total</span>
            <span className="tabular-nums">{fmt((shipping ? grand : cart.subtotal - discount))}</span>
          </div>
          <p className="muted small">Delivery follows the method you choose, and any tax is applied when the order is placed.</p>
        </div>
      </div>
    </div>
  );
}
