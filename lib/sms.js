import twilio from 'twilio';

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM_NUMBER;

const client = sid && token ? twilio(sid, token) : null;

export function smsEnabled() {
  return Boolean(client && from);
}

// Cambodia local numbers (0xxxxxxxx) -> E.164 (+855xxxxxxxx); already-international numbers pass through.
export function toE164(identifier) {
  const v = String(identifier).trim();
  if (v.startsWith('+')) return v;
  return '+855' + v.replace(/^0/, '');
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtpSms(identifier, code) {
  if (!client) return { sent: false, reason: 'SMS not configured' };
  try {
    await client.messages.create({
      to: toE164(identifier),
      from,
      body: `Your Evalley verification code is ${code}. It expires in 10 minutes.`,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}
