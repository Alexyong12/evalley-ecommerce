'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

function ProductListing() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const isFeatured = params.get('is_featured') || '';
  const availability = params.get('availability') || '';
  const sort = params.get('sort') || 'newest';

  const [data, setData] = useState(null);
  useEffect(() => {
    api.products({ q, category, brand, is_featured: isFeatured, availability, sort })
      .then(r => setData(r.data));
  }, [q, category, brand, isFeatured, availability, sort]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push('/products?' + next.toString());
  };

  const title = q ? `“${q}”` : category ? category.replace(/-/g, ' ') : brand ? brand : isFeatured ? 'Deals' : 'All products';
  const products = data?.products || [];

  return (
    <div className="container" style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 24, alignItems: 'start', marginTop: 24 }}>
      <aside>
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 className="small" style={{ letterSpacing: 1, marginBottom: 8 }}>AVAILABILITY</h3>
          {[['', 'All products'], ['on-offer', 'On offer'], ['in-stock', 'In stock']].map(([v, label]) => (
            <div key={v}><button className="btn ghost small" style={{ border: 0, padding: '3px 0', fontWeight: availability === v ? 700 : 400 }}
              onClick={() => setParam('availability', v)}>{label}</button></div>
          ))}
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 className="small" style={{ letterSpacing: 1, marginBottom: 8 }}>CATEGORY</h3>
          {['electronics', 'smartphones', 'kitchen', 'mens-clothing', 'drink', 'laptops', 'audio'].map(c => (
            <div key={c}><button className="btn ghost small" style={{ border: 0, padding: '3px 0', fontWeight: category === c ? 700 : 400 }}
              onClick={() => setParam('category', category === c ? '' : c)}>{c.replace(/-/g, ' ')}</button></div>
          ))}
        </div>
        <div className="card">
          <h3 className="small" style={{ letterSpacing: 1, marginBottom: 8 }}>BRAND</h3>
          {['apple', 'samsung', 'sony', 'anker', 'xiaomi', 'uniqlo', 'angkor'].map(b => (
            <div key={b}><button className="btn ghost small" style={{ border: 0, padding: '3px 0', fontWeight: brand === b ? 700 : 400 }}
              onClick={() => setParam('brand', brand === b ? '' : b)}>{b}</button></div>
          ))}
        </div>
      </aside>
      <div>
        <div className="section-head" style={{ alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: 2, textTransform: 'capitalize' }}>{title}</h1>
            <span className="muted small">{products.length} products</span>
          </div>
          <div>
            <label htmlFor="sort" className="muted small" style={{ marginRight: 6 }}>Sort</label>
            <select id="sort" value={sort} onChange={e => setParam('sort', e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px' }}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
        {data && products.length === 0 && (
          <div className="empty card">
            <h2>No products found</h2>
            <p>Try a different keyword or clear the filters.</p>
            <Link href="/products" className="btn secondary">Clear search</Link>
          </div>
        )}
        <div className="grid products">
          {products.map(p => <ProductCard key={p.slug} product={p} />)}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<div className="container empty">Loading…</div>}><ProductListing /></Suspense>;
}
