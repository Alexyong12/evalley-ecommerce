import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCartKey } from '@/lib/auth';

const DELIVERY_FEE = 2.00;

function cartPayload(cartKey) {
  const items = cartKey ? db.prepare(`
    SELECT ci.id, ci.qty, ci.variant_id,
      p.id AS product_id, p.slug, p.name, p.price, p.original_price, p.stock, p.color,
      v.size AS v_size, v.color AS v_color, v.stock AS v_stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN variants v ON v.id = ci.variant_id
    WHERE ci.cart_key = ?
    ORDER BY ci.id
  `).all(cartKey) : [];
  const mapped = items.map(i => ({
    id: i.id, product_id: i.product_id, slug: i.slug, name: i.name,
    variant: i.variant_id ? `${i.v_size} / ${i.v_color}` : null,
    price: i.price, original_price: i.original_price, qty: i.qty,
    stock: i.variant_id ? i.v_stock : i.stock,
    line_total: +(i.price * i.qty).toFixed(2),
    color: i.color,
  }));
  const subtotal = +mapped.reduce((s, i) => s + i.line_total, 0).toFixed(2);
  return { items: mapped, subtotal, delivery: mapped.length ? DELIVERY_FEE : 0, count: mapped.reduce((s, i) => s + i.qty, 0) };
}

export async function GET() {
  const cartKey = await getCartKey();
  return NextResponse.json(cartPayload(cartKey), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const cartKey = await getCartKey({ create: true });
  const product = b.product_id
    ? db.prepare('SELECT * FROM products WHERE id = ?').get(b.product_id)
    : db.prepare('SELECT * FROM products WHERE slug = ?').get(b.slug);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ?').all(product.id);
  let variant = null;
  if (variants.length) {
    variant = variants.find(v => v.id === b.variant_id);
    if (!variant) return NextResponse.json({ error: 'Select an option to continue.' }, { status: 400 });
  }

  const qty = Math.max(1, parseInt(b.qty, 10) || 1);
  const stock = variant ? variant.stock : product.stock;
  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_key = ? AND product_id = ? AND variant_id IS ?')
    .get(cartKey, product.id, variant ? variant.id : null);
  const already = existing ? existing.qty : 0;
  if (already + qty > stock) {
    return NextResponse.json({ error: `Only ${stock} left in stock.` }, { status: 400 });
  }
  if (existing) {
    db.prepare('UPDATE cart_items SET qty = qty + ? WHERE id = ?').run(qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (cart_key, product_id, variant_id, qty) VALUES (?,?,?,?)')
      .run(cartKey, product.id, variant ? variant.id : null, qty);
  }
  return NextResponse.json({ ok: true, message: 'Added to cart.', ...cartPayload(cartKey) });
}

export async function PATCH(request) {
  const b = await request.json().catch(() => ({}));
  const cartKey = await getCartKey();
  const item = db.prepare('SELECT ci.*, p.stock AS p_stock, v.stock AS v_stock FROM cart_items ci JOIN products p ON p.id=ci.product_id LEFT JOIN variants v ON v.id=ci.variant_id WHERE ci.id = ? AND ci.cart_key = ?').get(b.id, cartKey);
  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
  const qty = parseInt(b.qty, 10);
  if (!Number.isInteger(qty) || qty < 1) return NextResponse.json({ error: 'Quantity must be at least 1.' }, { status: 400 });
  const stock = item.variant_id ? item.v_stock : item.p_stock;
  if (qty > stock) return NextResponse.json({ error: `Only ${stock} left in stock.` }, { status: 400 });
  db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(qty, item.id);
  return NextResponse.json({ ok: true, ...cartPayload(cartKey) });
}

export async function DELETE(request) {
  const b = await request.json().catch(() => ({}));
  const cartKey = await getCartKey();
  db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_key = ?').run(b.id, cartKey);
  return NextResponse.json({ ok: true, ...cartPayload(cartKey) });
}
