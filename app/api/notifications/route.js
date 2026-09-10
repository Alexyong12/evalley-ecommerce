import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const notifications = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC').all(user.id);
  return NextResponse.json({ notifications }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (b.all) {
    await db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(user.id);
  } else {
    await db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(b.id, user.id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  await db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(b.id, user.id);
  return NextResponse.json({ ok: true });
}
