import { productDetail } from '@/lib/queries';
import ProductDetail from '@/components/ProductDetail';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const data = productDetail(slug);
  if (!data) {
    return <div className="container empty"><h1>404</h1><p>Product not found.</p></div>;
  }
  return <ProductDetail data={data} />;
}
