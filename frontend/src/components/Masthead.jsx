import React, { useState, useEffect } from 'react';
import { CONTENT } from '../data/content.js';

/**
 * RepoLens — Masthead Navigation Bar
 * Fixed top bar with glassmorphism backdrop, telemetry status, quick links, and mobile hamburger menu.
 */
export function Masthead({ onExploreClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--surface-black)]/85 backdrop-blur-md border-b border-[var(--border-muted)]/30 py-3 shadow-lg'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#hero"
          onClick={(e) => { e.preventDefault(); handleNavClick('#hero'); }}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-none border border-[var(--accent)] bg-[var(--surface-dark)] flex items-center justify-center text-[var(--ivory-50)] font-mono font-bold text-sm shadow-sm group-hover:border-[var(--ivory-50)] transition-colors">
            RL
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg tracking-widest font-bold text-[var(--ivory-50)] leading-none">
              {CONTENT.brand.name}
            </span>
            <span className="font-mono text-[9px] tracking-wider text-[var(--pale-sage-300)] uppercase mt-0.5">
              {CONTENT.brand.badge}
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {CONTENT.nav.map((item, idx) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="font-mono text-xs tracking-wider uppercase text-[var(--pale-sage-300)] hover:text-[var(--ivory-50)] transition-colors flex items-center gap-1.5"
            >
              <span className="text-[10px] text-[var(--accent)]">0{idx + 1} //</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Header Right Action */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--surface-dark)]/60 border border-[var(--border-muted)]/40 text-[10px] font-mono text-[var(--pale-sage-200)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>SYS_ONLINE</span>
          </div>

          <button
            onClick={() => {
              if (onExploreClick) onExploreClick();
              else handleNavClick('#explorer');
            }}
            className="px-4 py-2 font-mono text-xs uppercase font-semibold tracking-wider bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--ivory-50)] border border-[var(--accent)] transition-all shadow hover:shadow-md"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            {CONTENT.hero.cta}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--ivory-50)] hover:text-[var(--accent)] focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface-black)] border-b border-[var(--border-muted)]/40 px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {CONTENT.nav.map((item, idx) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="text-left font-mono text-sm tracking-wider uppercase text-[var(--pale-sage-300)] hover:text-[var(--ivory-50)] py-2 border-b border-[var(--border-muted)]/20"
            >
              <span className="text-xs text-[var(--accent)] mr-2">0{idx + 1} //</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onExploreClick) onExploreClick();
              else handleNavClick('#explorer');
            }}
            className="w-full py-3 mt-2 font-mono text-xs uppercase font-semibold tracking-wider bg-[var(--accent)] text-[var(--ivory-50)] text-center"
          >
            {CONTENT.hero.cta}
          </button>
        </div>
      )}
    </header>
  );
}

export default Masthead;
