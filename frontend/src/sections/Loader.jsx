import React, { useState, useEffect } from 'react';
import { CONTENT } from '../data/content.js';

/**
 * RepoLens — Loader Veil
 * 3-beat lifecycle:
 * Beat 1: Entrance, progress bar creeps smoothly up to 0.7 (70%).
 * Beat 2: Waits for 3D scenes / assets ready signal (or timeout), rushes to 1.0 (100%).
 * Beat 3: Veil dissolves smoothly; unmounts completely when opacity <= 0.004.
 */
export function Loader({ ready = false, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [unmounted, setUnmounted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('INITIALIZING AST PARSER...');

  useEffect(() => {
    let animFrame;
    let currentProgress = 0;

    const messages = [
      'INITIALIZING AST PARSER...',
      'LOADING GRAPHRAG LOUVAIN CLUSTERS...',
      'CALCULATING 3D SPRING LAYOUT...',
      'CALIBRATING THREE.JS SHADERS...',
      'SYSTEM READY.',
    ];

    const timer = setInterval(() => {
      // Beat 1: Creep up to 0.70
      if (!ready && currentProgress < 0.70) {
        currentProgress += (0.70 - currentProgress) * 0.08 + 0.005;
        if (currentProgress > 0.70) currentProgress = 0.70;
      } else if (ready) {
        // Beat 2: Rush to 1.0
        currentProgress += (1.0 - currentProgress) * 0.18 + 0.02;
        if (currentProgress >= 0.999) {
          currentProgress = 1.0;
        }
      }

      setProgress(currentProgress);

      const msgIndex = Math.min(Math.floor(currentProgress * (messages.length - 1)), messages.length - 1);
      setStatusMessage(messages[msgIndex]);

      if (currentProgress >= 1.0) {
        clearInterval(timer);
        // Beat 3: Dissolve veil
        setTimeout(() => {
          let currentOpacity = 1.0;
          const dissolveInterval = setInterval(() => {
            currentOpacity *= 0.85;
            setOpacity(currentOpacity);
            if (currentOpacity <= 0.004) {
              clearInterval(dissolveInterval);
              setUnmounted(true);
              if (onComplete) onComplete();
            }
          }, 30);
        }, 150);
      }
    }, 40);

    return () => {
      clearInterval(timer);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [ready, onComplete]);

  if (unmounted) return null;

  const percentDisplay = Math.floor(progress * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Application loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--surface-black)] text-[var(--ivory-50)] pointer-events-none select-none transition-opacity duration-150"
      style={{ opacity: opacity }}
    >
      <div className="w-full max-w-md px-8 flex flex-col items-center">
        {/* Top Logo / Tag */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-3 h-3 bg-[var(--accent)] animate-spin" />
          <span className="font-display text-2xl tracking-widest font-bold text-[var(--ivory-50)]">
            {CONTENT.brand.name}
          </span>
          <span className="font-mono text-[10px] tracking-wider text-[var(--pale-sage-300)] uppercase">
            [BOOT]
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-1.5 bg-[var(--surface-dark)] border border-[var(--border-muted)]/40 overflow-hidden relative mb-4">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-75 ease-out shadow-[0_0_12px_var(--accent)]"
            style={{ width: `${percentDisplay}%` }}
          />
        </div>

        {/* Status Line */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-[var(--pale-sage-300)]">
          <span className="truncate mr-4 text-[11px] tracking-wider">{statusMessage}</span>
          <span className="font-semibold text-[var(--accent)]">{percentDisplay}%</span>
        </div>
      </div>
    </div>
  );
}

export default Loader;
