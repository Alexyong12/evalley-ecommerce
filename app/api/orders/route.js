import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const orders = await db.prepare(`
    SELECT id, number, status, payment_status, total, created_at, cancelled_at
    FROM orders WHERE user_id = ? ORDER BY id DESC
  `).all(user.id);
  return NextResponse.json({ orders }, { headers: { 'Cache-Control': 'no-store' } });
}
