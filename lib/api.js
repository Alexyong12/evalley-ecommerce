'use client';

// The swappable API layer: every page calls the backend through this file only.
// To point the frontend at a different backend later, change API_BASE and
// (if needed) the paths below - nothing else in the app changes.
const API_BASE = '';

async function call(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'same-origin',
    ...opts,
    body: opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)
      ? JSON.stringify(opts.body) : opts.body,
  });
  let data = null;
  try { data = await res.json(); } catch { }
  if (opts.method && opts.method !== 'GET') {
    window.dispatchEvent(new CustomEvent('data-updated'));
  }
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  session: () => call('/api/session'),
  register: (body) => call('/api/auth/register', { method: 'POST', body }),
  verifyOtp: (body) => call('/api/auth/verify', { method: 'POST', body }),
  resendOtp: (body) => call('/api/auth/resend', { method: 'POST', body }),
  login: (body) => call('/api/auth/login', { method: 'POST', body }),
  logout: () => call('/api/auth/logout', { method: 'POST' }),

  products: (params) => call('/api/products?' + new URLSearchParams(params || {})),
  product: (slug) => call('/api/products/' + encodeURIComponent(slug)),

  cart: () => call('/api/cart'),
  addToCart: (body) => call('/api/cart', { method: 'POST', body }),
  updateCartItem: (id, qty) => call('/api/cart', { method: 'PATCH', body: { id, qty } }),
  removeCartItem: (id) => call('/api/cart', { method: 'DELETE', body: { id } }),

  wishlist: () => call('/api/wishlist'),
  toggleWishlist: (product_id) => call('/api/wishlist', { method: 'POST', body: { product_id } }),
  removeWishlist: (product_id) => call('/api/wishlist', { method: 'DELETE', body: { product_id } }),

  checkout: (body) => call('/api/checkout', { method: 'POST', body }),
  coupon: (code) => call('/api/coupon', { method: 'POST', body: { code } }),
  pay: (token, action) => call('/api/pay/' + token, { method: 'POST', body: { action } }),

  orders: () => call('/api/orders'),
  order: (id) => call('/api/orders/' + id),
  cancelOrder: (id) => call('/api/orders/' + id, { method: 'POST', body: { action: 'cancel' } }),

  addresses: () => call('/api/addresses'),
  addAddress: (body) => call('/api/addresses', { method: 'POST', body }),
  updateAddress: (id, body) => call('/api/addresses/' + id, { method: 'PATCH', body }),
  deleteAddress: (id) => call('/api/addresses/' + id, { method: 'DELETE' }),

  updateProfile: (body) => call('/api/profile', { method: 'PATCH', body }),
  uploadAvatar: (formData) => call('/api/profile/avatar', { method: 'POST', body: formData, headers: {} }),
  changePassword: (body) => call('/api/profile/password', { method: 'POST', body }),
  requestIdentifierChange: (body) => call('/api/profile/identifier', { method: 'POST', body }),
  confirmIdentifierChange: (body) => call('/api/profile/identifier', { method: 'PATCH', body }),

  myReviews: () => call('/api/reviews'),
  addReview: (body) => call('/api/reviews', { method: 'POST', body }),
  editReview: (id, body) => call('/api/reviews/' + id, { method: 'PATCH', body }),
  deleteReview: (id) => call('/api/reviews/' + id, { method: 'DELETE' }),

  notifications: () => call('/api/notifications'),
  markNotification: (id) => call('/api/notifications', { method: 'PATCH', body: { id } }),
  markAllNotifications: () => call('/api/notifications', { method: 'PATCH', body: { all: true } }),
  deleteNotification: (id) => call('/api/notifications', { method: 'DELETE', body: { id } }),

  chat: () => call('/api/chat'),
  sendChat: (body_) => call('/api/chat', { method: 'POST', body: { body: body_ } }),
};
