import { NextResponse } from 'next/server';
import db, { verifyPassword } from '@/lib/db';
import { createSession, mergeGuestCart } from '@/lib/auth';

const MAX_FAILS = 5;
const LOCK_MS = 60 * 1000;

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const identifier = String(b.identifier || '').trim();
  const password = String(b.password || '');
  if (!identifier || !password) {
    return NextResponse.json({ error: 'Email/phone and password are required.' }, { status: 400 });
  }

  const attempts = await db.prepare('SELECT * FROM login_attempts WHERE identifier = ?').get(identifier);
  if (attempts?.locked_until && Date.now() < attempts.locked_until) {
    const wait = Math.ceil((attempts.locked_until - Date.now()) / 1000);
    return NextResponse.json({ error: `Too many attempts. Try again in ${wait}s.` }, { status: 429 });
  }

  const user = await db.prepare('SELECT * FROM users WHERE identifier = ?').get(identifier);
  const ok = user && verifyPassword(password, user.password);
  if (!ok) {
    const count = (attempts?.count || 0) + 1;
    const locked = count >= MAX_FAILS ? Date.now() + LOCK_MS : null;
    await db.prepare(`INSERT INTO login_attempts (identifier, count, locked_until) VALUES (?,?,?)
      ON CONFLICT(identifier) DO UPDATE SET count = ?, locked_until = ?`)
      .run(identifier, locked ? 0 : count, locked, locked ? 0 : count, locked);
    if (locked) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 60s.' }, { status: 429 });
    }
    // Generic message on purpose: do not reveal whether the account exists.
    return NextResponse.json({ error: 'Invalid email/phone or password.' }, { status: 401 });
  }

  await db.prepare('DELETE FROM login_attempts WHERE identifier = ?').run(identifier);
  await createSession(user.id);
  await mergeGuestCart(user.id);
  return NextResponse.json({ ok: true, name: user.name });
}
