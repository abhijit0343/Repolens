import React, { useState, useEffect, useRef } from 'react';
import { Masthead } from './components/Masthead.jsx';
import { Loader } from './sections/Loader.jsx';
import { Hero } from './sections/Hero.jsx';
import { GraphSoFar } from './sections/GraphSoFar.jsx';
import { Pipeline } from './sections/Pipeline.jsx';
import { Explorer } from './sections/Explorer.jsx';
import { Footer } from './sections/Footer.jsx';
import { Banner } from './components/Banner.jsx';
import { initLenis, destroyLenis } from './lib/lenis.js';
import { StackManager } from './lib/stack.js';

export function App() {
  const [scenesReady, setScenesReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const stackContainerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Lenis smooth scroll
    initLenis();

    // 2. Signal loader ready after assets mount
    const readyTimer = setTimeout(() => {
      setScenesReady(true);
    }, 400);

    // 3. Initialize Sticky Stack on pinned sections
    let stackManager = null;
    if (stackContainerRef.current) {
      stackManager = new StackManager(stackContainerRef.current, {
        sectionSelector: '[data-stack-card]',
        minScale: 0.9,
        maxShade: 0.55,
      });
    }

    return () => {
      clearTimeout(readyTimer);
      destroyLenis();
      if (stackManager) stackManager.destroy();
    };
  }, []);

  const handleExploreClick = () => {
    const el = document.querySelector('#explorer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-black)', color: 'var(--ivory-50)', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 3-beat loader */}
      <Loader ready={scenesReady} />

      {/* Global Masthead */}
      <Masthead onExploreClick={handleExploreClick} />

      {/* Offline fallback banner */}
      {offline && (
        <div className="fixed top-20 left-0 right-0 z-30 px-6">
          <Banner
            type="offline"
            message="Backend API offline. Operating in local GraphRAG fallback mode."
            onDismiss={() => setOffline(false)}
          />
        </div>
      )}

      {/* Stacked Pinned Sections Container (Hero, GraphSoFar, Pipeline) */}
      <main ref={stackContainerRef} className="relative w-full">
        <Hero onExploreClick={handleExploreClick} />
        <GraphSoFar />
        <Pipeline />
      </main>

      {/* Unpinned Full-Viewport Explorer Section */}
      <Explorer />

      {/* Unpinned Technical Footer */}
      <Footer />
    </div>
  );
}

export default App;
