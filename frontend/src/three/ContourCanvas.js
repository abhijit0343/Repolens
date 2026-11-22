/**
 * RepoLens — Procedural 4-Sine Contour Canvas
 * Renders layered animated topographical contour lines using 4 harmonic sine waves.
 */

import { readToken } from './tokens.js';

export class ContourCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.lineCount = 14;
    this.baseAmplitude = 35;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || window.innerWidth || 800;
    const height = rect?.height || window.innerHeight || 600;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.width = width;
    this.height = height;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  render(time) {
    if (!this.ctx) return;
    this.time = time;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const strokeColor = readToken('--pale-sage-300', '#c3d1b5');
    ctx.lineWidth = 1.0;

    // Draw 4-sine contour lines across vertical intervals
    const stepY = h / (this.lineCount + 1);

    for (let i = 1; i <= this.lineCount; i++) {
      const baseY = i * stepY;
      const alpha = 0.08 + (i / this.lineCount) * 0.14; // Subtle sage opacity
      ctx.strokeStyle = `rgba(195, 209, 181, ${alpha})`;

      ctx.beginPath();
      const points = 40;
      const stepX = w / points;

      for (let j = 0; j <= points; j++) {
        const x = j * stepX;
        const normX = x / w;

        // 4 Harmonic sine waves
        const s1 = Math.sin(normX * 4.2 + this.time * 0.35 + i * 0.4);
        const s2 = Math.sin(normX * 8.5 - this.time * 0.25 + i * 0.6) * 0.5;
        const s3 = Math.sin(normX * 14.1 + this.time * 0.45) * 0.25;
        const s4 = Math.sin(normX * 22.0 - this.time * 0.15) * 0.12;

        const combinedSine = s1 + s2 + s3 + s4;
        const y = baseY + combinedSine * (this.baseAmplitude * (0.6 + (i % 3) * 0.2));

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  destroy() {
    this.ctx = null;
    this.canvas = null;
  }
}

export default ContourCanvas;
