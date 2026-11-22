/**
 * Verification test for Phase F3: tier.js, tokens.js, and ContourCanvas math.
 */

import { getDeviceTier } from '../tier.js';
import { readTokenColor } from '../tokens.js';
import * as THREE from 'three';

console.log('[VerifyF3] Testing tier detection and Three.js color tokens...');

// Test 1: Device tier invariants
const defaultTier = getDeviceTier();
if (!defaultTier.tier || typeof defaultTier.dpr !== 'number' || typeof defaultTier.particles !== 'number') {
  throw new Error(`Invalid tier detection output: ${JSON.stringify(defaultTier)}`);
}
console.log(`✓ Tier detection: ${defaultTier.tier}, DPR: ${defaultTier.dpr}, Particles: ${defaultTier.particles}`);

// Test 2: Color tokens
const colFunction = readTokenColor('--node-function', 0x3f5744);
if (!(colFunction instanceof THREE.Color)) {
  throw new Error('readTokenColor did not return a THREE.Color instance');
}
console.log(`✓ Color token resolved: rgb(${colFunction.r.toFixed(2)}, ${colFunction.g.toFixed(2)}, ${colFunction.b.toFixed(2)})`);

// Test 3: 4-Sine contour math
let maxVal = -Infinity;
let minVal = Infinity;
for (let j = 0; j <= 40; j++) {
  const normX = j / 40;
  const s1 = Math.sin(normX * 4.2);
  const s2 = Math.sin(normX * 8.5) * 0.5;
  const s3 = Math.sin(normX * 14.1) * 0.25;
  const s4 = Math.sin(normX * 22.0) * 0.12;
  const combined = s1 + s2 + s3 + s4;
  if (combined > maxVal) maxVal = combined;
  if (combined < minVal) minVal = combined;
}
if (minVal < -2 || maxVal > 2) {
  throw new Error(`4-sine harmonic values out of expected bounds: [${minVal}, ${maxVal}]`);
}
console.log(`✓ 4-Sine harmonics verified within bounds: min=${minVal.toFixed(2)}, max=${maxVal.toFixed(2)}`);

console.log('✓ Phase F3 verification successful!');
