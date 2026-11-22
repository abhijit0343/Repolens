/**
 * RepoLens — Custom Burn-Away Dissolve Shader
 * Implements crown-to-chin noise-threshold dissolution with glowing ember edges
 * and a 3.1-second periodic pulse wave.
 */

import * as THREE from 'three';

export const DissolveShader = {
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uPulseProgress;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // 3.1s pulse wave displacement
      vec3 pos = position;
      float pulse = sin(uPulseProgress * 6.28318) * 0.5 + 0.5;
      pos += normal * (pulse * 0.08);

      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,

  fragmentShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    uniform vec3 uBaseColor;
    uniform vec3 uEdgeColor;
    uniform float uDissolve; // 0.0 (fully intact) to 1.0 (fully dissolved)
    uniform float uEdgeWidth;
    uniform float uTime;

    // Fast procedural pseudo-noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      // Crown-to-chin gradient: normalized y from top (+1.0) to bottom (-1.0)
      float normY = (1.2 - vPosition.y) * 0.45;
      float n = noise(vPosition.xy * 4.5 + uTime * 0.1) * 0.25;
      float dissolveVal = normY + n;

      if (dissolveVal < uDissolve) {
        discard;
      }

      // Glowing ember edge
      float edgeDiff = dissolveVal - uDissolve;
      vec3 finalColor = uBaseColor;

      // Fresnel lighting rim
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
      finalColor += uEdgeColor * fresnel * 0.6;

      if (edgeDiff < uEdgeWidth) {
        float glow = 1.0 - (edgeDiff / uEdgeWidth);
        finalColor = mix(finalColor, uEdgeColor, glow * 1.5);
      }

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `
};

export function createDissolveMaterial({
  baseColor = 0x6b8a6e,
  edgeColor = 0xf8f5ea,
  wireframe = false
} = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: DissolveShader.vertexShader,
    fragmentShader: DissolveShader.fragmentShader,
    uniforms: {
      uBaseColor: { value: new THREE.Color(baseColor) },
      uEdgeColor: { value: new THREE.Color(edgeColor) },
      uDissolve: { value: 0.0 },
      uEdgeWidth: { value: 0.08 },
      uTime: { value: 0.0 },
      uPulseProgress: { value: 0.0 }
    },
    wireframe,
    transparent: true,
    side: THREE.DoubleSide
  });
}

export default createDissolveMaterial;
