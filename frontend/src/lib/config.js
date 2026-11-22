import * as THREE from "three";

export const CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
  assetBaseUrl: import.meta.env.VITE_ASSET_BASE_URL || "/assets",
  useMockFallback: import.meta.env.VITE_USE_MOCK_FALLBACK !== "false",
};

/**
 * Dynamically read raw or computed CSS custom property from :root.
 */
export function readToken(varName, fallback = "") {
  if (typeof window === "undefined" || !document.documentElement) {
    return fallback;
  }
  const cleanName = varName.startsWith("--") ? varName : `--${varName}`;
  const val = getComputedStyle(document.documentElement).getPropertyValue(cleanName).trim();
  return val || fallback;
}

/**
 * Read CSS custom property and parse into a Three.js Color instance.
 */
export function readTokenColor(varName, fallbackHex = 0x6b8a6e) {
  const token = readToken(varName);
  if (!token) {
    return new THREE.Color(fallbackHex);
  }
  try {
    return new THREE.Color(token);
  } catch {
    return new THREE.Color(fallbackHex);
  }
}
