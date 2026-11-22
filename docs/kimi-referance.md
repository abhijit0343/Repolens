# RepoLens — Frontend Visual & WebGL Reference Specification

> **Override Notice:** This specification replaces all previous colour palettes (sage/teal/blue/pink) with a strict two-colour system: **Deep Crimson Burgundy** and **Warm Ivory Cream**. All Three.js shaders, canvases, custom cursor states, and UI components must read colours dynamically from these CSS tokens via `readToken()`.

---

## 1. Colour System & Design Tokens (`src/styles/tokens.css`)

Strict 3-tier token architecture (`raw -> role -> usage`). Zero off-palette hues.

```css
:root {
  /* Tier 1: Raw Palette — Warm Ivory Cream & Deep Crimson Burgundy */
  --ivory-50: #fbf7ef;
  --ivory-100: #f4ecdc;
  --ivory-200: #e8dcc6;
  --ivory-300: #d6c5a9;

  --crimson-400: #9e2a3b;
  --crimson-500: #7c1828;
  --crimson-600: #63111f;
  --crimson-700: #4a0c17;
  --crimson-800: #31070f;
  --crimson-900: #1c0409;

  /* Tier 2: Semantic Roles */
  --background: var(--ivory-50);
  --foreground: var(--crimson-900);
  --foreground-muted: rgba(28, 4, 9, 0.58);

  --accent: var(--crimson-500);
  --accent-hover: var(--crimson-600);
  --accent-muted: rgba(124, 24, 40, 0.22);

  --surface-dark: var(--crimson-800);
  --surface-black: var(--crimson-900);
  --surface-muted: var(--ivory-100);
  --surface-soft: var(--ivory-200);
  --border-muted: var(--ivory-300);

  --foreground-on-dark: var(--ivory-50);
  --foreground-on-dark-muted: rgba(244, 236, 220, 0.72);

  /* Glassmorphism & Radial Depth */
  --glass-bg: rgba(251, 247, 239, 0.07);
  --glass-border: rgba(251, 247, 239, 0.18);
  --bg-radial-inner: #63111f;
  --bg-radial-mid: #31070f;
  --bg-radial-outer: #1c0409;

  /* Tier 3: Visualisation, Cursor & WebGL Usage */
  --map-dot: var(--ivory-300);
  --map-grid: rgba(214, 197, 169, 0.35);
  --timeline-outline: var(--crimson-600);
  --timeline-fill: rgba(251, 247, 239, 0.10);
  --glow-on-dark: var(--ivory-100);
  --glow-on-light: var(--crimson-500);
  --cursor-core: var(--ivory-50);
  --cursor-ring: rgba(251, 247, 239, 0.55);
  --cursor-ring-light: rgba(124, 24, 40, 0.55);

  /* Typography */
  --font-display: 'Oswald', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
}