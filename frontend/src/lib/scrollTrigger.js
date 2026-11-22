/**
 * RepoLens — Viewport Scroll Trigger
 * Computes normalized progress (0..1), velocity, and in-view state.
 */

export class ScrollTrigger {
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.onUpdate = options.onUpdate || null;
    this.onEnter = options.onEnter || null;
    this.onLeave = options.onLeave || null;
    this.startOffset = options.startOffset ?? 0; // ratio of viewport height
    this.endOffset = options.endOffset ?? 1;

    this.progress = 0;
    this.velocity = 0;
    this.inView = false;
    this.lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : 0;

    this.update = this.update.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.update, { passive: true });
      window.addEventListener('resize', this.update, { passive: true });
      this.update();
    }
  }

  update() {
    if (!this.element || typeof window === 'undefined') return;

    const rect = this.element.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const now = performance.now();
    const dt = Math.max((now - this.lastTime) / 1000, 0.001);
    const scrollY = window.scrollY;

    this.velocity = (scrollY - this.lastScrollY) / dt;
    this.lastScrollY = scrollY;
    this.lastTime = now;

    // Start: when element top hits (1 - startOffset) of viewport
    // End: when element bottom hits (1 - endOffset) of viewport
    const startY = vh * (1 - this.startOffset);
    const endY = -rect.height * (1 - this.endOffset);
    const totalDist = startY - endY;

    let progress = (startY - rect.top) / totalDist;
    progress = Math.max(0, Math.min(1, progress));
    this.progress = progress;

    const wasInView = this.inView;
    this.inView = rect.bottom > 0 && rect.top < vh;

    if (!wasInView && this.inView && this.onEnter) {
      this.onEnter(this);
    } else if (wasInView && !this.inView && this.onLeave) {
      this.onLeave(this);
    }

    if (this.onUpdate) {
      this.onUpdate({
        progress: this.progress,
        velocity: this.velocity,
        inView: this.inView,
        rect
      });
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.update);
      window.removeEventListener('resize', this.update);
    }
    this.onUpdate = null;
    this.onEnter = null;
    this.onLeave = null;
  }
}

export function createScrollTrigger(element, options) {
  return new ScrollTrigger(element, options);
}

export default createScrollTrigger;
