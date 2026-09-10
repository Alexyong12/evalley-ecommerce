import Link from 'next/link';
import db from '@/lib/db';
import { withRatings } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function VendorPage({ params }) {
  const { slug } = await params;
  const vendor = await db.prepare('SELECT * FROM vendors WHERE slug = ?').get(slug);
  if (!vendor) return <div className="container empty"><h1>404</h1><p>Seller not found.</p></div>;
  const products = await withRatings('WHERE p.vendor = ?', [slug]);
  return (
    <div className="container" style={{ marginTop: 24 }}>
      <div className="breadcrumb"><Link href="/vendors">All sellers</Link></div>
      <h1>{vendor.name}</h1>
      <p className="muted small">{vendor.country}</p>
      <h2>Products</h2>
      <div className="grid products">
        {products.map(p => <ProductCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
