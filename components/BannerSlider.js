'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    title: 'New Season Tech', text: 'Up to 30% off phones and laptops', cta: 'Shop electronics',
    href: '/products?category=electronics', bg: 'linear-gradient(120deg,#4a2c8f,#e8500f)',
  },
  {
    title: 'Everything for the Kitchen', text: 'Cookware and tableware from $1', cta: 'Shop kitchen',
    href: '/products?category=kitchen', bg: 'linear-gradient(120deg,#173f2e,#2f9e6e)',
  },
];

export default function BannerSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="banner" aria-roledescription="carousel">
      {SLIDES.map((s, idx) => (
        <div key={idx} className={`slide ${idx === i ? 'active' : ''}`} style={{ background: s.bg }}>
          <Link href={s.href}>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            <span className="btn secondary" style={{ alignSelf: 'flex-start' }}>{s.cta}</span>
          </Link>
        </div>
      ))}
      <button className="ctrl" style={{ left: 10 }} aria-label="Previous promotion"
        onClick={() => setI(x => (x - 1 + SLIDES.length) % SLIDES.length)}>‹</button>
      <button className="ctrl" style={{ right: 10 }} aria-label="Next promotion"
        onClick={() => setI(x => (x + 1) % SLIDES.length)}>›</button>
      <div className="dots">
        {SLIDES.map((_, idx) => (
          <button key={idx} className={idx === i ? 'on' : ''} aria-label={`Go to promotion ${idx + 1}`}
            onClick={() => setI(idx)} />
        ))}
      </div>
    </div>
  );
}
