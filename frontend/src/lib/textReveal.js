/**
 * RepoLens — Text Reveal Motion Engine
 * Splits text into staggered words/characters with entrance easing.
 */

export class TextReveal {
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.mode = options.mode || 'chars'; // 'chars' | 'words'
    this.staggerMs = options.staggerMs ?? 25;
    this.durationMs = options.durationMs ?? 450;
    this.revealed = false;
    this.tokens = [];

    this._prefersReduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._split();
  }

  _split() {
    if (!this.element) return;
    const originalText = this.element.textContent || '';
    this.element.setAttribute('data-original-text', originalText);
    this.element.setAttribute('aria-label', originalText);
    this.element.innerHTML = '';

    if (this._prefersReduced) {
      this.element.textContent = originalText;
      this.revealed = true;
      return;
    }

    if (this.mode === 'words') {
      const words = originalText.split(/\s+/).filter(Boolean);
      words.forEach((word, idx) => {
        const span = document.createElement('span');
        span.className = 'reveal-word';
        span.textContent = word;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(16px)';
        span.style.transition = `opacity ${this.durationMs}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${this.durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        span.style.transitionDelay = `${idx * this.staggerMs}ms`;
        this.element.appendChild(span);
        if (idx < words.length - 1) {
          this.element.appendChild(document.createTextNode(' '));
        }
        this.tokens.push(span);
      });
    } else {
      // Split into characters
      const chars = Array.from(originalText);
      chars.forEach((char, idx) => {
        const span = document.createElement('span');
        span.className = 'reveal-char';
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(14px)';
        span.style.transition = `opacity ${this.durationMs}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${this.durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        span.style.transitionDelay = `${idx * this.staggerMs}ms`;
        this.element.appendChild(span);
        this.tokens.push(span);
      });
    }
  }

  play() {
    if (this._prefersReduced || this.revealed) return;
    this.revealed = true;
    requestAnimationFrame(() => {
      this.tokens.forEach(span => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      });
    });
  }

  reset() {
    if (this._prefersReduced) return;
    this.revealed = false;
    this.tokens.forEach(span => {
      span.style.opacity = '0';
      span.style.transform = 'translateY(14px)';
    });
  }

  destroy() {
    if (this.element && this.element.hasAttribute('data-original-text')) {
      this.element.textContent = this.element.getAttribute('data-original-text');
    }
    this.tokens = [];
  }
}

export function createTextReveal(element, options) {
  return new TextReveal(element, options);
}

export default createTextReveal;
