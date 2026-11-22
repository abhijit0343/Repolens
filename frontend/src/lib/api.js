import { CONFIG } from "./config.js";

/**
 * Trigger repository background cloning and GraphRAG indexing.
 */
export async function indexRepo(url) {
  const res = await fetch(`${CONFIG.apiUrl}/repos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to queue repo indexing" }));
    throw new Error(err.detail || "Failed to start repository indexing");
  }
  return res.json();
}

/**
 * Query repository indexing status.
 */
export async function getRepoStatus(repoId) {
  const res = await fetch(`${CONFIG.apiUrl}/repos/${repoId}/status`);
  if (!res.ok) {
    throw new Error(`Failed to get status for ${repoId}`);
  }
  return res.json();
}

/**
 * Fetch 3D graph data with mock fallback support if offline.
 */
export async function getRepoGraph(repoId, onFallback) {
  try {
    const res = await fetch(`${CONFIG.apiUrl}/repos/${repoId}/graph`);
    if (res.ok) {
      if (onFallback) onFallback(false);
      return await res.json();
    }
  } catch (err) {
    console.warn("[API] Live backend unavailable, checking mock fallback...", err);
  }

  if (CONFIG.useMockFallback) {
    if (onFallback) onFallback(true);
    const mockRes = await fetch("/mock/graph.json");
    if (!mockRes.ok) {
      throw new Error("Failed to load offline mock graph");
    }
    return await mockRes.json();
  }

  throw new Error(`Graph data for repository '${repoId}' unavailable.`);
}

/**
 * Get node details including callers and callees.
 */
export async function getNodeDetails(repoId, nodeId) {
  try {
    const encoded = encodeURIComponent(nodeId);
    const res = await fetch(`${CONFIG.apiUrl}/repos/${repoId}/node/${encoded}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[API] Failed to fetch live node details:", err);
  }
  return null;
}

/**
 * Analyze symbol impact blast radius.
 */
export async function getSymbolImpact(repoId, symbol) {
  const res = await fetch(`${CONFIG.apiUrl}/repos/${repoId}/impact?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) {
    throw new Error(`Impact query failed for symbol '${symbol}'`);
  }
  return res.json();
}

/**
 * Ask deep agent workflow a technical question.
 */
export async function askQuestion(repoId, question) {
  const res = await fetch(`${CONFIG.apiUrl}/repos/${repoId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Query failed" }));
    throw new Error(err.detail || "Agent question answering failed");
  }
  return res.json();
}

export const api = {
  indexRepo,
  getRepoStatus,
  getRepoGraph,
  getGraph: getRepoGraph,
  getNodeDetails,
  getNode: getNodeDetails,
  getSymbolImpact,
  getImpact: getSymbolImpact,
  askQuestion,
  ask: askQuestion,
};

export default api;
