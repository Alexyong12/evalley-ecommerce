'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function MyReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = () => api.myReviews().then(r => setReviews(r.data?.reviews || []));
  useEffect(() => { load(); }, []);

  const openEdit = (r) => { setEditing(r.id); setRating(r.rating); setBody(r.body); };
  const saveEdit = async (e) => {
    e.preventDefault();
    const r = await api.editReview(editing, { rating, body });
    if (!r.ok) { toast(r.data?.error || 'Could not save.', 'error'); return; }
    toast(r.data.message, 'success');
    setEditing(null);
    load();
  };
  const doDelete = async () => {
    await api.deleteReview(deleting.id);
    setDeleting(null);
    toast('Review deleted.');
    load();
  };

  if (!reviews) return <div className="empty">Loading…</div>;

  return (
    <div>
      <h1>Reviews</h1>
      <p className="muted small">New reviews stay pending until an administrator approves them.</p>
      {reviews.length === 0 && (
        <div className="empty card">
          <p>You haven&apos;t written any reviews yet.</p>
          <Link href="/products" className="btn">Browse products</Link>
        </div>
      )}
      {reviews.map(r => (
        <div className="card" key={r.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href={`/products/${r.product_slug}`}><strong>{r.product_name}</strong></Link>
            <span className={`chip ${r.status.toLowerCase()}`}>{r.status}</span>
            <span className="muted small">{r.created_at?.slice(0, 10)}</span>
          </div>
          {editing === r.id ? (
            <form onSubmit={saveEdit} style={{ marginTop: 10 }}>
              <div className="chips" style={{ marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <label key={n} className={rating >= n ? 'on' : ''} aria-label={`${n} out of 5`}>
                    <input type="radio" name="rating" value={n} className="sr-only"
                      checked={rating === n} onChange={() => setRating(n)} />★
                  </label>
                ))}
              </div>
              <textarea rows={3} value={body} onChange={e => setBody(e.target.value)}
                style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: 10 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn small" type="submit" disabled={!rating || !body.trim()}>Save</button>
                <button className="btn secondary small" type="button" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="stars" style={{ margin: '6px 0' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <p style={{ margin: '0 0 10px' }}>{r.body}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn secondary small" onClick={() => openEdit(r)}>Edit</button>
                <button className="btn ghost small" onClick={() => setDeleting(r)}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
      <ConfirmDialog open={!!deleting} title="Delete this review?"
        message={deleting ? `Your review of ${deleting.product_name} will be removed.` : ''}
        confirmLabel="Delete" danger onConfirm={doDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
