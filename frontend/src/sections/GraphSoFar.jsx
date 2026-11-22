import React, { useEffect, useRef } from 'react';
import { CONTENT } from '../data/content.js';
import { StatsPlate } from '../components/StatsPlate.jsx';
import { HalftoneMap } from '../three/HalftoneMap.js';
import { TraversalTrace } from '../three/TraversalTrace.js';
import { ChequerDissolve } from '../three/ChequerDissolve.js';
import ticker from '../lib/ticker.js';

/**
 * RepoLens — GraphSoFar Section
 * Uses .rl-graphsofar CSS classes from layout.css. No Tailwind
 * arbitrary CSS-variable classes.
 */
export function GraphSoFar() {
  const { graphSoFar } = CONTENT;
  const sectionRef = useRef(null);
  const halftoneCanvasRef = useRef(null);
  const traceCanvasRef = useRef(null);
  const seamCanvasRef = useRef(null);

  useEffect(() => {
    let halftone = null, trace = null, seam = null;

    try { halftone = new HalftoneMap(halftoneCanvasRef.current); } catch (e) { console.warn(e); }
    try { trace = new TraversalTrace(traceCanvasRef.current); } catch (e) { console.warn(e); }
    try { seam = new ChequerDissolve(seamCanvasRef.current); } catch (e) { console.warn(e); }

    const handleResize = () => { halftone?.resize(); trace?.resize(); seam?.resize(); };
    const handleScroll = () => {
      if (!sectionRef.current || !seam) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      seam.setProgress(Math.max(0, Math.min(1, 1 - rect.top / (vh * 0.7))));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const unsub = ticker.add((time) => {
      halftone?.render(time);
      trace?.update(time);
      seam?.render();
    });

    return () => {
      unsub();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      halftone?.destroy(); trace?.destroy(); seam?.destroy();
    };
  }, []);

  return (
    <section id="graph-so-far" ref={sectionRef} data-stack-card className="rl-graphsofar">
      {/* Chequered dissolve seam at top */}
      <canvas ref={seamCanvasRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 112, width: '100%', pointerEvents: 'none', zIndex: 20 }} />

      {/* Halftone lattice backdrop */}
      <canvas ref={halftoneCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.4 }} />

      {/* Traversal trace overlay */}
      <canvas ref={traceCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 20, maxWidth: 1280, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Header */}
        <div style={{ maxWidth: 640 }}>
          <div className="rl-eyebrow">
            <span className="rl-eyebrow__dot" />
            <span className="rl-eyebrow__text">{graphSoFar.eyebrow}</span>
          </div>
          <h2 className="rl-section-h2">{graphSoFar.title}</h2>
          <p className="rl-section-p">{graphSoFar.subtitle}</p>
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: 64, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
          <StatsPlate />
          <div className="rl-graphsofar__legend">
            <div style={{ fontWeight: 600, color: 'var(--ivory-50)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>ACTIVE TRACE PROTOCOL</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.6 }}>
              Real-time traversal traces 6 high-degree call hubs. Braking reduces velocity by 75% at corners before accelerating to line speed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GraphSoFar;
