'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const NAV = [
  ['/account', 'Overview'],
  ['/account/profile', 'Profile'],
  ['/account/orders', 'Orders'],
  ['/account/addresses', 'Addresses'],
  ['/account/wishlist', 'Wishlist'],
  ['/account/reviews', 'Reviews'],
  ['/account/notifications', 'Notifications'],
  ['/account/chat', 'Chat'],
];

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const r = await api.session();
      if (!r.data?.user) router.replace('/login?next=' + encodeURIComponent(pathname));
    };
    check();
    window.addEventListener('pageshow', check);
    return () => window.removeEventListener('pageshow', check);
  }, [pathname, router]);

  return (
    <div className="container account-wrap">
      <nav className="account-nav" aria-label="Account">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href}
            className={pathname === href || (href !== '/account' && pathname.startsWith(href)) ? 'on' : ''}>
            {label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
