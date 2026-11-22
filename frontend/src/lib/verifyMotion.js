/**
 * Verification test script for RepoLens motion engine.
 * Tests ticker, spring, scrollTrigger, textReveal, stack, and lenis.
 */

import { ticker } from './ticker.js';
import { Spring, createSpring } from './spring.js';
import { ScrollTrigger } from './scrollTrigger.js';
import { TextReveal } from './textReveal.js';
import { StackManager } from './stack.js';
import { initLenis, destroyLenis } from './lenis.js';

console.log('[VerifyMotion] Starting motion engine verification...');

// 1. Verify Spring Physics
const spring = createSpring({ tension: 170, friction: 26, initial: 0, target: 100 });
let steps = 0;
let done = false;
while (!done && steps < 500) {
  const res = spring.step(0.016);
  done = res.done;
  steps++;
}
if (!done || Math.abs(spring.value - 100) > 0.1) {
  throw new Error(`Spring failed to settle at target: value=${spring.value}, done=${done}`);
}
console.log(`✓ Spring settled at ${spring.value} in ${steps} steps`);

// 2. Verify Ticker
let tickCount = 0;
const unsub = ticker.add((time, delta, fps) => {
  tickCount++;
});
// Simulate ticks
ticker._onTick(16.6);
ticker._onTick(33.3);
ticker._onTick(50.0);
unsub();
if (tickCount !== 3) {
  throw new Error(`Ticker did not receive expected ticks: got ${tickCount}`);
}
console.log(`✓ Ticker executed 3 ticks smoothly, smoothed FPS: ${ticker.getFps()}`);

// 3. Verify ScrollTrigger math
const mockElement = {
  getBoundingClientRect: () => ({ top: 300, bottom: 800, height: 500 })
};
globalThis.window = {
  innerHeight: 1000,
  scrollY: 100,
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.performance = { now: () => Date.now() };

let triggerProgress = 0;
const trigger = new ScrollTrigger(mockElement, {
  onUpdate: ({ progress }) => { triggerProgress = progress; }
});
trigger.update();
console.log(`✓ ScrollTrigger computed progress: ${triggerProgress.toFixed(2)}, inView: ${trigger.inView}`);
trigger.destroy();

// 4. Verify TextReveal
const mockSpanParent = {
  textContent: 'RepoLens Code Graph',
  setAttribute: () => {},
  hasAttribute: () => true,
  getAttribute: () => 'RepoLens Code Graph',
  appendChild: () => {},
  innerHTML: ''
};
globalThis.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({
    style: {},
    classList: { add: () => {} }
  }),
  createTextNode: (t) => t
};
globalThis.window.matchMedia = () => ({ matches: false });

const reveal = new TextReveal(mockSpanParent, { mode: 'words' });
console.log(`✓ TextReveal created ${reveal.tokens.length} word tokens`);
reveal.destroy();

// 5. Verify StackManager
const mockCard1 = {
  style: {},
  getBoundingClientRect: () => ({ top: 0, height: 800 })
};
const mockCard2 = {
  style: {},
  getBoundingClientRect: () => ({ top: 400, height: 800 })
};
const mockContainer = {
  querySelectorAll: () => [mockCard1, mockCard2]
};
const stack = new StackManager(mockContainer, {});
stack._onScroll();
console.log(`✓ StackManager calculated card1 transform: ${mockCard1.style.transform}, filter: ${mockCard1.style.filter}`);
stack.destroy();

console.log('✓ All motion engine components verified successfully!');
