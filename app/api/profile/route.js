import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));

  if (b.name !== undefined) {
    const name = String(b.name).trim();
    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, user.id);
  }
  if (b.birthdate !== undefined) {
    const birthdate = String(b.birthdate || '').trim();
    if (birthdate && birthdate > new Date().toISOString().slice(0, 10)) {
      return NextResponse.json({ error: 'Date of birth cannot be in the future.' }, { status: 400 });
    }
    await db.prepare('UPDATE users SET birthdate = ? WHERE id = ?').run(birthdate || null, user.id);
  }
  return NextResponse.json({ ok: true, message: 'Profile updated.' });
}
