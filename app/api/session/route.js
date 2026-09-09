import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser, getCartKey } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  const cartKey = await getCartKey();
  const cartCount = cartKey
    ? db.prepare('SELECT COALESCE(SUM(qty),0) c FROM cart_items WHERE cart_key = ?').get(cartKey).c
    : 0;
  let wishlistCount = 0, unread = 0;
  if (user) {
    wishlistCount = db.prepare('SELECT COUNT(*) c FROM wishlist WHERE user_id = ?').get(user.id).c;
    unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0').get(user.id).c;
  }
  return NextResponse.json({
    user: user ? { id: user.id, name: user.name, identifier: user.identifier, identifier_type: user.identifier_type, birthdate: user.birthdate, avatar: user.avatar, created_at: user.created_at } : null,
    cartCount, wishlistCount, unread,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
