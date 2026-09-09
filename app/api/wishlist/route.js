import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } });
  const items = db.prepare(`
    SELECT w.product_id, p.slug, p.name, p.price, p.original_price, p.stock, p.color,
      (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count
    FROM wishlist w JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ? ORDER BY w.created_at DESC
  `).all(user.id);
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to save this to your wishlist.' }, { status: 401 });
  }
  const b = await request.json().catch(() => ({}));
  const product = db.prepare('SELECT id, name FROM products WHERE id = ? OR slug = ?').get(b.product_id || 0, b.product_id || '');
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  const existing = db.prepare('SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?').get(user.id, product.id);
  if (existing) {
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(user.id, product.id);
    return NextResponse.json({ removed: true, message: 'Removed from wishlist.' });
  }
  db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?,?)').run(user.id, product.id);
  return NextResponse.json({ added: true, message: 'Saved to wishlist.' });
}

export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(user.id, b.product_id);
  return NextResponse.json({ removed: true });
}
