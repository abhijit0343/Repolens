import React, { useState, useEffect } from 'react';
import { CONTENT } from '../data/content.js';

/**
 * RepoLens — Masthead / fixed navigation
 * Uses .rl-masthead CSS classes from layout.css — zero Tailwind arbitrary
 * CSS-variable classes. Scrolled state adds blur/opacity via JS class toggle.
 */
export function Masthead({ onExploreClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`rl-masthead${scrolled ? ' scrolled' : ''}`}>
      <div className="rl-masthead__inner">
        {/* Logo */}
        <div className="rl-masthead__logo">
          <span className="rl-masthead__logo-dot" />
          RL
        </div>

        {/* Status pill */}
        <div className="rl-masthead__status">
          <span className="rl-masthead__status-dot" />
          SYS_ONLINE
        </div>

        {/* Desktop nav */}
        <nav className="rl-masthead__nav" aria-label="Main navigation">
          {CONTENT.nav.map((item, idx) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="rl-masthead__nav-link"
            >
              <span className="rl-masthead__nav-num">0{idx + 1} //</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <button
          className="rl-masthead__cta"
          onClick={() => {
            if (onExploreClick) onExploreClick();
            else handleNav('#explorer');
          }}
        >
          INDEX REPOSITORY
        </button>

        {/* Mobile hamburger */}
        <button
          className="rl-masthead__hamburger"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="rl-masthead__mobile-menu">
          {CONTENT.nav.map((item, idx) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="rl-masthead__mobile-link"
            >
              <span className="rl-masthead__nav-num">0{idx + 1} //</span>
              {item.label}
            </button>
          ))}
          <button
            className="rl-masthead__mobile-cta"
            onClick={() => {
              setMobileOpen(false);
              if (onExploreClick) onExploreClick();
              else handleNav('#explorer');
            }}
          >
            {CONTENT.hero.cta}
          </button>
        </div>
      )}
    </header>
  );
}

export default Masthead;
