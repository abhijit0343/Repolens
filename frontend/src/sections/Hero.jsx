import React, { useEffect, useRef } from 'react';
import { CONTENT } from '../data/content.js';
import { BracketPanel } from '../components/BracketPanel.jsx';
import { HeroScene } from '../three/HeroScene.js';

/**
 * RepoLens — Hero Section
 * Uses .rl-hero CSS classes from layout.css for all dark-background
 * structural styles. No Tailwind arbitrary CSS-variable classes.
 */
export function Hero({ onExploreClick }) {
  const { hero } = CONTENT;
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    let scene = null;
    if (canvasContainerRef.current) {
      try {
        scene = new HeroScene(canvasContainerRef.current);
      } catch (e) {
        console.warn('HeroScene init failed:', e);
      }
    }
    return () => { if (scene) scene.destroy(); };
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
    <section id="hero" data-stack-card className="rl-hero">
      {/* 3D WebGL Canvas — z-index 0 */}
      <div
        ref={canvasContainerRef}
        className="rl-hero__canvas"
        aria-hidden="true"
      />

      {/* Content layer — z-index 10 */}
      <div className="rl-hero__content">
        {/* Eyebrow */}
        <div className="rl-hero__eyebrow">
          <span className="rl-hero__eyebrow-dot" />
          <span className="rl-hero__eyebrow-text">{hero.subhead}</span>
        </div>

        {/* Headline */}
        <h1 className="rl-hero__h1">{hero.headline}</h1>

        {/* Description */}
        <p className="rl-hero__desc">{hero.description}</p>

        {/* CTAs */}
        <div className="rl-hero__ctas">
          <button onClick={handleCta} className="rl-hero__cta-primary">
            {hero.cta}
          </button>
          <a href="#graph-so-far" className="rl-hero__cta-secondary">
            EXPLORE TOPOLOGY ↓
          </a>
        </div>

        {/* Telemetry Bracket Panels */}
        <div className="rl-hero__panels">
          <BracketPanel tag="AST_01" title="Files Indexed" badge="CLEAN" variant="glass">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700, color: 'var(--ivory-50)' }}>
                {hero.statsDefaults.files}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--pale-sage-300)' }}>MODULE NODES</span>
            </div>
          </BracketPanel>

          <BracketPanel tag="AST_02" title="Functions &amp; Classes" badge="PARSED" variant="glass">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700, color: 'var(--ivory-50)' }}>
                {hero.statsDefaults.functions}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--pale-sage-300)' }}>CALL HUBS</span>
            </div>
          </BracketPanel>

          <BracketPanel tag="RAG_01" title="Dependency Edges" badge="CONNECTED" variant="glass">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700, color: 'var(--ivory-50)' }}>
                {hero.statsDefaults.edges}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--pale-sage-300)' }}>DIRECTED CALLS</span>
            </div>
          </BracketPanel>

          <BracketPanel tag="RAG_02" title="Louvain Communities" badge="CLUSTER" variant="glass">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700, color: 'var(--ivory-50)' }}>
                {hero.statsDefaults.communities}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--pale-sage-300)' }}>MODULARITY</span>
            </div>
          </BracketPanel>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="rl-hero__scroll-indicator">
        <span className="rl-hero__scroll-text">
          COORDINATES: LAT 42.0 // SEED 42 — SCROLL TO PROCEED ↓
        </span>
      </div>
    </section>
  );
}

export default Hero;
