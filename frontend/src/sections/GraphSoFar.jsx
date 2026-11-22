import React, { useEffect, useRef } from 'react';
import { CONTENT } from '../data/content.js';
import { StatsPlate } from '../components/StatsPlate.jsx';
import { HalftoneMap } from '../three/HalftoneMap.js';
import { TraversalTrace } from '../three/TraversalTrace.js';
import { ChequerDissolve } from '../three/ChequerDissolve.js';
import ticker from '../lib/ticker.js';

/**
 * RepoLens — GraphSoFar Section
 * Combines ChequerDissolve transition seam, HalftoneMap density lattice,
 * TraversalTrace 6.0s loop, and StatsPlate telemetry HUD.
 */
export function GraphSoFar() {
  const { graphSoFar } = CONTENT;
  const sectionRef = useRef(null);
  const halftoneCanvasRef = useRef(null);
  const traceCanvasRef = useRef(null);
  const seamCanvasRef = useRef(null);

  useEffect(() => {
    let halftone = null;
    let trace = null;
    let seam = null;

    if (halftoneCanvasRef.current) {
      halftone = new HalftoneMap(halftoneCanvasRef.current);
    }
    if (traceCanvasRef.current) {
      trace = new TraversalTrace(traceCanvasRef.current);
    }
    if (seamCanvasRef.current) {
      seam = new ChequerDissolve(seamCanvasRef.current);
    }

    const handleResize = () => {
      halftone?.resize();
      trace?.resize();
      seam?.resize();
    };

    const handleScroll = () => {
      if (!sectionRef.current || !seam) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Progress 0..1 as section top reaches viewport
      const seamProgress = Math.max(0, Math.min(1, 1 - (rect.top / (vh * 0.7))));
      seam.setProgress(seamProgress);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Hook into shared RAF ticker
    const unsub = ticker.add((time) => {
      halftone?.render(time);
      trace?.update(time);
      seam?.render();
    });

    return () => {
      unsub();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      halftone?.destroy();
      trace?.destroy();
      seam?.destroy();
    };
  }, []);

  return (
    <section
      id="graph-so-far"
      ref={sectionRef}
      data-stack-card
      className="relative min-h-screen w-full flex flex-col justify-between py-24 px-6 bg-[var(--surface-black)] text-[var(--ivory-50)] overflow-hidden border-t border-[var(--border-muted)]/20"
    >
      {/* Top Chequered Dissolve Seam */}
      <canvas
        ref={seamCanvasRef}
        className="absolute top-0 left-0 right-0 h-28 w-full pointer-events-none z-20"
      />

      {/* Layer 1: Halftone Density Lattice */}
      <canvas
        ref={halftoneCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40"
      />

      {/* Layer 2: Traversal Trace with Glowing Head & Reticle */}
      <canvas
        ref={traceCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Section Content */}
      <div className="relative z-20 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between">
        {/* Header Block */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-[var(--accent)]" />
            <span className="text-xs font-mono tracking-widest text-[var(--accent)] uppercase font-semibold">
              {graphSoFar.eyebrow}
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ivory-50)] uppercase mb-4 leading-tight">
            {graphSoFar.title}
          </h2>

          <p className="font-body text-base sm:text-lg text-[var(--pale-sage-200)] leading-relaxed">
            {graphSoFar.subtitle}
          </p>
        </div>

        {/* Bottom Bar: Telemetry Stats Plate & Traversal Legend */}
        <div className="mt-16 flex flex-col lg:flex-row items-end justify-between gap-8">
          <StatsPlate />

          <div className="p-4 bg-[var(--surface-dark)]/70 backdrop-blur-md border border-[var(--border-muted)]/40 max-w-sm w-full text-xs font-mono text-[var(--pale-sage-300)]">
            <div className="font-semibold text-[var(--ivory-50)] mb-2 flex items-center justify-between">
              <span>ACTIVE TRACE PROTOCOL</span>
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            </div>
            <p className="text-[11px] leading-relaxed">
              Real-time traversal traces 6 high-degree call hubs. Braking reduces velocity by 75% at corners before accelerating to line speed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GraphSoFar;
