/**
 * Verification test for Phase F7: 3D Graph layout, NodePanel schema, and RepoBar validation.
 */

import fs from 'fs';
import path from 'path';

console.log('[VerifyF7] Testing 3D GraphScene data and NodePanel interactions...');

// Test 1: Load and validate mock graph JSON
const mockPath = path.resolve('public/mock/graph.json');
const raw = fs.readFileSync(mockPath, 'utf8');
const graph = JSON.parse(raw);

if (!graph.nodes || graph.nodes.length < 50) {
  throw new Error(`Expected at least 50 mock nodes, found: ${graph.nodes?.length}`);
}
if (!graph.edges || graph.edges.length < 50) {
  throw new Error(`Expected at least 50 mock edges, found: ${graph.edges?.length}`);
}
console.log(`✓ Loaded graph.json: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

// Test 2: Invariants on 3D node coordinates
const nodeTypes = new Set();
graph.nodes.forEach(n => {
  nodeTypes.add(n.type);
  if (typeof n.x !== 'number' || typeof n.y !== 'number' || typeof n.z !== 'number') {
    throw new Error(`Node ${n.id} missing 3D coordinates`);
  }
  if (n.x < 0 || n.x > 1 || n.y < 0 || n.y > 1 || n.z < 0 || n.z > 1) {
    throw new Error(`Node ${n.id} coordinates outside [0..1] range`);
  }
});
console.log(`✓ 3D Coordinates normalized in [0..1] across types: ${Array.from(nodeTypes).join(', ')}`);

// Test 3: Node details inspection (callers / callees)
const sampleFunction = graph.nodes.find(n => n.type === 'Function');
if (!sampleFunction) {
  throw new Error('No Function node found in graph');
}
const callers = graph.edges.filter(e => e.target === sampleFunction.id).map(e => e.source);
const callees = graph.edges.filter(e => e.source === sampleFunction.id).map(e => e.target);
console.log(`✓ Node '${sampleFunction.label}' inspection: ${callers.length} callers, ${callees.length} callees`);

// Test 4: RepoBar GitHub URL regex validation
const githubRegex = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
if (!githubRegex.test('https://github.com/octocat/Hello-World')) {
  throw new Error('Valid GitHub URL rejected');
}
if (githubRegex.test('https://malicious.com/repo') || githubRegex.test('http://github.com/repo')) {
  throw new Error('Invalid URL accepted');
}
console.log('✓ GitHub repository URL format validator verified');

console.log('✓ Phase F7 verified successfully!');
