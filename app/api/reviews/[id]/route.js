import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const rating = parseInt(b.rating ?? review.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: 'Choose a rating.' }, { status: 400 });
  const body = String(b.body ?? review.body).trim();
  if (!body) return NextResponse.json({ error: 'Write your review first.' }, { status: 400 });
  // Edited reviews go back to moderation
  db.prepare(`UPDATE reviews SET rating = ?, body = ?, status = 'Pending' WHERE id = ?`).run(rating, body, review.id);
  return NextResponse.json({ ok: true, message: 'Review updated. It is pending approval again.' });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  db.prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?').run(id, user.id);
  return NextResponse.json({ ok: true });
}
