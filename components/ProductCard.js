'use client';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from './Toast';
import { fmt } from '@/lib/format';

export function Stars({ rating, count }) {
  const r = rating || 0;
  return (
    <div>
      <span className="stars" aria-label={r ? `${r.toFixed(1)} out of 5` : 'No rating yet'}>
        {'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))}
      </span>
      <span className="muted small"> {r ? `${r.toFixed(1)} out of 5` : 'No rating yet'} ({count || 0})</span>
    </div>
  );
}

export default function ProductCard({ product }) {
  const toast = useToast();
  const discountPct = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  const saveWish = async () => {
    const r = await api.toggleWishlist(product.id || product.slug);
    if (!r.ok) toast(r.data?.error || 'Something went wrong.', 'error');
    else toast(r.data.message, 'success');
  };

  return (
    <div className="product-card">
      {discountPct > 0 && <span className="discount-badge">−{discountPct}%</span>}
      <button className="wish-btn" aria-label={`Save ${product.name} to your wishlist`} onClick={saveWish}>♡</button>
      <Link href={`/products/${product.slug}`}>
        <div className="imgwrap">
          <img src={`/api/img/${encodeURIComponent(product.name)}?c=${(product.color || '#e8734a').slice(1)}`} alt={product.name} />
        </div>
        <div className="body">
          <h3>{product.name}</h3>
          <div className="price">
            {fmt(product.price)}
            {product.original_price && <span className="orig">{fmt(product.original_price)}</span>}
          </div>
          <Stars rating={product.rating} count={product.review_count} />
          {product.variant_count > 0 && <span className="muted small">Multiple options</span>}
          {product.stock === 0 && <span className="muted small">Out of stock</span>}
        </div>
      </Link>
    </div>
  );
}
