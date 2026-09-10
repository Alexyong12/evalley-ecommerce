import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const messages = await db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id').all(user.id);
  return NextResponse.json({ messages }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const body = String(b.body || '').trim();
  if (!body) return NextResponse.json({ error: 'Type a message first.' }, { status: 400 });

  await db.prepare(`INSERT INTO chat_messages (user_id, sender, body) VALUES (?, 'user', ?)`).run(user.id, body);
  // Support auto-reply so the two-way flow is testable end to end
  await db.prepare(`INSERT INTO chat_messages (user_id, sender, body) VALUES (?, 'support', ?)`)
    .run(user.id, "Thanks for reaching out! Our support team will get back to you shortly.");

  const messages = await db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id').all(user.id);
  return NextResponse.json({ ok: true, messages });
}
