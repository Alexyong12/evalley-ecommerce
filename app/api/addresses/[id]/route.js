import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validateAddress } from '@/lib/validate';

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const merged = { ...existing, ...b };
  const errors = validateAddress(merged);
  if (Object.keys(errors).length) return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });

  if (b.is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
  db.prepare(`UPDATE addresses SET label=?, recipient_name=?, phone=?, country_code=?, line1=?, line2=?, city=?, state=?, postal_code=?, is_default=?
    WHERE id = ?`)
    .run(merged.label || null, merged.recipient_name, merged.phone, merged.country_code, merged.line1,
      merged.line2 || null, merged.city, merged.state || null, merged.postal_code,
      merged.is_default ? 1 : 0, existing.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, user.id);
  return NextResponse.json({ ok: true });
}
