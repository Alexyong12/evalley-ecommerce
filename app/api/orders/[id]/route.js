import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  return NextResponse.json({ order, items }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  if (b.action !== 'cancel') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.status !== 'Pending') {
    return NextResponse.json({ error: 'Only pending orders can be cancelled.' }, { status: 400 });
  }

  const tx = db.transaction(() => {
    db.prepare(`UPDATE orders SET status = 'Cancelled', cancelled_at = datetime('now') WHERE id = ?`).run(order.id);
    // return stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const it of items) {
      if (it.variant) {
        const [size, color] = it.variant.split(' / ');
        db.prepare('UPDATE variants SET stock = stock + ? WHERE product_id = ? AND size = ? AND color = ?')
          .run(it.qty, it.product_id, size, color);
      } else {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(it.qty, it.product_id);
      }
    }
    db.prepare('INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)')
      .run(user.id, 'Order cancelled', `Your order ${order.number} was cancelled.`, 'Order');
  });
  tx();
  return NextResponse.json({ ok: true, status: 'Cancelled' });
}
