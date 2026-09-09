'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from './Toast';
import ProductCard, { Stars } from './ProductCard';
import { fmt } from '@/lib/format';

export default function ProductDetail({ data }) {
  const { product, variants, reviews, breakdown, related } = data;
  const toast = useToast();

  const sizes = [...new Set(variants.map(v => v.size))];
  const colors = [...new Set(variants.map(v => v.color))];
  const hasVariants = variants.length > 0;

  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [imgIdx, setImgIdx] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');

  const selectedVariant = useMemo(() =>
    hasVariants && size && color ? variants.find(v => v.size === size && v.color === color) : null,
    [size, color, hasVariants, variants]);

  const variantChosen = !hasVariants || !!selectedVariant;
  const stock = hasVariants
    ? (selectedVariant ? selectedVariant.stock : variants.reduce((s, v) => s + v.stock, 0))
    : product.stock;
  const inStock = stock > 0;
  const canAdd = variantChosen && inStock;

  const imgs = [product.color, '#6b6b8f', '#2f9e6e'].map((c, i) =>
    `/api/img/${encodeURIComponent(product.name + (i ? ' ' + (i + 1) : ''))}?c=${c.replace('#', '')}`);

  const setQtySafe = (n) => setQty(Math.min(Math.max(1, n), Math.max(1, stock)));

  const addToCart = async () => {
    const r = await api.addToCart({ product_id: product.id, variant_id: selectedVariant?.id, qty });
    if (!r.ok) toast(r.data?.error || 'Could not add to cart.', 'error');
    else toast('Added to cart.', 'success');
  };

  const saveWish = async () => {
    const r = await api.toggleWishlist(product.id);
    if (!r.ok) toast(r.data?.error || 'Something went wrong.', 'error');
    else toast(r.data.message, 'success');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const r = await api.addReview({ product_id: product.id, rating, body: reviewBody });
    if (!r.ok) toast(r.data?.error || 'Could not submit review.', 'error');
    else { toast(r.data.message, 'success'); setRating(0); setReviewBody(''); }
  };

  const discountPct = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div className="container" style={{ marginTop: 20 }}>
      <div className="breadcrumb">
        <Link href="/products">Shop</Link>
        {' / '}
        <Link href={`/products?category=${product.category}`}>{product.category_name}</Link>
        {' / '}{product.name}
      </div>

      <div className="detail-grid">
        <div>
          <div className="gallery-main"><img src={imgs[imgIdx]} alt={product.name} /></div>
          <div className="gallery-thumbs">
            {imgs.map((src, i) => (
              <button key={i} className={i === imgIdx ? 'on' : ''} onClick={() => setImgIdx(i)}
                aria-label={`Show image ${i + 1}`}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Link href={`/products?brand=${product.brand}`} className="muted small">{product.brand_name}</Link>
          <h1 style={{ margin: '4px 0 6px' }}>{product.name}</h1>
          <Stars rating={product.rating} count={product.review_count} />
          <p style={{ margin: '8px 0 2px' }}>
            {inStock
              ? <><strong style={{ color: 'var(--good)' }}>In stock</strong> <span className="muted small">{stock} available</span></>
              : <strong style={{ color: 'var(--bad)' }}>Out of stock</strong>}
          </p>
          {!inStock && <p className="muted small">This item is currently out of stock.</p>}
          <p className="price" style={{ fontSize: '1.6rem', margin: '10px 0' }}>
            {fmt(product.price)}
            {product.original_price && <span className="orig">{fmt(product.original_price)}</span>}
            {discountPct > 0 && <span className="chip pending" style={{ marginLeft: 8 }}>Save {discountPct}%</span>}
          </p>

          {hasVariants && (
            <>
              <div style={{ marginBottom: 10 }}>
                <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>Size</div>
                <div className="chips">
                  {sizes.map(s => (
                    <label key={s} className={size === s ? 'on' : ''}>
                      <input type="radio" name="option-Size" value={s} className="sr-only"
                        checked={size === s} onChange={() => setSize(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>Color</div>
                <div className="chips">
                  {colors.map(c => (
                    <label key={c} className={color === c ? 'on' : ''}>
                      <input type="radio" name="option-Color" value={c} className="sr-only"
                        checked={color === c} onChange={() => setColor(c)} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              {!variantChosen && <p className="muted small">Select an option to continue.</p>}
              {selectedVariant && (
                <p className="small" style={{ color: selectedVariant.stock > 0 ? 'var(--good)' : 'var(--bad)' }}>
                  {selectedVariant.stock > 0
                    ? `Selected option: ${size} / ${color} — ${selectedVariant.stock} available`
                    : `Selected option: ${size} / ${color} — out of stock`}
                </p>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '14px 0' }}>
            <div className="qty">
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1}
                onClick={() => setQtySafe(qty - 1)}>−</button>
              <span className="tabular-nums">{qty}</span>
              <button type="button" aria-label="Increase quantity" disabled={!inStock || qty >= stock}
                onClick={() => setQtySafe(qty + 1)}>+</button>
            </div>
            <button type="submit" className="btn" disabled={!canAdd} onClick={addToCart}>Add to cart</button>
            <button type="submit" className="btn secondary" onClick={saveWish}>Save to wishlist</button>
          </div>

          <div className="small muted" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
            <span>SKU</span><span>{selectedVariant?.sku || product.sku}</span>
            <span>Categories</span>
            <span>
              {product.category_parent && <Link href={`/products?category=${product.category_parent}`} style={{ textTransform: 'capitalize' }}>{product.category_parent}, </Link>}
              <Link href={`/products?category=${product.category}`}>{product.category_name}</Link>
            </span>
            <span>Seller</span>
            <span><Link href={`/vendors/${product.vendor_slug}`}>{product.vendor_name}</Link></span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="tabs" role="tablist">
          <button role="tab" className={tab === 'description' ? 'on' : ''} onClick={() => setTab('description')}>Description</button>
          <button role="tab" className={tab === 'specification' ? 'on' : ''} onClick={() => setTab('specification')}>Specification</button>
          <button role="tab" className={tab === 'reviews' ? 'on' : ''} onClick={() => setTab('reviews')}>Reviews</button>
        </div>

        {tab === 'description' && <p>{product.description}</p>}
        {tab === 'specification' && <p>{product.specification}</p>}
        {tab === 'reviews' && (
          <div className="two-col">
            <div>
              <h2>{product.review_count} review{product.review_count === 1 ? '' : 's'}</h2>
              <Stars rating={product.rating} count={product.review_count} />
              <div style={{ margin: '10px 0 18px', maxWidth: 320 }}>
                {breakdown.map(b => (
                  <div key={b.star} className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 44 }}>{b.star} star</span>
                    <div style={{ flex: 1, height: 7, background: '#eee5dc', borderRadius: 99 }}>
                      <div style={{ width: `${product.review_count ? (b.count / product.review_count) * 100 : 0}%`, height: '100%', background: '#e8a30f', borderRadius: 99 }} />
                    </div>
                    <span className="muted">{b.count}</span>
                  </div>
                ))}
              </div>
              <p className="muted small">Showing {reviews.length} of {product.review_count} reviews.</p>
              {reviews.length === 0 && (
                <div className="empty card"><strong>No reviews yet</strong>
                  <p>Reviews appear here once a customer submits one and it is approved.</p></div>
              )}
              {reviews.map(r => (
                <div key={r.id} className="card" style={{ marginBottom: 10 }}>
                  <Stars rating={r.rating} count={undefined} />
                  <p style={{ margin: '6px 0' }}>{r.body}</p>
                  <span className="muted small">{r.author} · {r.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
            <form className="card" onSubmit={submitReview}>
              <h2>Write a review</h2>
              <div className="field">
                <label>Your rating*</label>
                <div className="chips">
                  {[1, 2, 3, 4, 5].map(n => (
                    <label key={n} className={rating >= n ? 'on' : ''} aria-label={`${n} out of 5`}>
                      <input type="radio" name="rating" value={n} className="sr-only"
                        checked={rating === n} onChange={() => setRating(n)} />
                      ★
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="body">Your review*</label>
                <textarea id="body" name="body" rows={4} required value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)} />
              </div>
              <button className="btn" type="submit" disabled={!rating || !reviewBody.trim()}>Submit review</button>
              <p className="muted small" style={{ marginBottom: 0 }}>Reviews are checked before they appear.</p>
            </form>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="section">
          <h2>You may also like</h2>
          <div className="grid products">
            {related.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
