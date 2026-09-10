import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validateAddress } from '@/lib/validate';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const addresses = await db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id').all(user.id);
  return NextResponse.json({ addresses }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const errors = validateAddress(b);
  if (Object.keys(errors).length) return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });

  if (b.is_default) await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
  const info = await db.prepare(`INSERT INTO addresses
    (user_id, label, recipient_name, phone, country_code, line1, line2, city, state, postal_code, is_default)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(user.id, b.label || null, b.recipient_name.trim(), b.phone.trim(), b.country_code, b.line1.trim(),
      b.line2 || null, b.city.trim(), b.state || null, b.postal_code.trim(), b.is_default ? 1 : 0);
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
