import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { identifierType } from '@/lib/auth';
import { generateOtp, sendOtpSms, smsEnabled } from '@/lib/sms';

const COOLDOWN_MS = 30 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const FALLBACK_OTP_CODE = '123456'; // used when SMS isn't configured (local dev / automated tests)

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const identifier = String(b.identifier || '').trim();
  const row = db.prepare(`SELECT * FROM otps WHERE identifier = ? AND purpose = 'register'`).get(identifier);
  if (!row) return NextResponse.json({ error: 'No verification in progress.' }, { status: 400 });
  if (row.last_sent && Date.now() - row.last_sent < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (Date.now() - row.last_sent)) / 1000);
    return NextResponse.json({ error: `Please wait ${wait}s before requesting another code.` }, { status: 429 });
  }

  let code = FALLBACK_OTP_CODE;
  if (identifierType(identifier) === 'phone' && smsEnabled()) {
    code = generateOtp();
    const result = await sendOtpSms(identifier, code);
    if (!result.sent) return NextResponse.json({ error: 'Could not send verification SMS. Please try again.' }, { status: 400 });
  }

  db.prepare(`UPDATE otps SET code = ?, attempts = 0, expires_at = ?, last_sent = ?
    WHERE identifier = ? AND purpose = 'register'`).run(code, Date.now() + OTP_TTL_MS, Date.now(), identifier);
  return NextResponse.json({ sent_to: identifier });
}
