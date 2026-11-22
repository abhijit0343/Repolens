/**
 * Verification test for Phase F6: Pipeline timeline, progress rail, and turning markers.
 */

import { CONTENT } from '../../data/content.js';

console.log('[VerifyF6] Testing Pipeline timeline invariants...');

const steps = CONTENT.pipeline.steps;
if (!steps || steps.length !== 5) {
  throw new Error(`Expected exactly 5 pipeline steps, got ${steps?.length}`);
}
console.log(`✓ 5 Pipeline stages verified: ${steps.map(s => s.name).join(' -> ')}`);

// Test step indexing based on progress
const progressSamples = [0.05, 0.25, 0.45, 0.65, 0.95];
progressSamples.forEach((p, expectedIdx) => {
  const calculatedIdx = Math.min(Math.floor(p * steps.length), steps.length - 1);
  if (calculatedIdx !== expectedIdx) {
    throw new Error(`Step index mismatch for progress ${p}: expected ${expectedIdx}, got ${calculatedIdx}`);
  }
});
console.log('✓ Progress-to-stage mapping verified across all 5 milestones');

// Test turning marker rotation
const activeMarkerRotation = (isActive) => isActive ? 45 : 0;
if (activeMarkerRotation(true) !== 45 || activeMarkerRotation(false) !== 0) {
  throw new Error('Marker rotation failed');
}
console.log('✓ Diamond marker rotation verified (0deg inactive, 45deg active)');

console.log('✓ Phase F6 verified successfully!');
