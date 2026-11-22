/**
 * RepoLens — Shared RequestAnimationFrame Ticker
 * Manages a single RAF loop, computes delta time and smoothed FPS,
 * and pauses automatically when the document is hidden.
 */

class Ticker {
  constructor() {
    this.listeners = new Set();
    this.rafId = null;
    this.lastTime = 0;
    this.time = 0;
    this.delta = 0;
    this.fps = 60;
    this.isRunning = false;
    this.maxDelta = 0.1; // clamp delta to 100ms to avoid physics explosions

    this._onTick = this._onTick.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  add(fn) {
    if (typeof fn !== 'function') return () => {};
    this.listeners.add(fn);
    if (!this.isRunning) {
      this.start();
    }
    return () => this.remove(fn);
  }

  remove(fn) {
    this.listeners.delete(fn);
    if (this.listeners.size === 0) {
      this.stop();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.rafId = window.requestAnimationFrame(this._onTick);
    }
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _onTick(now) {
    if (!this.isRunning) return;

    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp delta
    this.delta = Math.min(Math.max(rawDelta, 0.0001), this.maxDelta);
    this.time += this.delta;

    // Smoothed FPS calculation
    const instantFps = 1 / this.delta;
    this.fps = this.fps * 0.9 + instantFps * 0.1;

    for (const fn of this.listeners) {
      try {
        fn(this.time, this.delta, this.fps);
      } catch (err) {
        console.error('[Ticker] Error in tick listener:', err);
      }
    }

    if (this.isRunning && typeof window !== 'undefined') {
      this.rafId = window.requestAnimationFrame(this._onTick);
    }
  }

  _onVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.stop();
    } else if (this.listeners.size > 0) {
      this.start();
    }
  }

  getFps() {
    return Math.round(this.fps);
  }

  getTime() {
    return this.time;
  }
}

export const ticker = new Ticker();
export default ticker;
