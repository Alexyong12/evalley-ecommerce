import Link from 'next/link';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Featured sellers · Evalley' };

export default async function VendorsPage() {
  const vendors = await db.prepare('SELECT * FROM vendors ORDER BY name').all();
  return (
    <div className="container" style={{ marginTop: 24 }}>
      <h1>Featured sellers</h1>
      <p className="muted">Independent shops trading on Evalley.</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
        {vendors.map(v => (
          <Link key={v.slug} href={`/vendors/${v.slug}`} className="card">
            <strong>{v.name}</strong>
            <div className="muted small">{v.country} · Visit store →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
