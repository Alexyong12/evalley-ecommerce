'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { fmt } from '@/lib/format';

export default function WishlistPage() {
  const toast = useToast();
  const [items, setItems] = useState(null);

  const load = () => api.wishlist().then(r => setItems(r.data?.items || []));
  useEffect(() => { load(); }, []);

  const remove = async (it) => {
    await api.removeWishlist(it.product_id);
    toast('Removed from wishlist.');
    load();
  };

  const addToCart = async (it) => {
    if (it.variant_count > 0) {
      window.location.href = '/products/' + it.slug;
      return;
    }
    const r = await api.addToCart({ product_id: it.product_id, qty: 1 });
    if (!r.ok) toast(r.data?.error || 'Could not add to cart.', 'error');
    else toast('Added to cart.', 'success');
  };

  if (!items) return <div className="empty">Loading…</div>;

  return (
    <div>
      <h1>Wishlist</h1>
      {items.length === 0 ? (
        <div className="empty card">
          <h2>Your wishlist is empty</h2>
          <p>Save products you&apos;re interested in and find them here later.</p>
          <Link href="/products" className="btn">Browse products</Link>
        </div>
      ) : (
        <div className="card">
          {items.map(it => (
            <div className="row" key={it.product_id}>
              <div className="thumb">
                <img src={`/api/img/${encodeURIComponent(it.name)}?c=${(it.color || '#e8734a').slice(1)}`} alt={it.name} />
              </div>
              <div className="grow">
                <Link href={`/products/${it.slug}`}><strong>{it.name}</strong></Link>
                <div className="price small">
                  {fmt(it.price)}
                  {it.original_price && <span className="orig">{fmt(it.original_price)}</span>}
                </div>
                {it.stock === 0 && <span className="muted small">Out of stock</span>}
              </div>
              <button className="btn small" disabled={it.stock === 0} onClick={() => addToCart(it)}>Add to cart</button>
              <button className="btn ghost small" onClick={() => remove(it)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
