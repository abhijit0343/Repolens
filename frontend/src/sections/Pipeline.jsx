import React, { useEffect, useRef, useState } from 'react';
import { CONTENT } from '../data/content.js';
import { BracketPanel } from '../components/BracketPanel.jsx';
import { createScrollTrigger } from '../lib/scrollTrigger.js';
import { TextReveal } from '../lib/textReveal.js';

/**
 * RepoLens — Pipeline Section
 * 5 operational stages (Index, Graph, Plan, Search, Verify) connected by a dynamic progress rail,
 * turning diamond markers, stepped-corner plates, parallax watermarks, and letter reveals.
 */
export function Pipeline() {
  const { pipeline } = CONTENT;
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const revealsRef = useRef([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Initialize ScrollTrigger for the progress rail
    const trigger = createScrollTrigger(sectionRef.current, {
      startOffset: 0.15,
      endOffset: 0.85,
      onUpdate: ({ progress }) => {
        setScrollProgress(progress);
        const stepIdx = Math.min(
          Math.floor(progress * pipeline.steps.length),
          pipeline.steps.length - 1
        );
        setActiveStepIndex(stepIdx);
      },
    });

    // Initialize TextReveals on step titles
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

  // Trigger reveals as steps become active
  useEffect(() => {
    revealsRef.current.forEach((rev, idx) => {
      if (idx <= activeStepIndex) {
        rev.play();
      }
    });
  }, [activeStepIndex]);

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      data-stack-card
      className="relative min-h-screen w-full py-28 px-6 bg-[var(--surface-black)] text-[var(--ivory-50)] overflow-hidden border-t border-[var(--border-muted)]/20"
    >
      <div className="max-w-5xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="mb-20 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--surface-dark)]/80 border border-[var(--border-muted)]/30 text-[10px] font-mono text-[var(--accent)] uppercase font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            {pipeline.eyebrow}
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ivory-50)] uppercase mb-4">
            {pipeline.title}
          </h2>

          <p className="font-body text-base text-[var(--pale-sage-200)] leading-relaxed">
            {pipeline.description}
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical Glowing Progress Rail Track */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-[var(--surface-dark)] border-r border-[var(--border-muted)]/30">
            <div
              className="w-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] transition-all duration-150 ease-out"
              style={{ height: `${(scrollProgress * 100).toFixed(1)}%` }}
            />
          </div>

          {/* 5 Operational Steps */}
          <div className="flex flex-col gap-14 relative z-10">
            {pipeline.steps.map((step, idx) => {
              const isActive = idx <= activeStepIndex;
              const isEven = idx % 2 === 0;
              // Turning marker angle: rotates from 0 to 45 deg as row is reached
              const markerRotation = isActive ? 45 : 0;

              return (
                <div
                  key={step.id}
                  className={`relative flex items-center gap-8 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-row pl-14 md:pl-0`}
                >
                  {/* Turning Diamond Marker along Central Rail */}
                  <div
                    className="absolute left-6 md:left-1/2 top-8 -translate-x-1/2 flex items-center justify-center z-20 pointer-events-none"
                  >
                    <div
                      className={`w-6 h-6 border-2 transition-all duration-500 flex items-center justify-center ${
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--surface-black)] shadow-[0_0_12px_var(--accent)]'
                          : 'border-[var(--border-muted)]/50 bg-[var(--surface-dark)]'
                      }`}
                      style={{ transform: `rotate(${markerRotation}deg)` }}
                    >
                      <div
                        className={`w-2 h-2 transition-colors duration-300 ${
                          isActive ? 'bg-[var(--ivory-50)]' : 'bg-transparent'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step Plate */}
                  <div className="w-full md:w-[calc(50%-40px)]">
                    <BracketPanel
                      tag={`PHASE_${step.id}`}
                      title={step.name}
                      badge={step.subtitle}
                      variant="dark"
                      className={`transition-all duration-500 ${
                        isActive
                          ? 'border-[var(--accent)]/60 shadow-xl'
                          : 'border-[var(--border-muted)]/30 opacity-70'
                      }`}
                    >
                      {/* Parallax Ghost Watermark Number */}
                      <span className="absolute -top-4 right-4 font-display text-5xl font-extrabold text-[var(--surface-muted)]/5 pointer-events-none select-none">
                        {step.id}
                      </span>

                      <p
                        data-pipeline-reveal
                        className="font-body text-sm text-[var(--pale-sage-200)] leading-relaxed mb-4"
                      >
                        {step.description}
                      </p>

                      {/* Architecture Tags */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-muted)]/20">
                        {step.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono px-2 py-0.5 bg-[var(--surface-black)] text-[var(--pale-sage-300)] border border-[var(--border-muted)]/30 tracking-wider uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </BracketPanel>
                  </div>

                  {/* Counter Spacer on the other side for desktop symmetry */}
                  <div className="hidden md:block w-[calc(50%-40px)]" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pipeline;
