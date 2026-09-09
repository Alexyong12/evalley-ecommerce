import { NextResponse } from 'next/server';

// Product/category artwork served as generated SVG - no external image host,
// so images can never break (fixes the broken-image bug found in E2E testing).
export async function GET(request, { params }) {
  const { name } = await params;
  const text = decodeURIComponent(name).slice(0, 40);
  const color = '#' + (request.nextUrl.searchParams.get('c') || 'e8734a').replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
  const initials = text.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0.55"/>
  </linearGradient></defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <circle cx="470" cy="130" r="180" fill="#ffffff" opacity="0.10"/>
  <circle cx="90" cy="520" r="140" fill="#ffffff" opacity="0.08"/>
  <text x="300" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="130" font-weight="700"
    fill="#ffffff" text-anchor="middle" opacity="0.9">${initials}</text>
  <text x="300" y="380" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#ffffff"
    text-anchor="middle" opacity="0.85">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
</svg>`;
  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  });
}
