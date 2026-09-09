'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';

export default function AccountOverview() {
  const [orders, setOrders] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    api.orders().then(r => setOrders(r.data?.orders || []));
    api.session().then(r => setSession(r.data));
  }, []);

  const [addrCount, setAddrCount] = useState(0);
  useEffect(() => { api.addresses().then(r => setAddrCount((r.data?.addresses || []).length)); }, []);

  return (
    <div>
      <h1>Account</h1>
      <div className="stats">
        <div className="stat"><div className="label">ORDERS</div><div className="value">{orders.length}</div></div>
        <div className="stat"><div className="label">ADDRESSES</div><div className="value">{addrCount}</div></div>
        <div className="stat"><div className="label">WISHLIST</div><div className="value">{session?.wishlistCount ?? 0}</div></div>
      </div>
      <div className="card">
        <div className="section-head">
          <h2>Recent orders</h2>
          <Link href="/account/orders" className="muted small">View all</Link>
        </div>
        {orders.length === 0 && <p className="muted">No orders yet.</p>}
        {orders.slice(0, 5).map(o => (
          <div className="row" key={o.id}>
            <Link href={`/account/orders/${o.id}`} className="grow" style={{ fontWeight: 700 }}>{o.number}</Link>
            <span className={`chip ${o.status.toLowerCase()}`}>{o.status}</span>
            <span className="muted small">{o.created_at?.slice(0, 10)}</span>
            <strong className="tabular-nums">{fmt(o.total)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
