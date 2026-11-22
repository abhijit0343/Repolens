/**
 * RepoLens — CSS Token Color Reader for Three.js and Canvas
 * Reads CSS custom properties dynamically from :root to maintain strict color palette.
 */

import * as THREE from 'three';

const colorCache = new Map();

export function readToken(property, fallback = '#f8f5ea') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const prop = property.startsWith('--') ? property : `--${property}`;
  const val = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return val || fallback;
}

export function readTokenColor(property, fallback = 0xf8f5ea) {
  if (typeof window === 'undefined') return new THREE.Color(fallback);

  const raw = readToken(property);
  if (!raw) return new THREE.Color(fallback);

  if (colorCache.has(raw)) {
    return colorCache.get(raw).clone();
  }

  try {
    const col = new THREE.Color(raw);
    colorCache.set(raw, col);
    return col.clone();
  } catch (err) {
    return new THREE.Color(fallback);
  }
}

export default {
  readToken,
  readTokenColor
};
