'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.orders().then(r => setOrders(r.data?.orders || [])); }, []);
  if (!orders) return <div className="empty">Loading…</div>;

  return (
    <div>
      <h1>Orders</h1>
      <p className="muted small">{orders.length} order{orders.length === 1 ? '' : 's'}</p>
      {orders.length === 0 && (
        <div className="empty card">
          <p>No orders yet.</p>
          <Link href="/products" className="btn">Start shopping</Link>
        </div>
      )}
      <div className="card">
        {orders.map(o => (
          <div className="row" key={o.id}>
            <div className="grow">
              <Link href={`/account/orders/${o.id}`} style={{ fontWeight: 700 }}>{o.number}</Link>
              <div className="muted small">Placed {o.created_at?.slice(0, 10)}{o.cancelled_at ? ` · Cancelled ${o.cancelled_at.slice(0, 10)}` : ''}</div>
            </div>
            <span className={`chip ${o.status.toLowerCase()}`}>{o.status}</span>
            <span className={`chip ${o.payment_status.toLowerCase()}`}>{o.payment_status}</span>
            <strong className="tabular-nums">{fmt(o.total)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
