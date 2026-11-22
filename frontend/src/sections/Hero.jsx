import React, { useEffect, useRef } from 'react';
import { CONTENT } from '../data/content.js';
import { BracketPanel } from '../components/BracketPanel.jsx';
import { HeroScene } from '../three/HeroScene.js';

/**
 * RepoLens — Hero Section
 * Hosts title typography, technical telemetry bracket panels, CTA button, and 3D canvas backdrop.
 */
export function Hero({ onExploreClick }) {
  const { hero } = CONTENT;
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    let scene = null;
    if (canvasContainerRef.current) {
      scene = new HeroScene(canvasContainerRef.current);
    }
    return () => {
      if (scene) scene.destroy();
    };
  }, []);

  const handleCta = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      const el = document.querySelector('#explorer');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      data-stack-card
      className="relative min-h-screen w-full flex flex-col justify-between pt-28 pb-16 px-6 overflow-hidden bg-gradient-to-b from-[var(--surface-black)] via-[var(--surface-dark)] to-[var(--surface-black)] text-[var(--ivory-50)]"
    >
      {/* 3D WebGL Canvas Layer */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 pointer-events-auto z-0 opacity-80"
        aria-hidden="true"
      />

      {/* Hero Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2 h-2 bg-[var(--accent)] animate-pulse" />
          <span className="font-mono text-xs tracking-widest uppercase text-[var(--pale-sage-300)] font-semibold">
            {hero.subhead}
          </span>
        </div>

        {/* Main Display Headline */}
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-[var(--ivory-50)] uppercase leading-[0.9] mb-6">
          {hero.headline}
        </h1>

        {/* Narrative Description */}
        <p className="max-w-2xl font-body text-base sm:text-lg text-[var(--pale-sage-200)] leading-relaxed mb-8 opacity-90">
          {hero.description}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 mb-14">
          <button
            onClick={handleCta}
            className="px-8 py-3.5 font-mono text-xs uppercase font-bold tracking-wider bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--ivory-50)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--accent)]"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
            }}
          >
            {hero.cta}
          </button>

          <a
            href="#graph-so-far"
            className="px-6 py-3.5 font-mono text-xs uppercase font-medium tracking-wider text-[var(--pale-sage-300)] hover:text-[var(--ivory-50)] border border-[var(--border-muted)]/40 hover:border-[var(--pale-sage-300)] transition-colors"
          >
            EXPLORE TOPOLOGY ↓
          </a>
        </div>

        {/* Technical HUD Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BracketPanel
            tag="AST_01"
            title="Files Indexed"
            badge="CLEAN"
            variant="glass"
          >
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-display text-3xl font-bold text-[var(--ivory-50)]">
                {hero.statsDefaults.files}
              </span>
              <span className="font-mono text-[10px] text-[var(--pale-sage-300)]">MODULE NODES</span>
            </div>
          </BracketPanel>

          <BracketPanel
            tag="AST_02"
            title="Functions & Classes"
            badge="PARSED"
            variant="glass"
          >
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-display text-3xl font-bold text-[var(--ivory-50)]">
                {hero.statsDefaults.functions}
              </span>
              <span className="font-mono text-[10px] text-[var(--pale-sage-300)]">CALL HUBS</span>
            </div>
          </BracketPanel>

          <BracketPanel
            tag="RAG_01"
            title="Dependency Edges"
            badge="CONNECTED"
            variant="glass"
          >
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-display text-3xl font-bold text-[var(--ivory-50)]">
                {hero.statsDefaults.edges}
              </span>
              <span className="font-mono text-[10px] text-[var(--pale-sage-300)]">DIRECTED CALLS</span>
            </div>
          </BracketPanel>

          <BracketPanel
            tag="RAG_02"
            title="Louvain Communities"
            badge="CLUSTER"
            variant="glass"
          >
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-display text-3xl font-bold text-[var(--ivory-50)]">
                {hero.statsDefaults.communities}
              </span>
              <span className="font-mono text-[10px] text-[var(--pale-sage-300)]">MODULARITY</span>
            </div>
          </BracketPanel>
        </div>
      </div>

      {/* Bottom telemetry footer */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-8 flex items-center justify-between border-t border-[var(--border-muted)]/20 text-[10px] font-mono text-[var(--pale-sage-300)]">
        <span>COORDINATES: LAT 42.0 // SEED 42</span>
        <span className="flex items-center gap-2">
          <span>SCROLL TO PROCEED</span>
          <span className="animate-bounce">↓</span>
        </span>
      </div>
    </section>
  );
}

export default Hero;
