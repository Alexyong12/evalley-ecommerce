'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function Success() {
  const params = useSearchParams();
  const order = params.get('order') || '';
  const paid = params.get('paid') === '1';
  return (
    <div className="container empty">
      <div className="card" style={{ maxWidth: 520, margin: '40px auto' }}>
        <h1>Thank you! 🎉</h1>
        <p>Your order <strong>{order}</strong> has been placed{paid ? ' and paid' : ''}.</p>
        <p className="muted small">We&apos;ll let you know when it ships. A notification has been added to your account.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <Link href="/account/orders" className="btn">View my orders</Link>
          <Link href="/products" className="btn secondary">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="container empty">Loading…</div>}><Success /></Suspense>;
}
