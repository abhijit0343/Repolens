/**
 * RepoLens — Three.js Tier & GPU Capability Detector
 * Clamps DPR, assigns particle counts, and determines WebGL settings based on device tier.
 */

export function getDeviceTier() {
  if (typeof window === 'undefined') {
    return {
      tier: 'desktop',
      isMobile: false,
      isTablet: false,
      dpr: 1.0,
      particles: 1200,
      postProcessing: true,
      antialias: true
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  const isMobile = /mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua) || width < 640;
  const isTablet = (!isMobile && (/ipad|tablet|android/i.test(ua) || (width >= 640 && width < 1024)));
  const isDesktop = !isMobile && !isTablet;

  let dpr = window.devicePixelRatio || 1;
  let particles = 1200;
  let postProcessing = true;
  let antialias = true;

  if (isMobile) {
    dpr = 1.0; // clamp mobile DPR strictly to 1.0
    particles = 300;
    postProcessing = false;
    antialias = false;
  } else if (isTablet) {
    dpr = Math.min(dpr, 1.25);
    particles = 600;
    postProcessing = false;
    antialias = true;
  } else {
    dpr = Math.min(Math.max(dpr, 1.0), 2.0); // Clamp desktop DPR to 1.0..2.0
    particles = 1200;
    postProcessing = true;
    antialias = true;
  }

  return {
    tier: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    isMobile,
    isTablet,
    isDesktop,
    dpr,
    particles,
    postProcessing,
    antialias
  };
}

export function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export default {
  getDeviceTier,
  isWebGLAvailable
};
