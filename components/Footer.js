import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>EVALLEY</h4>
            <p>Electronics, homeware and everyday essentials, delivered across Cambodia since 2019.</p>
          </div>
          <div>
            <h4>QUICK LINKS</h4>
            <Link href="/products">Shop</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/brands">Brands</Link>
            <Link href="/vendors">Sellers</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div>
            <h4>CUSTOMER SERVICE</h4>
            <Link href="/faq">Delivery &amp; returns</Link>
            <Link href="/faq">Payments</Link>
            <Link href="/account">My account</Link>
          </div>
          <div>
            <h4>CONTACT</h4>
            <p>+855 12 345 678<br />support@evalley.example<br />Phnom Penh, Cambodia</p>
            <a href="https://www.facebook.com/evalley" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://www.instagram.com/evalley" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.youtube.com/@evalley" target="_blank" rel="noopener noreferrer">Youtube</a>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Evalley. All rights reserved.</div>
      </div>
    </footer>
  );
}
