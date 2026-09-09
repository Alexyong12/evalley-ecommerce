import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { identifierType } from '@/lib/auth';
import { validateName, validatePassword, validateBirthdate } from '@/lib/validate';
import { generateOtp, sendOtpSms, smsEnabled } from '@/lib/sms';

const FALLBACK_OTP_CODE = '123456'; // used when SMS isn't configured (local dev / automated tests)
const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const name = String(b.name || '').trim();
  const identifier = String(b.identifier || '').trim();
  const birthdate = String(b.birthdate || '').trim();
  const password = String(b.password || '');
  const confirmation = String(b.password_confirmation || '');

  const nameError = validateName(name);
  if (nameError) return err(nameError);
  const type = identifierType(identifier);
  if (!type) return err('Enter a valid email or phone number.');
  const dobError = validateBirthdate(birthdate);
  if (dobError) return err(dobError);
  const passwordError = validatePassword(password, { name, identifier });
  if (passwordError) return err(passwordError);
  if (password !== confirmation) return err('Passwords do not match.');

  const existing = db.prepare('SELECT id FROM users WHERE identifier = ?').get(identifier);
  if (existing) return err('That email or phone is already registered.');

  let code = FALLBACK_OTP_CODE;
  if (type === 'phone' && smsEnabled()) {
    code = generateOtp();
    const result = await sendOtpSms(identifier, code);
    if (!result.sent) return err('Could not send verification SMS. Please try again.');
  }

  const payload = JSON.stringify({ name, identifier, type, birthdate, password });
  db.prepare(`INSERT INTO otps (identifier, purpose, code, payload, attempts, expires_at, last_sent)
    VALUES (?, 'register', ?, ?, 0, ?, ?)
    ON CONFLICT(identifier, purpose) DO UPDATE SET code=excluded.code, payload=excluded.payload,
      attempts=0, expires_at=excluded.expires_at, last_sent=excluded.last_sent`)
    .run(identifier, code, payload, Date.now() + OTP_TTL_MS, Date.now());

  return NextResponse.json({ sent_to: identifier });
}

function err(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}
