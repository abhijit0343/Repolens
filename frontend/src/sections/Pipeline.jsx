import React, { useEffect, useRef, useState } from 'react';
import { CONTENT } from '../data/content.js';
import { BracketPanel } from '../components/BracketPanel.jsx';
import { createScrollTrigger } from '../lib/scrollTrigger.js';
import { TextReveal } from '../lib/textReveal.js';

/**
 * RepoLens — Pipeline Section
 * 5-stage timeline. All dark backgrounds and color tokens via inline styles
 * or layout.css classes — no Tailwind arbitrary CSS-variable classes.
 */
export function Pipeline() {
  const { pipeline } = CONTENT;
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const revealsRef = useRef([]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const trigger = createScrollTrigger(sectionRef.current, {
      startOffset: 0.15,
      endOffset: 0.85,
      onUpdate: ({ progress }) => {
        setScrollProgress(progress);
        setActiveStepIndex(Math.min(Math.floor(progress * pipeline.steps.length), pipeline.steps.length - 1));
      },
    });
    const headings = sectionRef.current.querySelectorAll('[data-pipeline-reveal]');
    headings.forEach((el) => {
      const rev = new TextReveal(el, { mode: 'words', staggerMs: 30 });
      revealsRef.current.push(rev);
    });
    return () => {
      trigger.destroy();
      revealsRef.current.forEach((r) => r.destroy());
      revealsRef.current = [];
    };
  }, [pipeline.steps.length]);

  useEffect(() => {
    revealsRef.current.forEach((rev, idx) => { if (idx <= activeStepIndex) rev.play(); });
  }, [activeStepIndex]);

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      data-stack-card
      className="rl-pipeline"
    >
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>

        {/* Section Header */}
        <div style={{ marginBottom: 80, textAlign: 'center', maxWidth: 580, margin: '0 auto 80px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px',
            background: 'var(--surface-dark)', border: '1px solid rgba(195,209,181,0.25)',
            fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--accent)', fontWeight: 600, marginBottom: 12
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            {pipeline.eyebrow}
          </div>
          <h2 className="rl-section-h2" style={{ textAlign: 'center' }}>{pipeline.title}</h2>
          <p className="rl-section-p" style={{ margin: '0 auto', textAlign: 'center' }}>{pipeline.description}</p>
        </div>

        {/* Progress rail */}
        <div className="rl-pipeline__progress">
          <div className="rl-pipeline__progress-fill" style={{ width: `${(scrollProgress * 100).toFixed(1)}%` }} />
        </div>

        {/* Timeline steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56, position: 'relative' }}>
          {/* Vertical rail line */}
          <div style={{
            position: 'absolute', left: 24, top: 0, bottom: 0, width: 1,
            background: 'rgba(195,209,181,0.18)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent)',
              height: `${(scrollProgress * 100).toFixed(1)}%`,
              transition: 'height 0.15s ease-out',
            }} />
          </div>

          {pipeline.steps.map((step, idx) => {
            const isActive = idx <= activeStepIndex;
            const markerRot = isActive ? 45 : 0;
            return (
              <div key={step.id} style={{ position: 'relative', paddingLeft: 56 }}>
                {/* Diamond marker */}
                <div style={{
                  position: 'absolute', left: 24, top: 24,
                  transform: `translate(-50%, 0) rotate(${markerRot}deg)`,
                  width: 24, height: 24, border: `2px solid ${isActive ? 'var(--accent)' : 'rgba(195,209,181,0.3)'}`,
                  background: isActive ? 'var(--surface-black)' : 'var(--surface-dark)',
                  boxShadow: isActive ? '0 0 12px var(--accent)' : 'none',
                  transition: 'all 0.5s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 8, height: 8, background: isActive ? 'var(--ivory-50)' : 'transparent', transition: 'background 0.3s' }} />
                </div>

                {/* Step plate */}
                <BracketPanel
                  tag={`PHASE_${step.id}`}
                  title={step.name}
                  badge={step.subtitle}
                  variant="dark"
                  style={{ opacity: isActive ? 1 : 0.65, transition: 'opacity 0.5s, border-color 0.5s', borderColor: isActive ? 'rgba(107,138,110,0.6)' : 'rgba(195,209,181,0.2)' }}
                >
                  {/* Ghost watermark */}
                  <span style={{
                    position: 'absolute', top: -16, right: 16,
                    fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 800,
                    color: 'rgba(248,245,234,0.04)', pointerEvents: 'none', userSelect: 'none',
                  }}>{step.id}</span>

                  <p data-pipeline-reveal style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--pale-sage-200)', lineHeight: 1.65, marginBottom: 16 }}>
                    {step.description}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: '1px solid rgba(195,209,181,0.15)' }}>
                    {step.tags.map((tag) => (
                      <span key={tag} className="rl-tag">{tag}</span>
                    ))}
                  </div>
                </BracketPanel>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Pipeline;
