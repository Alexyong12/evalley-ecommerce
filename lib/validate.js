// ── Registration field rules (derived from the Register test suite) ──────────
// Each returns a string error message, or '' when the value is valid.

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui',
  'qwerty123', '11111111', '00000000', 'iloveyou', 'abc12345', 'admin123',
  'welcome1', 'letmein1', 'football', 'baseball', 'sunshine', 'princess',
]);

// Full name: 8–60 chars after trimming; letters (any script, incl. Khmer) plus
// space, apostrophe, hyphen and dot. Rejects digit/symbol-only and markup.
export function validateName(value) {
  const n = String(value || '').trim();
  if (!n) return 'Full name is required.';
  if (n.length < 8) return 'Full name must be at least 8 characters.';
  if (n.length > 60) return 'Full name must be at most 60 characters.';
  if (!/^[\p{L}\p{M} .'-]+$/u.test(n)) return 'Full name may contain letters only.';
  if (!/\p{L}/u.test(n)) return 'Full name must contain letters.';
  return '';
}

// Password: 8–64 chars; upper + lower + digit + special; not a common password;
// must not contain the name or the identifier's local part.
export function validatePassword(value, { name = '', identifier = '' } = {}) {
  const p = String(value || '');
  if (p.length < 8) return 'Password must be at least 8 characters.';
  if (p.length > 64) return 'Password must be at most 64 characters.';
  if (!/[a-z]/.test(p)) return 'Password must include a lowercase letter.';
  if (!/[A-Z]/.test(p)) return 'Password must include an uppercase letter.';
  if (!/\d/.test(p)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(p)) return 'Password must include a special character.';
  if (COMMON_PASSWORDS.has(p.toLowerCase())) return 'This password is too common. Choose another.';
  const lc = p.toLowerCase();
  const idLocal = String(identifier || '').split('@')[0].trim().toLowerCase();
  if (idLocal.length >= 4 && lc.includes(idLocal)) return 'Password must not contain your email or phone.';
  const nameLc = String(name || '').trim().toLowerCase();
  if (nameLc.length >= 4 && lc.includes(nameLc)) return 'Password must not contain your name.';
  return '';
}

// Date of birth: optional; if present, not in the future and age between 13 and 120.
export function validateBirthdate(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const dob = Date.parse(v);
  if (Number.isNaN(dob)) return 'Enter a valid date of birth.';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (dob > today.getTime()) return 'Date of birth cannot be in the future.';
  const age = Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 13) return 'You must be at least 13 years old to register.';
  if (age > 120) return 'Enter a valid date of birth.';
  return '';
}

export function validateAddress(b) {
  const errors = {};
  if (!String(b.recipient_name || '').trim()) errors.recipient_name = 'Recipient name is required.';
  const phone = String(b.phone || '').trim();
  if (!phone) errors.phone = 'Phone is required.';
  else if (!/^\+?\d{8,15}$/.test(phone)) errors.phone = 'Enter a valid phone number.';
  if (!String(b.country_code || '').trim()) errors.country_code = 'Country is required.';
  if (!String(b.line1 || '').trim()) errors.line1 = 'Address line 1 is required.';
  if (!String(b.city || '').trim()) errors.city = 'City is required.';
  const postal = String(b.postal_code || '').trim();
  if (!postal) errors.postal_code = 'Postal code is required.';
  else if (!/^[A-Za-z0-9 -]{3,10}$/.test(postal)) errors.postal_code = 'Enter a valid postal code.';
  return errors;
}
