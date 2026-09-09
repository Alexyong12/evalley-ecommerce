'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { fmt } from '@/lib/format';

const STEPS = ['Order placed', 'Packed', 'Shipped', 'Delivered'];

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = () => api.order(id).then(r => setData(r.data));
  useEffect(() => { load(); }, [id]);

  if (!data) return <div className="empty">Loading…</div>;
  if (data.error) return <div className="empty"><h1>Order</h1><p>{data.error}</p></div>;
  const { order, items } = data;

  const cancel = async () => {
    setConfirmOpen(false);
    const r = await api.cancelOrder(order.id);
    if (!r.ok) { toast(r.data?.error || 'Could not cancel.', 'error'); return; }
    toast('Order cancelled.', 'success');
    load();
  };

  const stepState = (i) => order.status === 'Cancelled' ? 'cancelled' : i === 0 ? 'done' : i === 1 ? 'progress' : 'pending';

  return (
    <div>
      <div className="breadcrumb"><Link href="/account/orders">← Orders</Link></div>
      <div className="section-head" style={{ alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{order.number}</h1>
        {order.status === 'Pending' && (
          <button className="btn danger small" onClick={() => setConfirmOpen(true)}>Cancel order</button>
        )}
      </div>
      <p>
        <span className={`chip ${order.status.toLowerCase()}`}>{order.status}</span>{' '}
        <span className={`chip ${order.payment_status.toLowerCase()}`}>{order.payment_status}</span>
        <span className="muted small"> · Placed {order.created_at?.slice(0, 16)}</span>
      </p>
      {order.status === 'Pending' && order.payment_status === 'Unpaid' && order.pay_token && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 8px' }}>This order is waiting for payment.</p>
          <Link href={`/pay/${order.pay_token}`} className="btn small">Complete payment</Link>
        </div>
      )}

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h2>Order tracking</h2>
            {order.status === 'Cancelled'
              ? <p className="muted">This order was cancelled{order.cancelled_at ? ` on ${order.cancelled_at.slice(0, 10)}` : ''}.</p>
              : STEPS.map((s, i) => (
                <div className="track-step" key={s}>
                  <div className={`track-dot ${stepState(i) === 'done' ? 'done' : ''}`}>{stepState(i) === 'done' ? '✓' : i + 1}</div>
                  <div>
                    <strong>Step {i + 1} of 4: {s}</strong> — {stepState(i) === 'done' ? 'Done' : stepState(i) === 'progress' ? 'In progress' : 'Pending'}
                    {i === 0 && <div className="muted small">{order.created_at?.slice(0, 16)}</div>}
                  </div>
                </div>
              ))}
            {order.status !== 'Cancelled' && <p className="muted small">We will update this as your order moves.</p>}
          </div>

          <div className="card">
            <h2>Items</h2>
            {items.map(it => (
              <div className="row" key={it.id}>
                <div className="grow">
                  <strong>{it.name}</strong>
                  {it.variant && <div className="muted small">{it.variant}</div>}
                  <div className="muted small">SKU {it.sku}</div>
                </div>
                <span className="tabular-nums">{it.qty} × {fmt(it.price)}</span>
                <strong className="tabular-nums">{fmt((it.qty * it.price))}</strong>
              </div>
            ))}
            <div className="summary-line" style={{ marginTop: 8 }}><span>Subtotal</span><span className="tabular-nums">{fmt(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="summary-line"><span>Discount</span><span className="tabular-nums">−{fmt(order.discount)}</span></div>}
            <div className="summary-line"><span>Delivery</span><span className="tabular-nums">{fmt(order.delivery)}</span></div>
            <div className="summary-line total"><span>Total</span><span className="tabular-nums">{fmt(order.total)}</span></div>
          </div>
        </div>

        <div className="card">
          <h2>Delivery &amp; payment</h2>
          <p className="small"><strong>Address</strong><br />{order.address_text}</p>
          <p className="small"><strong>Payment method</strong><br />{order.payment_method}</p>
          {order.note && <p className="small"><strong>Note</strong><br />{order.note}</p>}
        </div>
      </div>

      <ConfirmDialog open={confirmOpen} title="Cancel this order?"
        message={`${order.number} will be cancelled and the items returned to stock.`}
        confirmLabel="Cancel order" danger
        onConfirm={cancel} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
