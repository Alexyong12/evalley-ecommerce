import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  }
  if (!String(file.type).startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be smaller than 2MB.' }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buf.toString('base64')}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(dataUri, user.id);
  return NextResponse.json({ ok: true, message: 'Photo updated.', avatar: dataUri });
}
