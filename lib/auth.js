import { cookies } from 'next/headers';
import crypto from 'crypto';
import db from './db';

export async function getSessionUser() {
  const store = await cookies();
  const sid = store.get('sid')?.value;
  if (!sid) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`).get(sid);
  return row || null;
}

export async function createSession(userId) {
  const store = await cookies();
  const sid = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (id, user_id) VALUES (?, ?)').run(sid, userId);
  store.set('sid', sid, { httpOnly: true, sameSite: 'lax', path: '/' });
  return sid;
}

export async function destroySession() {
  const store = await cookies();
  const sid = store.get('sid')?.value;
  if (sid) db.prepare('DELETE FROM sessions WHERE id = ?').run(sid);
  store.delete('sid');
}

// Cart key: logged-in users use "u<id>", guests use a cookie-based key.
export async function getCartKey({ create = false } = {}) {
  const user = await getSessionUser();
  if (user) return 'u' + user.id;
  const store = await cookies();
  let ck = store.get('cartkey')?.value;
  if (!ck && create) {
    ck = 'g' + crypto.randomBytes(16).toString('hex');
    store.set('cartkey', ck, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  }
  return ck || null;
}

// Merge guest cart into user cart on login.
export async function mergeGuestCart(userId) {
  const store = await cookies();
  const ck = store.get('cartkey')?.value;
  if (!ck) return;
  const guestItems = db.prepare('SELECT * FROM cart_items WHERE cart_key = ?').all(ck);
  const upsert = db.prepare(`
    INSERT INTO cart_items (cart_key, product_id, variant_id, qty) VALUES (?,?,?,?)
    ON CONFLICT(cart_key, product_id, variant_id) DO UPDATE SET qty = qty + excluded.qty
  `);
  for (const it of guestItems) upsert.run('u' + userId, it.product_id, it.variant_id, it.qty);
  db.prepare('DELETE FROM cart_items WHERE cart_key = ?').run(ck);
}

export function identifierType(identifier) {
  const v = String(identifier || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'email';
  if (/^0\d{8,9}$/.test(v) || /^\+855\d{8,9}$/.test(v)) return 'phone';
  return null;
}
