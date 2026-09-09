'use client';
import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { fmt } from '@/lib/format';

export default function PayPage({ params }) {
  const { token } = use(params);
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pay/' + token).then(r => r.json()).then(d => {
      if (d.order) setOrder(d.order); else setError(d.error || 'Payment not found.');
    });
  }, [token]);

  const act = async (action) => {
    const r = await api.pay(token, action);
    if (!r.ok) { toast(r.data?.error || 'Payment failed.', 'error'); return; }
    if (action === 'pay') window.location.href = `/checkout/success?order=${r.data.number}&paid=1`;
    else window.location.href = '/account/orders';
  };

  if (error) return <div className="container empty"><h1>Payment</h1><p>{error}</p></div>;
  if (!order) return <div className="container empty">Loading…</div>;

  return (
    <div className="container empty">
      <div className="card" style={{ maxWidth: 460, margin: '40px auto' }}>
        <h1>Evalley Pay <span className="chip pending">sandbox</span></h1>
        <p>Scan the {order.payment_method} code to pay <strong>{fmt(order.total)}</strong> for order <strong>{order.number}</strong>.</p>
        <img src={`/api/img/${encodeURIComponent('QR ' + order.number)}?c=1d1a17`} alt="Payment QR code"
          style={{ width: 220, margin: '10px auto', borderRadius: 12 }} />
        <p className="muted small">This is a simulated payment gateway for the test environment.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <button className="btn" onClick={() => act('pay')}>Simulate successful payment</button>
          <button className="btn ghost" onClick={() => act('cancel')}>Cancel and return to store</button>
        </div>
      </div>
    </div>
  );
}
