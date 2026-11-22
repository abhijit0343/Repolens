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
      className="rl-loader"
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.15s' }}
    >
      <div style={{ width: '100%', maxWidth: 400, padding: '0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ width: 12, height: 12, background: 'var(--accent)', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.15em', fontWeight: 700, color: 'var(--ivory-50)', textTransform: 'uppercase' }}>
            {CONTENT.brand.name}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.16em', color: 'var(--pale-sage-300)', textTransform: 'uppercase' }}>[BOOT]</span>
        </div>
        {/* Progress bar */}
        <div style={{ width: '100%', height: 3, background: 'var(--surface-dark)', border: '1px solid rgba(195,209,181,0.2)', overflow: 'hidden', position: 'relative', marginBottom: 16 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)', width: `${percentDisplay}%`, transition: 'width 0.075s ease-out' }} />
        </div>
        {/* Status */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 11, color: 'var(--pale-sage-300)' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 16, letterSpacing: '0.1em' }}>{statusMessage}</span>
          <span style={{ fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>{percentDisplay}%</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Loader;
