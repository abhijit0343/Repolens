import React, { useEffect, useRef } from 'react';
import { CONTENT } from '../data/content.js';
import { TextReveal } from '../lib/textReveal.js';

/**
 * RepoLens — Footer Section
 * Features an ivory top edge border, muted forest-sage technical panel,
 * letter-by-letter navigation reveals, and mini 3D shell glyph.
 */
export function Footer() {
  const navContainerRef = useRef(null);

  useEffect(() => {
    if (!navContainerRef.current) return;
    const links = navContainerRef.current.querySelectorAll('[data-footer-link]');
    const reveals = [];

    links.forEach((link) => {
      const rev = new TextReveal(link, { mode: 'chars', staggerMs: 15 });
      rev.play();
      reveals.push(rev);
    });

    return () => {
      reveals.forEach((r) => r.destroy());
    };
  }, []);

  const handleNavClick = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer
      id="footer"
      className="relative w-full bg-[var(--surface-black)] text-[var(--ivory-50)] pt-20 pb-12 px-6 border-t-2 border-[var(--ivory-50)]/40 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col justify-between">
        {/* Top Grid: Brand, Nav, Specs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-[var(--border-muted)]/30">
          {/* Brand & Mini Shell Glyph */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/* Mini 3D Shell Wireframe Glyph */}
              <div
                className="w-8 h-8 border border-[var(--accent)] flex items-center justify-center font-mono font-bold text-xs bg-[var(--surface-dark)] text-[var(--ivory-50)] shadow-[0_0_10px_var(--accent)]"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                RL
              </div>
              <h3 className="font-display text-2xl font-bold tracking-widest text-[var(--ivory-50)]">
                {CONTENT.brand.name}
              </h3>
            </div>

            <p className="max-w-md font-body text-xs text-[var(--pale-sage-200)] leading-relaxed">
              {CONTENT.brand.tagline}. Autonomous GraphRAG code knowledge graphs, AST call resolution,
              and multi-agent reasoning with file:line citations.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {['LangGraph', 'Gemini 2.5 Flash', 'Tree-Sitter', 'Three.js', 'ChromaDB', 'Louvain'].map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-2 py-0.5 bg-[var(--surface-dark)] text-[var(--pale-sage-300)] border border-[var(--border-muted)]/30 uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Letter-by-Letter Nav Links */}
          <div ref={navContainerRef} className="flex flex-col gap-3">
            <span className="text-[10px] font-mono text-[var(--accent)] tracking-widest uppercase font-semibold">
              NAVIGATION
            </span>
            {CONTENT.nav.map((item, idx) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                data-footer-link
                className="text-left font-mono text-xs text-[var(--pale-sage-200)] hover:text-[var(--ivory-50)] transition-colors py-0.5"
              >
                0{idx + 1} // {item.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Telemetry Architecture Specs */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono text-[var(--accent)] tracking-widest uppercase font-semibold">
              ARCHITECTURE SPECS
            </span>
            <div className="text-[11px] font-mono text-[var(--pale-sage-300)] space-y-1.5">
              <div>GRAPH: 3D SPRING LAYOUT (SEED 42)</div>
              <div>EMBEDDING: MODELS/GEMINI-EMBEDDING-001</div>
              <div>AST: PYTHON 3.11 + ECMASCRIPT / TS</div>
              <div>REASONING: 6-AGENT STATEGRAPH</div>
              <div>SECURITY: INPUT / SECRETS / BUDGETS</div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[var(--pale-sage-300)]">
          <div>
            REPOLENS © {new Date().getFullYear()} // STRICT PALE SAGE & IVORY WEBGL SPEC
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>CORE HEALTHY</span>
            </span>
            <span>LATENCY: &lt;16MS (60 FPS)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
