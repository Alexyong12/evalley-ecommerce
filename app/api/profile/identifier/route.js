import { NextResponse } from 'next/server';
import db, { verifyPassword } from '@/lib/db';
import { getSessionUser, identifierType } from '@/lib/auth';

const OTP_TTL_MS = 10 * 60 * 1000;

// Step 1: request a code to the NEW identifier ("Send code")
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));

  const identifier = String(b.identifier || '').trim();
  const type = identifierType(identifier);
  if (!type) return NextResponse.json({ error: 'Enter a valid email or phone number.' }, { status: 400 });
  if (await db.prepare('SELECT id FROM users WHERE identifier = ?').get(identifier)) {
    return NextResponse.json({ error: 'That email or phone is already registered.' }, { status: 400 });
  }
  if (!verifyPassword(String(b.current_password || ''), user.password)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  await db.prepare(`INSERT INTO otps (identifier, purpose, code, payload, attempts, expires_at, last_sent)
    VALUES (?,?,?,?,0,?,?)
    ON CONFLICT(identifier, purpose) DO UPDATE SET code=excluded.code, payload=excluded.payload,
      attempts=0, expires_at=excluded.expires_at, last_sent=excluded.last_sent`)
    .run('u' + user.id, 'identifier', '123456', JSON.stringify({ identifier, type }), Date.now() + OTP_TTL_MS, Date.now());
  return NextResponse.json({ sent_to: identifier });
}

// Step 2: confirm the code -> identifier actually changes
export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));

  const row = await db.prepare(`SELECT * FROM otps WHERE identifier = ? AND purpose = 'identifier'`).get('u' + user.id);
  if (!row) return NextResponse.json({ error: 'No change in progress.' }, { status: 400 });
  if (row.attempts >= 5) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  if (Date.now() > row.expires_at) return NextResponse.json({ error: 'That code has expired.' }, { status: 400 });
  if (String(b.code || '').trim() !== row.code) {
    await db.prepare(`UPDATE otps SET attempts = attempts + 1 WHERE identifier = ? AND purpose = 'identifier'`).run('u' + user.id);
    return NextResponse.json({ error: 'That code is not correct.' }, { status: 400 });
  }
  const data = JSON.parse(row.payload);
  await db.prepare('UPDATE users SET identifier = ?, identifier_type = ? WHERE id = ?').run(data.identifier, data.type, user.id);
  await db.prepare(`DELETE FROM otps WHERE identifier = ? AND purpose = 'identifier'`).run('u' + user.id);
  return NextResponse.json({ ok: true, message: 'Email/phone updated.' });
}
