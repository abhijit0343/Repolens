/**
 * RepoLens — HeroScene (Three.js WebGL Engine)
 * Manages 3D point cloud instancing from graph coordinates, procedural 4-sine contour canvas,
 * cursor parallax drift, and graceful SVG fallback.
 */

import * as THREE from 'three';
import { getDeviceTier, isWebGLAvailable } from './tier.js';
import { readToken, readTokenColor } from './tokens.js';
import { ContourCanvas } from './ContourCanvas.js';
import ticker from '../lib/ticker.js';

export class HeroScene {
  constructor(container) {
    this.container = container;
    this.tier = getDeviceTier();
    this.isReady = false;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.unsubscribeTicker = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onResize = this._onResize.bind(this);
    this._render = this._render.bind(this);

    this.init();
  }

  async init() {
    if (!this.container) return;

    if (!isWebGLAvailable()) {
      this.renderFallback();
      this.isReady = true;
      return;
    }

    try {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      // 1. Create Contour 2D Canvas Layer
      this.contourCanvasEl = document.createElement('canvas');
      this.contourCanvasEl.style.position = 'absolute';
      this.contourCanvasEl.style.inset = '0';
      this.contourCanvasEl.style.width = '100%';
      this.contourCanvasEl.style.height = '100%';
      this.contourCanvasEl.style.pointerEvents = 'none';
      this.contourCanvasEl.style.zIndex = '0';
      this.container.appendChild(this.contourCanvasEl);
      this.contour = new ContourCanvas(this.contourCanvasEl);

      // 2. Three.js Scene, Camera, Renderer
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 9);

      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: this.tier.antialias,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(this.tier.dpr);
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.inset = '0';
      this.renderer.domElement.style.zIndex = '1';
      this.container.appendChild(this.renderer.domElement);

      // 3. Build Point Cloud from Mock Graph or Procedural Topology
      await this.buildPointCloud();

      // 4. Window & Mouse Listeners
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      window.addEventListener('resize', this._onResize, { passive: true });

      // 5. Connect to shared RAF Ticker
      this.unsubscribeTicker = ticker.add(this._render);
      this.isReady = true;
    } catch (err) {
      console.warn('[HeroScene] WebGL initialization failed, falling back to SVG:', err);
      this.renderFallback();
      this.isReady = true;
    }
  }

  async buildPointCloud() {
    let nodes = [];
    try {
      const res = await fetch('/mock/graph.json');
      if (res.ok) {
        const data = await res.json();
        nodes = data.nodes || [];
      }
    } catch (e) {
      // Procedural fallback nodes if network fetch fails
      nodes = Array.from({ length: 60 }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        type: ['Function', 'Class', 'File', 'Module'][i % 4]
      }));
    }

    const totalParticles = this.tier.particles;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);

    const typeColorMap = {
      File: readTokenColor('--node-file', 0xf8f5ea),
      Class: readTokenColor('--node-class', 0x6b8a6e),
      Function: readTokenColor('--node-function', 0x3f5744),
      Module: readTokenColor('--node-module', 0xc3d1b5),
      Import: readTokenColor('--node-import', 0xa9bd9a),
    };

    for (let i = 0; i < totalParticles; i++) {
      const node = nodes[i % nodes.length] || { x: 0.5, y: 0.5, z: 0.5, type: 'Function' };
      // Map [0..1] coordinates to [-4.5 .. 4.5] with subtle noise jitter
      const jitter = (Math.random() - 0.5) * 0.35;
      const x = (node.x - 0.5) * 9 + jitter;
      const y = (node.y - 0.5) * 6 + jitter;
      const z = (node.z - 0.5) * 7 + jitter;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = typeColorMap[node.type] || typeColorMap.Function;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.tier.isMobile ? 0.08 : 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.pointCloud = new THREE.Points(geometry, material);
    this.scene.add(this.pointCloud);
  }

  _onMouseMove(e) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    this.mouse.targetX = nx * 0.8;
    this.mouse.targetY = ny * 0.5;
  }

  _onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.contour) {
      this.contour.resize();
    }
  }

  _render(time) {
    if (!this.renderer || !this.scene || !this.camera) return;

    // Render 2D contour backdrop
    if (this.contour) {
      this.contour.render(time);
    }

    // Smooth cursor drift & depth parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.camera.position.x = this.mouse.x * 1.5;
    this.camera.position.y = this.mouse.y * 1.0;
    this.camera.lookAt(0, 0, 0);

    // Subtle idle orbital rotation of point cloud
    if (this.pointCloud) {
      this.pointCloud.rotation.y = time * 0.04;
      this.pointCloud.rotation.x = Math.sin(time * 0.03) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  renderFallback() {
    if (!this.container) return;
    const svg = `
      <svg class="w-full h-full opacity-30 pointer-events-none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fallbackGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#6b8a6e" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#1f2c23" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#fallbackGrad)" />
        <circle cx="400" cy="300" r="180" fill="none" stroke="#c3d1b5" stroke-dasharray="4 6" />
        <circle cx="400" cy="300" r="90" fill="none" stroke="#6b8a6e" stroke-width="1.5" />
      </svg>
    `;
    this.container.innerHTML = svg;
  }

  destroy() {
    if (this.unsubscribeTicker) {
      this.unsubscribeTicker();
      this.unsubscribeTicker = null;
    }
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);

    if (this.pointCloud) {
      this.pointCloud.geometry.dispose();
      this.pointCloud.material.dispose();
      this.scene?.remove(this.pointCloud);
    }
    if (this.contour) {
      this.contour.destroy();
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement?.remove();
    }
  }
}

export default HeroScene;
