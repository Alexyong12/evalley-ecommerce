import { NextResponse } from 'next/server';
import db, { hashPassword } from '@/lib/db';
import { createSession, mergeGuestCart } from '@/lib/auth';

const MAX_ATTEMPTS = 5;

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const identifier = String(b.identifier || '').trim();
  const code = String(b.code || '').trim();

  const row = db.prepare(`SELECT * FROM otps WHERE identifier = ? AND purpose = 'register'`).get(identifier);
  if (!row) return err('No verification in progress. Please register again.');
  if (row.attempts >= MAX_ATTEMPTS) return err('Too many attempts. Please request a new code.', 429);
  if (Date.now() > row.expires_at) return err('That code has expired. Please resend a new one.');
  if (code !== row.code) {
    db.prepare(`UPDATE otps SET attempts = attempts + 1 WHERE identifier = ? AND purpose = 'register'`).run(identifier);
    return err('That code is not correct.');
  }

  const data = JSON.parse(row.payload);
  const info = db.prepare(`INSERT INTO users (name, identifier, identifier_type, birthdate, password, verified)
    VALUES (?,?,?,?,?,1)`).run(data.name, data.identifier, data.type, data.birthdate || null, hashPassword(data.password));
  db.prepare(`DELETE FROM otps WHERE identifier = ? AND purpose = 'register'`).run(identifier);

  await createSession(info.lastInsertRowid);
  await mergeGuestCart(info.lastInsertRowid);
  return NextResponse.json({ ok: true });
}

function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
