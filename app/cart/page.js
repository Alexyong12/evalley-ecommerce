'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { fmt } from '@/lib/format';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const toast = useToast();

  const load = () => api.cart().then(r => setCart(r.data));
  useEffect(() => { load(); }, []);

  const setQty = async (item, qty) => {
    const r = await api.updateCartItem(item.id, qty);
    if (!r.ok) toast(r.data?.error || 'Could not update quantity.', 'error');
    else setCart(r.data);
  };
  const remove = async (item) => {
    const r = await api.removeCartItem(item.id);
    if (r.ok) { setCart(r.data); toast('Removed from cart.'); }
  };

  if (!cart) return <div className="container empty">Loading…</div>;

  return (
    <div className="container" style={{ marginTop: 24 }}>
      <h1>Cart</h1>
      {cart.items.length === 0 ? (
        <div className="empty card">
          <h2>Your cart is empty</h2>
          <p>Browse the catalog and add something you like.</p>
          <Link href="/products" className="btn">Start shopping</Link>
        </div>
      ) : (
        <div className="two-col">
          <div className="card">
            {cart.items.map(item => (
              <div className="row" key={item.id}>
                <div className="thumb">
                  <img src={`/api/img/${encodeURIComponent(item.name)}?c=${(item.color || '#e8734a').slice(1)}`} alt={item.name} />
                </div>
                <div className="grow">
                  <Link href={`/products/${item.slug}`}><strong>{item.name}</strong></Link>
                  {item.variant && <div className="muted small">{item.variant}</div>}
                  <div className="price small">
                    {fmt(item.price)}
                    {item.original_price && <span className="orig">{fmt(item.original_price)}</span>}
                  </div>
                </div>
                <div className="qty">
                  <button aria-label="Decrease quantity" disabled={item.qty <= 1}
                    onClick={() => setQty(item, item.qty - 1)}>−</button>
                  <span className="tabular-nums">{item.qty}</span>
                  <button aria-label="Increase quantity" disabled={item.qty >= item.stock}
                    onClick={() => setQty(item, item.qty + 1)}>+</button>
                </div>
                <strong className="tabular-nums">{fmt(item.line_total)}</strong>
                <button className="btn ghost small" onClick={() => remove(item)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Summary</h2>
            <div className="summary-line"><span>Subtotal</span><span className="tabular-nums">{fmt(cart.subtotal)}</span></div>
            <div className="summary-line"><span>Delivery</span><span className="muted small">Calculated at checkout</span></div>
            <div className="summary-line total"><span>Total</span><span className="tabular-nums">{fmt(cart.subtotal)}</span></div>
            <Link href="/checkout" className="btn" style={{ width: '100%', marginTop: 14 }}>Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
