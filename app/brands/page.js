import Link from 'next/link';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Brands · Evalley' };

export default async function BrandsPage() {
  const brands = await db.prepare('SELECT * FROM brands ORDER BY name').all();
  return (
    <div className="container" style={{ marginTop: 24 }}>
      <h1>Brands</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
        {brands.map(b => (
          <Link key={b.slug} href={`/products?brand=${b.slug}`} className="card">
            <strong>{b.name}</strong>
            <p className="muted small" style={{ margin: '4px 0 0' }}>{b.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
