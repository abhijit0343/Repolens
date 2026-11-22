/**
 * RepoLens — Halftone Map Lattice
 * Renders a 2D density halftone grid with crawling dashed coordinate axes.
 */

import { readToken } from './tokens.js';

export class HalftoneMap {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSpacing = options.gridSpacing ?? 32;
    this.time = 0;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || window.innerWidth || 800;
    const height = rect?.height || 500;

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
    if (!this.ctx || !this.canvas) return;
    this.time = time;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const gridColor = readToken('--map-grid', 'rgba(195, 209, 181, 0.35)');
    const dotColor = readToken('--map-dot', '#a9bd9a');

    // 1. Crawling Dashed Coordinate Axes
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    const dashLength = 8;
    const dashOffset = (this.time * 25) % (dashLength * 2);
    ctx.setLineDash([dashLength, dashLength]);
    ctx.lineDashOffset = -dashOffset;

    // Vertical dashed lines
    for (let x = 0; x <= w; x += this.gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal dashed lines
    ctx.lineDashOffset = dashOffset;
    for (let y = 0; y <= h; y += this.gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash for dots

    // 2. Halftone Density Lattice Dots
    ctx.fillStyle = dotColor;
    const cols = Math.floor(w / this.gridSpacing);
    const rows = Math.floor(h / this.gridSpacing);

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = c * this.gridSpacing;
        const y = r * this.gridSpacing;

        // Density wave representing functional clustering
        const dx = (x - w * 0.5) / (w * 0.5);
        const dy = (y - h * 0.5) / (h * 0.5);
        const distCenter = Math.sqrt(dx * dx + dy * dy);

        const clusterWave = Math.sin(dx * 4.0 + this.time * 0.8) * Math.cos(dy * 4.0 - this.time * 0.6);
        const radius = Math.max(1.0, (1.8 - distCenter * 0.8 + clusterWave * 0.5) * 2.2);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  destroy() {
    this.ctx = null;
    this.canvas = null;
  }
}

export default HalftoneMap;
