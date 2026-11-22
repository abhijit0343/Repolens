/**
 * RepoLens — Traversal Trace Engine
 * Executes a 6.0s continuous loop traversing top-degree function nodes
 * with corner braking, glowing head, fading trail, and target reticle.
 */

import { readToken } from './tokens.js';

export class TraversalTrace {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.duration = options.duration ?? 6.0; // 6.0s continuous loop
    this.trailLength = options.trailLength ?? 28;
    this.history = [];

    // Waypoints along high-degree architectural hubs
    this.waypoints = options.waypoints || [
      { x: 0.15, y: 0.25, name: 'app/main.py::lifespan' },
      { x: 0.38, y: 0.18, name: 'ingest/parse.py::parse_ast' },
      { x: 0.72, y: 0.32, name: 'codegraph/builder.py::build_graph' },
      { x: 0.82, y: 0.68, name: 'agents/planner.py::plan_step' },
      { x: 0.55, y: 0.82, name: 'rag/retriever.py::query_vectorstore' },
      { x: 0.28, y: 0.65, name: 'guardrails/output.py::verify_citations' }
    ];

    this.resize = this.resize.bind(this);
    this.update = this.update.bind(this);

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

  update(time) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Continuous 6.0s looping progress [0..1]
    const loopProgress = (time % this.duration) / this.duration;
    const numSegments = this.waypoints.length;
    const globalT = loopProgress * numSegments;
    const currIndex = Math.floor(globalT);
    const nextIndex = (currIndex + 1) % numSegments;
    const segT = globalT - currIndex;

    // Corner braking: smooth easeInOut cubic curve slowing down near corners
    const easedT = segT < 0.5
      ? 4 * segT * segT * segT
      : 1 - Math.pow(-2 * segT + 2, 3) / 2;

    const p0 = this.waypoints[currIndex];
    const p1 = this.waypoints[nextIndex];

    const currentX = (p0.x + (p1.x - p0.x) * easedT) * w;
    const currentY = (p0.y + (p1.y - p0.y) * easedT) * h;

    // Record trail point
    this.history.unshift({ x: currentX, y: currentY });
    if (this.history.length > this.trailLength) {
      this.history.pop();
    }

    const accentColor = readToken('--accent', '#6b8a6e');
    const glowColor = readToken('--ivory-50', '#f8f5ea');
    const mutedColor = readToken('--pale-sage-300', '#c3d1b5');

    // 1. Draw Fading Trail
    if (this.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Secondary soft glow stroke
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        const pt = this.history[i];
        const alpha = (1 - i / this.history.length) * 0.4;
        ctx.strokeStyle = `rgba(248, 245, 234, ${alpha})`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    }

    // 2. Draw Glowing Head
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // Reset shadow

    // 3. Target Reticle Crosshair at destination waypoint
    const targetX = p1.x * w;
    const targetY = p1.y * h;
    const reticleSize = 14;

    ctx.strokeStyle = mutedColor;
    ctx.lineWidth = 1;
    // Four corner brackets around target
    ctx.strokeRect(targetX - reticleSize, targetY - reticleSize, reticleSize * 2, reticleSize * 2);

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(targetX, targetY - reticleSize - 4);
    ctx.lineTo(targetX, targetY - reticleSize + 2);
    ctx.moveTo(targetX, targetY + reticleSize - 2);
    ctx.lineTo(targetX, targetY + reticleSize + 4);
    ctx.stroke();

    // Node label badge
    ctx.fillStyle = glowColor;
    ctx.font = '10px monospace';
    ctx.fillText(`TARGET: ${p1.name}`, targetX + reticleSize + 6, targetY + 3);
  }

  destroy() {
    this.ctx = null;
    this.canvas = null;
    this.history = [];
  }
}

export default TraversalTrace;
