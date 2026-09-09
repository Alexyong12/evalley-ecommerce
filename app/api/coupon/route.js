import { NextResponse } from 'next/server';

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const code = String(b.code || '').trim().toUpperCase();
  if (code === 'WELCOME10') {
    return NextResponse.json({ ok: true, code, discount_pct: 10, message: 'Coupon applied: 10% off.' });
  }
  return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 });
}
