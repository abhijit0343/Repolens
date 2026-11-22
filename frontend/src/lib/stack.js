/**
 * RepoLens — Sticky Stack Engine
 * Manages sticky stacked sections where preceding pinned cards scale down to 0.9
 * and recede into 55% shading as subsequent sections scroll into view.
 */

export class StackManager {
  constructor(containerOrSelector, options = {}) {
    this.container = typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector;
    this.sectionSelector = options.sectionSelector || '[data-stack-card]';
    this.minScale = options.minScale ?? 0.9;
    this.maxShade = options.maxShade ?? 0.55; // 55% recession shade

    this.sections = [];
    this._onScroll = this._onScroll.bind(this);

    this.init();
  }

  init() {
    if (!this.container || typeof window === 'undefined') return;

    this.sections = Array.from(this.container.querySelectorAll(this.sectionSelector));
    if (this.sections.length === 0) return;

    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onScroll, { passive: true });
    this._onScroll();
  }

  _onScroll() {
    const vh = window.innerHeight || 1;

    this.sections.forEach((card, index) => {
      // If there is a next card, calculate how far next card has overlapped this card
      const nextCard = this.sections[index + 1];
      if (!nextCard) {
        // Last card remains normal
        card.style.transform = 'scale(1)';
        card.style.filter = 'brightness(1)';
        card.style.opacity = '1';
        return;
      }

      const nextRect = nextCard.getBoundingClientRect();
      // When nextRect.top reaches vh, overlap starts (progress = 0)
      // When nextRect.top reaches 0, overlap is full (progress = 1)
      let progress = 1 - (nextRect.top / vh);
      progress = Math.max(0, Math.min(1, progress));

      const scale = 1 - progress * (1 - this.minScale);
      const brightness = 1 - progress * (1 - this.maxShade);
      const opacity = 1 - progress * 0.25;

      card.style.transform = `scale(${scale.toFixed(4)})`;
      card.style.filter = `brightness(${brightness.toFixed(4)})`;
      card.style.opacity = `${opacity.toFixed(4)}`;
      card.style.transformOrigin = 'center top';
    });
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this._onScroll);
      window.removeEventListener('resize', this._onScroll);
    }
    this.sections.forEach(card => {
      card.style.transform = '';
      card.style.filter = '';
      card.style.opacity = '';
    });
    this.sections = [];
  }
}

export function createStackManager(container, options) {
  return new StackManager(container, options);
}

export default createStackManager;
