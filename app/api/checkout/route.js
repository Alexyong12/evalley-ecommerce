import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const DELIVERY_FEE = 2.00;
const METHODS = { khqr: 'KHQR', vb: 'Vattanac Bank', card: 'Visa/Master Card', cod: 'Cash on Delivery' };

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to check out.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));

  const method = METHODS[b.payment_method_code];
  if (!method) return NextResponse.json({ error: 'Choose a payment method.' }, { status: 400 });

  const address = await db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(b.shipping_address_id, user.id);
  if (!address) return NextResponse.json({ error: 'Choose a shipping address.' }, { status: 400 });

  const cartKey = 'u' + user.id;
  const items = await db.prepare(`
    SELECT ci.*, p.name, p.price, p.sku, p.stock AS p_stock, p.slug,
      v.size AS v_size, v.color AS v_color, v.stock AS v_stock, v.sku AS v_sku
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    LEFT JOIN variants v ON v.id = ci.variant_id
    WHERE ci.cart_key = ?
  `).all(cartKey);
  if (!items.length) return NextResponse.json({ error: 'Your cart has no available items.' }, { status: 400 });

  for (const it of items) {
    const stock = it.variant_id ? it.v_stock : it.p_stock;
    if (it.qty > stock) {
      return NextResponse.json({ error: `Only ${stock} left in stock for ${it.name}.` }, { status: 400 });
    }
  }

  const subtotal = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
  let discount = 0;
  if (b.coupon && String(b.coupon).toUpperCase() === 'WELCOME10') {
    discount = +(subtotal * 0.10).toFixed(2);
  }
  const delivery = DELIVERY_FEE;
  const total = +(subtotal + delivery - discount).toFixed(2);

  const number = 'ORD-' + crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 10);
  const isOnline = b.payment_method_code !== 'cod';
  const payToken = isOnline ? crypto.randomBytes(12).toString('hex') : null;
  const addressText = `${address.label ? address.label + ' · ' : ''}${address.recipient_name} — ${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.postal_code}, ${address.country_code} · ${address.phone}`;

  const orderId = await db.transaction(async (tx) => {
    const info = await tx.prepare(`INSERT INTO orders
      (number, user_id, status, payment_method, payment_status, pay_token, note, coupon, subtotal, delivery, discount, total, address_text)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(number, user.id, 'Pending', method, 'Unpaid', payToken, b.note || null, b.coupon || null, subtotal, delivery, discount, total, addressText);
    const newOrderId = info.lastInsertRowid;
    const ii = tx.prepare('INSERT INTO order_items (order_id, product_id, name, variant, sku, price, qty) VALUES (?,?,?,?,?,?,?)');
    for (const it of items) {
      await ii.run(newOrderId, it.product_id, it.name, it.variant_id ? `${it.v_size} / ${it.v_color}` : null,
        it.v_sku || it.sku, it.price, it.qty);
      if (it.variant_id) await tx.prepare('UPDATE variants SET stock = stock - ? WHERE id = ?').run(it.qty, it.variant_id);
      else await tx.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(it.qty, it.product_id);
    }
    await tx.prepare('DELETE FROM cart_items WHERE cart_key = ?').run(cartKey);
    await tx.prepare('INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)')
      .run(user.id, 'Order received', `We've got your order ${number}. We'll let you know when it ships.`, 'Order');
    return newOrderId;
  });

  return NextResponse.json({
    ok: true, number, id: orderId,
    redirect: isOnline ? `/pay/${payToken}` : `/checkout/success?order=${number}`,
  });
}
