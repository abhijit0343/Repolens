import React, { useState, useEffect, useRef } from 'react';
import { Masthead } from './components/Masthead.jsx';
import { Loader } from './sections/Loader.jsx';
import { Hero } from './sections/Hero.jsx';
import { GraphSoFar } from './sections/GraphSoFar.jsx';
import { Pipeline } from './sections/Pipeline.jsx';
import { Banner } from './components/Banner.jsx';
import { initLenis, destroyLenis } from './lib/lenis.js';
import { StackManager } from './lib/stack.js';

export function App() {
  const [scenesReady, setScenesReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const stackContainerRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    initLenis();

    // Signal loader ready after assets mount
    const readyTimer = setTimeout(() => {
      setScenesReady(true);
    }, 400);

    // Initialize Sticky Stack
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

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--accent)] selection:text-[var(--ivory-50)] overflow-x-hidden">
      {/* 3-beat loader */}
      <Loader ready={scenesReady} />

      {/* Global Masthead */}
      <Masthead />

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

      {/* Stacked Sections Container */}
      <main ref={stackContainerRef} className="relative w-full">
        <Hero />
        <GraphSoFar />
        <Pipeline />
      </main>
    </div>
  );
}

export default App;
