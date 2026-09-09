import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { token } = await params;
  const order = db.prepare('SELECT number, total, payment_method, payment_status FROM orders WHERE pay_token = ?').get(token);
  if (!order) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function POST(request, { params }) {
  const { token } = await params;
  const b = await request.json().catch(() => ({}));
  const order = db.prepare('SELECT * FROM orders WHERE pay_token = ?').get(token);
  if (!order) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

  if (b.action === 'pay') {
    if (order.status === 'Cancelled') return NextResponse.json({ error: 'This order was cancelled.' }, { status: 400 });
    db.prepare(`UPDATE orders SET payment_status = 'Paid' WHERE id = ?`).run(order.id);
    db.prepare('INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)')
      .run(order.user_id, 'Payment received', `Payment for ${order.number} was received. Thank you!`, 'Order');
    return NextResponse.json({ ok: true, number: order.number });
  }
  // 'cancel' = abandon the gateway: order stays Pending/Unpaid (no false paid status)
  return NextResponse.json({ ok: true, number: order.number, abandoned: true });
}
