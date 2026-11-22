/**
 * RepoLens — Chequer Dissolve Transition Seam
 * Renders a chequered pixel-grid transition between stacked sections,
 * wiping across alternating tiles based on scroll progress.
 */

import { readToken } from './tokens.js';

export class ChequerDissolve {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = options.tileSize ?? 24;
    this.progress = options.progress ?? 0;
    this.color = options.color || readToken('--surface-black', '#1f2c23');

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || window.innerWidth || 800;
    const height = rect?.height || 120;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.width = width;
    this.height = height;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  setProgress(progress) {
    this.progress = Math.max(0, Math.min(1, progress));
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.progress <= 0.001) return;

    const cols = Math.ceil(w / this.tileSize);
    const rows = Math.ceil(h / this.tileSize);

    ctx.fillStyle = this.color;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Compute diagonal wave offset
        const diagDist = (c / cols) * 0.4 + (r / rows) * 0.6;
        // Alternating checker pattern adds extra threshold variation
        const checkerOffset = ((r + c) % 2 === 0 ? 0.06 : -0.06);
        const threshold = Math.max(0.01, diagDist + checkerOffset);

        if (this.progress > threshold) {
          // Tile scale or opacity expands as progress moves past threshold
          const tileFactor = Math.min(Math.max((this.progress - threshold) / 0.18, 0), 1);
          const size = this.tileSize * tileFactor;
          const x = c * this.tileSize + (this.tileSize - size) / 2;
          const y = r * this.tileSize + (this.tileSize - size) / 2;

          ctx.fillRect(x, y, size, size);
        }
      }
    }
  }

  destroy() {
    this.ctx = null;
    this.canvas = null;
  }
}

export default ChequerDissolve;
