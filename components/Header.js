'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';

const CATEGORIES = [
  ['electronics', 'Electronics'], ['smartphones', 'Smartphones'], ['kitchen', 'Kitchen'],
  ['mens-clothing', "Men's Clothing"], ['drink', 'Drink'], ['laptops', 'Laptops'],
  ['home-living', 'Home & Living'], ['furniture', 'Furniture'], ['audio', 'Audio'], ['fashion', 'Fashion'],
];

export default function Header() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sugg, setSugg] = useState([]);
  const suggTimer = useRef(null);
  //use with open
  const [open,setOpen]=useState(false);
  //dropdown of categories
  const ref = useRef(null);
  //use for display 
  useEffect(()=>{
    const clickDropdown=(e)=>{
      if(ref.current && !ref.current.contains(e.target)){
        setOpen(false);
      }
      document.addEventListener('mousedown',clickDropdown);
    }
    return ()=> document.removeEventListener('mousedown',clickDropdown);
  },[]);


  const refresh = () => { api.session().then(r => setSession(r.data)); };
  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener('data-updated', h);
    window.addEventListener('pageshow', h);
    return () => { window.removeEventListener('data-updated', h); window.removeEventListener('pageshow', h); };
  }, []);

  const onSearchChange = (v) => {
    setQ(v);
    clearTimeout(suggTimer.current);
    if (v.trim().length >= 2) {
      suggTimer.current = setTimeout(async () => {
        const r = await api.products({ q: v.trim(), limit: 5 });
        setSugg(r.data?.products || []);
      }, 250);
    } else setSugg([]);
  };

  const submit = (e) => {
    e.preventDefault();
    setSugg([]);
    router.push(`/products?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`);
  };

  const signOut = async () => {
    await api.logout();
    window.location.href = '/';
  };

  const user = session?.user;

  return (
    <>
      <div className="topbar">Free delivery over $50 &nbsp;·&nbsp; Cash on delivery &nbsp;·&nbsp; 7-day returns</div>
      <header className="site">
        <div className="container header-row">
          <Link href="/" className="logo">Evalley</Link>
          <form className="searchwrap" onSubmit={submit} role="search">
            <label htmlFor="site-search-category" className="sr-only">Category</label>
            <select id="site-search-category" name="category" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input id="site-search" name="q" type="search" placeholder="Search products"
              value={q} onChange={e => onSearchChange(e.target.value)} autoComplete="off" />
            <button type="submit" aria-label="Search products">🔍</button>
            {sugg.length > 0 && (
              <div className="suggestions" role="listbox" aria-label="Search suggestions">
                {sugg.map(p => (
                  <div key={p.slug} role="option" aria-selected="false"
                    onMouseDown={() => { setSugg([]); router.push('/products/' + p.slug); }}>
                    <span>{p.name}</span>
                    <span className="muted">{fmt(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
          <div className="header-links">
            {user && (
              <Link href="/account/wishlist" aria-label="Wishlist" title="Wishlist">
                ♡{session.wishlistCount > 0 && <span className="badge">{session.wishlistCount}</span>}
              </Link>
            )}
            {user && (
              <Link href="/account/notifications" aria-label="Notifications" title="Notifications">
                🔔{session.unread > 0 && <span className="badge">{session.unread}</span>}
              </Link>
            )}
            <Link href="/cart">Cart{session?.cartCount > 0 && <span className="badge">{session.cartCount}</span>}</Link>
            {user ? (
              <>
                <Link href="/account">{user.name.split(' ')[0]}</Link>
                <button className="btn ghost small" aria-label="Sign out" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </div>
        </div>
        <nav className="navbar">
          <section className="container">

            {/* Category Dropdown */}
            <div className="dropdown" ref={ref}>

              <button
                type="button"
                className="title"
                onClick={() => setOpen((prev) => !prev)}
              >
                Shop by Department
                <span className="arrow">
                  {open ? "▲" : "▼"}
                </span>
              </button>

              {open && (
                <div className="popup">
                  {CATEGORIES.map(([slug, name]) => (
                    <Link
                      key={slug}
                      href={`/products?category=${slug}`}
                      onClick={() => setOpen(false)}
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/products">Shop</Link>

            <Link href="/brands">Brands</Link>

            <Link href="/vendors">
              Featured sellers
            </Link>

            <Link href="/products?is_featured=1">
              Deals
            </Link>

            <Link href="/faq">
              FAQ
            </Link>

          </section>
        </nav>
      </header>
    </>
  );
}
