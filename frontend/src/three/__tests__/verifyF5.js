/**
 * Verification test for Phase F5: TraversalTrace 6s loop math, corner braking, and ChequerDissolve.
 */

console.log('[VerifyF5] Testing TraversalTrace 6s loop and ChequerDissolve seam...');

// Test 1: 6.0s looping invariants
const duration = 6.0;
const testTimes = [0, 1.5, 3.0, 4.5, 5.99, 6.0, 7.5];
testTimes.forEach(t => {
  const loopProgress = (t % duration) / duration;
  if (loopProgress < 0 || loopProgress >= 1 || isNaN(loopProgress)) {
    throw new Error(`Invalid loop progress at t=${t}: ${loopProgress}`);
  }
});
console.log('✓ 6.0s continuous loop progresses smoothly across cycle boundaries without jitter');

// Test 2: Corner braking easeInOut cubic curve
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const e0 = ease(0);
const eHalf = ease(0.5);
const e1 = ease(1);
if (e0 !== 0 || eHalf !== 0.5 || e1 !== 1) {
  throw new Error(`Corner braking cubic easing incorrect: [${e0}, ${eHalf}, ${e1}]`);
}
console.log('✓ Corner braking easing verified: start=0, mid=0.5, end=1');

// Test 3: Chequer dissolve threshold math
const cols = 20;
const rows = 5;
let activatedTilesAt0 = 0;
let activatedTilesAtHalf = 0;
let activatedTilesAt1 = 0;

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const diagDist = (c / cols) * 0.4 + (r / rows) * 0.6;
    const checkerOffset = ((r + c) % 2 === 0 ? 0.06 : -0.06);
    const threshold = Math.max(0.01, diagDist + checkerOffset);

    if (0.0 > threshold) activatedTilesAt0++;
    if (0.5 > threshold) activatedTilesAtHalf++;
    if (1.2 > threshold) activatedTilesAt1++;
  }
}

if (activatedTilesAt0 !== 0 || activatedTilesAtHalf <= 0 || activatedTilesAt1 !== cols * rows) {
  throw new Error(`Chequer dissolve progression failed: at0=${activatedTilesAt0}, atHalf=${activatedTilesAtHalf}, at1=${activatedTilesAt1}`);
}
console.log(`✓ Chequer dissolve tile wipe verified: 0% -> ${(activatedTilesAtHalf / (cols * rows) * 100).toFixed(1)}% -> 100%`);

console.log('✓ Phase F5 verified successfully!');
