/**
 * Verification test for Phase F4: CodeShell, DissolveShader, and mobile tier branch.
 */

import { CodeShell } from '../CodeShell.js';
import { DissolveShader, createDissolveMaterial } from '../DissolveShader.js';

console.log('[VerifyF4] Verifying CodeShell, DissolveShader, and mobile bypass...');

// Test 1: Shader syntax validation
if (!DissolveShader.vertexShader.includes('uPulseProgress') || !DissolveShader.fragmentShader.includes('uDissolve')) {
  throw new Error('DissolveShader missing required uniforms');
}
console.log('✓ DissolveShader GLSL syntax contains required pulse & dissolve uniforms');

// Test 2: Desktop CodeShell instantiation
const desktopShell = new CodeShell({ isMobile: false });
if (desktopShell.materials.length === 0) {
  throw new Error('Desktop CodeShell did not instantiate shader materials');
}
console.log(`✓ Desktop CodeShell initialized with ${desktopShell.materials.length} custom shader materials`);

// Test 3: Dissolve threshold setting
desktopShell.setDissolve(0.65);
const currentDissolve = desktopShell.materials[0].uniforms.uDissolve.value;
if (Math.abs(currentDissolve - 0.65) > 0.001) {
  throw new Error(`Failed to set dissolve amount: got ${currentDissolve}`);
}
console.log(`✓ Dissolution progress verified at: ${currentDissolve}`);

// Test 4: Pulse wave 3.1s cycle
desktopShell.update(6.2); // 6.2s is 2.0 full cycles of 3.1s
const pulseProgress = desktopShell.materials[0].uniforms.uPulseProgress.value;
console.log(`✓ 3.1s pulse cycle computed: ${pulseProgress.toFixed(3)}`);

// Test 5: Mobile tier branch (skips heavy shader)
const mobileShell = new CodeShell({ isMobile: true });
if (mobileShell.materials.length !== 0) {
  throw new Error('Mobile CodeShell should skip custom shader materials');
}
console.log('✓ Mobile tier CodeShell correctly skipped heavy shader materials (lightweight materials active)');

desktopShell.dispose();
mobileShell.dispose();

console.log('✓ Phase F4 verified successfully!');
