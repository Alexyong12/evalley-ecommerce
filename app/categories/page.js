import Link from 'next/link';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categories · Evalley' };

export default async function CategoriesPage() {
  const categories = await db.prepare('SELECT * FROM categories ORDER BY rowid').all();
  return (
    <div className="container" style={{ marginTop: 24 }}>
      <h1>Categories</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
        {categories.map(c => (
          <Link key={c.slug} href={`/products?category=${c.slug}`} className="card">
            <strong>{c.name}</strong>
            <p className="muted small" style={{ margin: '4px 0 0' }}>{c.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
