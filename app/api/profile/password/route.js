import { NextResponse } from 'next/server';
import db, { hashPassword, verifyPassword } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validatePassword } from '@/lib/validate';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));

  if (!verifyPassword(String(b.current_password || ''), user.password)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }
  const pw = String(b.password || '');
  const pwError = validatePassword(pw, { name: user.name, identifier: user.identifier });
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
  if (pw !== String(b.password_confirmation || '')) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
  }
  if (verifyPassword(pw, user.password)) {
    return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 });
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(pw), user.id);
  return NextResponse.json({ ok: true, message: 'Password updated.' });
}
