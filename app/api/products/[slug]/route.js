import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { slug } = await params;
  const product = db.prepare(`
    SELECT p.*, b.name AS brand_name, c.name AS category_name, c.parent AS category_parent,
      v.name AS vendor_name, v.slug AS vendor_slug,
      (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='Approved') AS rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status='Approved') AS review_count
    FROM products p
    LEFT JOIN brands b ON b.slug = p.brand
    LEFT JOIN categories c ON c.slug = p.category
    LEFT JOIN vendors v ON v.slug = p.vendor
    WHERE p.slug = ?
  `).get(slug);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ?').all(product.id);
  const reviews = db.prepare(`
    SELECT id, author, rating, body, created_at FROM reviews
    WHERE product_id = ? AND status = 'Approved' ORDER BY id DESC
  `).all(product.id);
  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  const related = db.prepare(`
    SELECT p.slug, p.name, p.price, p.original_price, p.color,
      (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='Approved') AS rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status='Approved') AS review_count
    FROM products p WHERE p.category = ? AND p.id != ? LIMIT 5
  `).all(product.category, product.id);

  return NextResponse.json({ product, variants, reviews, breakdown, related });
}
