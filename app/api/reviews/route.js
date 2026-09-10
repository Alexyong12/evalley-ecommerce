import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const reviews = await db.prepare(`
    SELECT r.*, p.name AS product_name, p.slug AS product_slug
    FROM reviews r JOIN products p ON p.id = r.product_id
    WHERE r.user_id = ? ORDER BY r.id DESC
  `).all(user.id);
  return NextResponse.json({ reviews }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to write a review.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const product = await db.prepare('SELECT id FROM products WHERE slug = ? OR id = ?').get(b.product_slug || '', b.product_id || 0);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  const rating = parseInt(b.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: 'Choose a rating.' }, { status: 400 });
  const body = String(b.body || '').trim();
  if (!body) return NextResponse.json({ error: 'Write your review first.' }, { status: 400 });

  await db.prepare(`INSERT INTO reviews (product_id, user_id, author, rating, body, status)
    VALUES (?,?,?,?,?, 'Pending')`).run(product.id, user.id, user.name, rating, body);
  return NextResponse.json({ ok: true, message: 'Thanks! Your review is pending approval.' });
}
