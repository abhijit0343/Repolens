import React, { useEffect, useRef } from 'react';
import { CONTENT } from '../data/content.js';
import { TextReveal } from '../lib/textReveal.js';

/**
 * RepoLens — Footer
 * Uses .rl-footer CSS classes + inline styles — no Tailwind arbitrary values.
 */
export function Footer() {
  const navRef = useRef(null);

  useEffect(() => {
    if (!navRef.current) return;
    const links = navRef.current.querySelectorAll('[data-footer-link]');
    const reveals = [];
    links.forEach((el) => { const r = new TextReveal(el, { mode: 'chars', staggerMs: 15 }); r.play(); reveals.push(r); });
    return () => reveals.forEach((r) => r.destroy());
  }, []);

  const handleNav = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const monoSm = { fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em' };
  const label = { ...monoSm, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: 12 };

  return (
    <footer id="footer" className="rl-footer">
      <div className="rl-footer__inner">

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid rgba(195,209,181,0.18)' }}
          className="footer-grid">
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
                background: 'var(--surface-dark)', color: 'var(--ivory-50)',
                boxShadow: '0 0 10px var(--accent)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}>RL</div>
              <span className="rl-footer__logo">{CONTENT.brand.name}</span>
            </div>
            <p style={{ ...monoSm, fontSize: 12, color: 'var(--pale-sage-200)', lineHeight: 1.65, maxWidth: 400 }}>
              {CONTENT.brand.tagline}. Autonomous GraphRAG code knowledge graphs, AST call resolution,
              and multi-agent reasoning with file:line citations.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['LangGraph', 'Gemini 2.5 Flash', 'Tree-Sitter', 'Three.js', 'ChromaDB', 'Louvain'].map((t) => (
                <span key={t} className="rl-tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div ref={navRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={label}>Navigation</span>
            {CONTENT.nav.map((item, idx) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                data-footer-link
                style={{ ...monoSm, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pale-sage-200)', textAlign: 'left', padding: '2px 0', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--ivory-50)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--pale-sage-200)'}
              >
                0{idx + 1} // {item.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Arch specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={label}>Architecture Specs</span>
            {[
              'GRAPH: 3D SPRING LAYOUT (SEED 42)',
              'EMBEDDING: GEMINI-EMBEDDING-001',
              'AST: PYTHON 3.11 + ECMASCRIPT / TS',
              'REASONING: 6-AGENT STATEGRAPH',
              'SECURITY: INPUT / SECRETS / BUDGETS',
            ].map((s) => (
              <div key={s} style={{ ...monoSm, fontSize: 11, color: 'var(--pale-sage-300)', lineHeight: 1.7 }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className="rl-footer__copy">
            REPOLENS © {new Date().getFullYear()} // STRICT PALE SAGE &amp; IVORY WEBGL SPEC
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...monoSm }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              CORE HEALTHY
            </span>
            <span style={monoSm}>LATENCY: &lt;16MS (60 FPS)</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 2fr 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
