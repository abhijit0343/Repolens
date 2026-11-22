import React, { useEffect, useRef, useState } from 'react';
import { RepoBar } from '../components/RepoBar.jsx';
import { NodePanel } from '../components/NodePanel.jsx';
import { ChatDock } from '../components/ChatDock.jsx';
import { GraphScene } from '../three/GraphScene.js';
import { api } from '../lib/api.js';

/**
 * RepoLens — Explorer Section (Part 2)
 * Interactive 3D Graph Exploration viewport hosting RepoBar, 5-stage indexing strip,
 * Three.js GraphScene, NodePanel inspector, and ChatDock with citations.
 */
export function Explorer({ onRepoIndexed }) {
  const canvasContainerRef = useRef(null);
  const sceneRef = useRef(null);

  const [activeRepoId, setActiveRepoId] = useState('demo-repo');
  const [indexingStatus, setIndexingStatus] = useState('ready');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'node'

  const indexingStages = ['cloning', 'scanning', 'parsing', 'graphing', 'summarizing'];

  // Load Graph Data on Mount or Repo Switch
  useEffect(() => {
    let active = true;

    async function loadData() {
      let data = null;
      try {
        data = await api.getGraph(activeRepoId);
      } catch (e) {
        console.warn('[Explorer] API getGraph fallback to mock graph:', e);
      }

      if (!data) {
        try {
          const res = await fetch('/mock/graph.json');
          if (res.ok) data = await res.json();
        } catch (err) {
          console.error('[Explorer] Failed to load mock graph:', err);
        }
      }

      if (active && data && sceneRef.current) {
        sceneRef.current.loadGraph(data);
      }
    }

    loadData();
    return () => { active = false; };
  }, [activeRepoId]);

  // Mount GraphScene
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new GraphScene(canvasContainerRef.current, {
      onNodeHover: (node) => setHoveredNode(node),
      onNodeClick: async (node) => {
        let details = node;
        try {
          const full = await api.getNode(activeRepoId, node.id);
          if (full) details = { ...node, ...full };
        } catch (e) {
          // Keep node as is
        }
        setSelectedNode(details);
        setActiveTab('node');
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [activeRepoId]);

  // Handle Indexing a new repo
  const handleIndexRepo = async (repoUrl) => {
    setIndexingStatus('cloning');
    try {
      const res = await api.indexRepo(repoUrl);
      if (res && res.repo_id) {
        const repoId = res.repo_id;
        setActiveRepoId(repoId);

        // Poll status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await api.getRepoStatus(repoId);
            setIndexingStatus(statusRes.status);
            if (statusRes.status === 'ready' || statusRes.status === 'error') {
              clearInterval(pollInterval);
              if (onRepoIndexed) onRepoIndexed(repoId);
            }
          } catch (e) {
            clearInterval(pollInterval);
            setIndexingStatus('ready');
          }
        }, 1500);
      }
    } catch (err) {
      console.warn('[Explorer] Indexing error, falling back to mock mode:', err);
      setTimeout(() => setIndexingStatus('ready'), 1000);
    }
  };

  // Handle Impact Analysis
  const handleShowImpact = async (symbol) => {
    setLoadingImpact(true);
    try {
      const impact = await api.getImpact(activeRepoId, symbol);
      if (impact && sceneRef.current) {
        const upstream = (impact.upstream || []).map(item => item.id || item);
        const downstream = (impact.downstream || []).map(item => item.id || item);
        sceneRef.current.setHighlightNodes([selectedNode?.id], upstream, downstream);
      }
    } catch (err) {
      console.warn('[Explorer] Impact calculation error:', err);
      if (sceneRef.current && selectedNode) {
        sceneRef.current.setHighlightNodes(
          [selectedNode.id],
          ['app/main.py::lifespan'],
          ['rag/retriever.py::query_vectorstore']
        );
      }
    } finally {
      setLoadingImpact(false);
    }
  };

  // Handle Citation Chip Click: focus camera and highlight node
  const handleCitationClick = (citation) => {
    if (!sceneRef.current) return;
    const targetPath = citation.path;

    // Search for matching node by path or label
    let targetNode = null;
    sceneRef.current.nodeMeshes.forEach((mesh) => {
      if (mesh.userData.path === targetPath || mesh.userData.id.includes(targetPath)) {
        targetNode = mesh.userData;
      }
    });

    if (targetNode) {
      sceneRef.current.focusOnNode(targetNode.id);
      sceneRef.current.setHighlightNodes([targetNode.id]);
      setSelectedNode(targetNode);
      setActiveTab('node');
    }
  };

  const handleHighlightNodes = (nodeIds) => {
    if (sceneRef.current) {
      sceneRef.current.setHighlightNodes(nodeIds);
      if (nodeIds.length > 0) {
        sceneRef.current.focusOnNode(nodeIds[0]);
      }
    }
  };

  const isIndexing = indexingStages.includes(indexingStatus);

  return (
    <section
      id="explorer"
      className="relative min-h-screen w-full flex flex-col bg-[var(--surface-black)] text-[var(--ivory-50)] overflow-hidden"
    >
      {/* Top Header: RepoBar & Indexing Progression Strip */}
      <div className="relative z-20 pt-24 pb-4 px-6 bg-gradient-to-b from-[var(--surface-black)] via-[var(--surface-black)]/80 to-transparent pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
          <RepoBar
            onIndexRepo={handleIndexRepo}
            indexingStatus={indexingStatus}
          />

          {/* 5-Step Horizontal Indexing Progression Strip */}
          {isIndexing && (
            <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 bg-[var(--surface-dark)]/90 border border-[var(--accent)] text-[10px] font-mono animate-pulse">
              <span className="text-[var(--accent)] font-bold">PIPELINE:</span>
              {indexingStages.map((stage, idx) => {
                const isCurrent = indexingStatus === stage;
                const isPast = indexingStages.indexOf(indexingStatus) > idx;
                return (
                  <div key={stage} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-[var(--accent)] animate-ping' : isPast ? 'bg-[var(--ivory-50)]' : 'bg-[var(--border-muted)]'}`} />
                    <span className={isCurrent ? 'text-[var(--ivory-50)] font-bold' : isPast ? 'text-[var(--pale-sage-200)]' : 'text-[var(--pale-sage-300)]/40'}>
                      {stage.toUpperCase()}
                    </span>
                    {idx < indexingStages.length - 1 && <span className="text-[var(--border-muted)]">→</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3D Graph Canvas Viewport */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
        aria-label="3D Code Knowledge Graph Viewport"
      />

      {/* Hovered Node Tooltip HUD */}
      {hoveredNode && !selectedNode && (
        <div className="fixed bottom-12 left-8 z-30 pointer-events-none bg-[var(--surface-black)]/90 backdrop-blur-md px-4 py-2 border border-[var(--accent)] text-xs font-mono shadow-xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[var(--pale-sage-300)] uppercase">[{hoveredNode.type}]</span>
          <span className="font-semibold text-[var(--ivory-50)]">{hoveredNode.label}</span>
          <span className="text-[var(--pale-sage-400)]">{hoveredNode.path}</span>
        </div>
      )}

      {/* Tab Switcher on mobile/desktop to toggle between Chat and Node Inspector */}
      <div className="fixed top-24 left-6 z-30 flex items-center gap-1 bg-[var(--surface-black)]/90 p-1 border border-[var(--border-muted)]/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors ${activeTab === 'chat' ? 'bg-[var(--accent)] text-[var(--ivory-50)] font-bold' : 'text-[var(--pale-sage-300)] hover:text-[var(--ivory-50)]'}`}
        >
          AGENT DOCK
        </button>
        <button
          onClick={() => setActiveTab('node')}
          className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors ${activeTab === 'node' ? 'bg-[var(--accent)] text-[var(--ivory-50)] font-bold' : 'text-[var(--pale-sage-300)] hover:text-[var(--ivory-50)]'}`}
        >
          NODE INSPECTOR {selectedNode ? `(${selectedNode.label})` : ''}
        </button>
      </div>

      {/* Selected Node Details Drawer */}
      {activeTab === 'node' && selectedNode && (
        <NodePanel
          node={selectedNode}
          onClose={() => {
            setSelectedNode(null);
            setActiveTab('chat');
            if (sceneRef.current) sceneRef.current.setHighlightNodes();
          }}
          onSelectNode={(nodeId) => {
            if (sceneRef.current) {
              sceneRef.current.focusOnNode(nodeId);
              const mesh = sceneRef.current.nodeMeshes.get(nodeId);
              if (mesh) setSelectedNode(mesh.userData);
            }
          }}
          onShowImpact={handleShowImpact}
          loadingImpact={loadingImpact}
        />
      )}

      {/* Chat Dock */}
      {activeTab === 'chat' && (
        <ChatDock
          repoId={activeRepoId}
          onCitationClick={handleCitationClick}
          onHighlightNodes={handleHighlightNodes}
        />
      )}

      {/* Bottom Controls Legend */}
      <div className="absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-4 text-[10px] font-mono text-[var(--pale-sage-300)] bg-[var(--surface-dark)]/60 backdrop-blur-md px-4 py-1.5 border border-[var(--border-muted)]/30">
        <span>ROTATE: LEFT DRAG</span>
        <span>•</span>
        <span>PAN: RIGHT DRAG</span>
        <span>•</span>
        <span>ZOOM: WHEEL</span>
        <span>•</span>
        <span>INSPECT: CLICK NODE</span>
      </div>
    </section>
  );
}

export default Explorer;
