import Link from 'next/link';
import db from '@/lib/db';
import { withRatings } from '@/lib/queries';
import BannerSlider from '@/components/BannerSlider';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featured = await withRatings('WHERE p.is_featured = 1 ORDER BY p.id LIMIT 8');
  const bestsellers = await withRatings('WHERE p.is_bestseller = 1 ORDER BY p.id LIMIT 8');
  const categories = await db.prepare('SELECT * FROM categories ORDER BY rowid').all();
  const vendors = await db.prepare('SELECT * FROM vendors').all();

  return (
    <div className="container">
      <div className="section"><BannerSlider /></div>

      <section className="section" aria-label="Browse categories">
        <div className="section-head"><h2>Browse</h2><Link href="/categories" className="muted small">View all</Link></div>
        <div className="grid cats">
          {categories.map(c => (
            <Link key={c.slug} href={`/products?category=${c.slug}`} className="card" style={{ textAlign: 'center', padding: 10 }}>
              <img src={`/api/img/${encodeURIComponent(c.name)}?c=8f8f96`} alt={c.name} style={{ borderRadius: 8, marginBottom: 6 }} />
              <span className="small" style={{ fontWeight: 600 }}>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" aria-label="Featured products">
        <div className="section-head"><h2>Featured</h2><Link href="/products?is_featured=1" className="muted small">View all</Link></div>
        <div className="grid products">
          {featured.map(p => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="section" aria-label="Best sellers">
        <div className="section-head"><h2>Best sellers</h2><Link href="/products" className="muted small">View all</Link></div>
        <div className="grid products">
          {bestsellers.map(p => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="section" aria-label="Featured sellers">
        <div className="section-head"><h2>Featured sellers</h2><Link href="/vendors" className="muted small">All sellers</Link></div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
          {vendors.map(v => (
            <Link key={v.slug} href={`/vendors/${v.slug}`} className="card">
              <strong>{v.name}</strong>
              <div className="muted small">Visit store →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" aria-label="What customers say">
        <h2>What customers say</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
          {[
            ['Ordered in the evening and it arrived the next morning.', 'A customer in Phnom Penh'],
            ['Everything came properly wrapped, nothing was damaged.', 'A customer in Siem Reap'],
            ['Support answered on the same day and sorted it out.', 'A customer in Battambang'],
          ].map(([quote, who]) => (
            <div key={who} className="card">
              <p style={{ marginTop: 0 }}>“{quote}”</p>
              <span className="muted small">{who}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
