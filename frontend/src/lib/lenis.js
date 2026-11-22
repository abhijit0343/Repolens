/**
 * RepoLens — Lenis Smooth Scrolling Integration
 * Wires Lenis instance to the shared Ticker RAF loop.
 * Automatically disabled if user prefers reduced motion.
 */

import Lenis from 'lenis';
import ticker from './ticker.js';

let lenisInstance = null;
let unsubscribeTicker = null;

export function initLenis(options = {}) {
  if (typeof window === 'undefined') return null;

  // Check user preference for reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    console.info('[Lenis] Reduced motion preferred; smooth scrolling disabled.');
    return null;
  }

  if (lenisInstance) {
    return lenisInstance;
  }

  lenisInstance = new Lenis({
    duration: options.duration ?? 1.2,
    easing: options.easing ?? (t => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    infinite: false,
    ...options
  });

  // Wire Lenis RAF to the shared Ticker
  unsubscribeTicker = ticker.add((time) => {
    if (lenisInstance) {
      lenisInstance.raf(time * 1000);
    }
  });

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}

export function destroyLenis() {
  if (unsubscribeTicker) {
    unsubscribeTicker();
    unsubscribeTicker = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}

export default {
  initLenis,
  getLenis,
  destroyLenis
};
