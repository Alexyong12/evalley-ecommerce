import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const q = (p.get('q') || '').trim();
  const category = (p.get('category') || '').trim();
  const brand = (p.get('brand') || '').trim();
  const isFeatured = p.get('is_featured');
  const availability = (p.get('availability') || '').trim(); // '', 'in-stock', 'on-offer'
  const sort = (p.get('sort') || 'newest').trim();
  const limit = Math.min(parseInt(p.get('limit') || '60', 10) || 60, 100);

  const where = [];
  const args = {};
  if (q) { where.push('(p.name LIKE @q OR p.brand LIKE @q OR p.category LIKE @q)'); args.q = `%${q}%`; }
  if (category) { where.push('(p.category = @cat OR p.subcategory = @cat)'); args.cat = category; }
  if (brand) { where.push('p.brand = @brand'); args.brand = brand; }
  if (isFeatured) { where.push('p.is_featured = 1'); }
  if (availability === 'in-stock') where.push('p.stock > 0');
  if (availability === 'on-offer') where.push('p.original_price IS NOT NULL');

  let order = 'p.id DESC';
  if (sort === 'price-asc') order = 'p.price ASC';
  if (sort === 'price-desc') order = 'p.price DESC';

  const rows = db.prepare(`
    SELECT p.*,
      (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='Approved') AS rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status='Approved') AS review_count,
      (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count
    FROM products p
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${order}
    LIMIT ${limit}
  `).all(args);

  return NextResponse.json({ products: rows, total: rows.length });
}
