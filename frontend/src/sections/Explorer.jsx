import React, { useEffect, useRef, useState } from 'react';
import { RepoBar } from '../components/RepoBar.jsx';
import { NodePanel } from '../components/NodePanel.jsx';
import { ChatDock } from '../components/ChatDock.jsx';
import { GraphScene } from '../three/GraphScene.js';
import { api } from '../lib/api.js';

/**
 * RepoLens — Explorer Section
 * Uses .rl-explorer CSS classes + inline styles for all structural dark backgrounds.
 * No Tailwind arbitrary CSS-variable classes.
 */
export function Explorer({ onRepoIndexed }) {
  const canvasContainerRef = useRef(null);
  const sceneRef = useRef(null);

  const [activeRepoId, setActiveRepoId] = useState('demo-repo');
  const [indexingStatus, setIndexingStatus] = useState('ready');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const indexingStages = ['cloning', 'scanning', 'parsing', 'graphing', 'summarizing'];

  // Load graph data on mount or repo switch
  useEffect(() => {
    let active = true;
    async function loadData() {
      let data = null;
      try { data = await api.getGraph(activeRepoId); } catch (e) { /* fallback */ }
      if (!data) {
        try { const res = await fetch('/mock/graph.json'); if (res.ok) data = await res.json(); } catch { /* ignore */ }
      }
      if (active && data && sceneRef.current) sceneRef.current.loadGraph(data);
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
        try { const full = await api.getNode(activeRepoId, node.id); if (full) details = { ...node, ...full }; } catch { /* ignore */ }
        setSelectedNode(details);
        setActiveTab('node');
      },
    });
    sceneRef.current = scene;
    return () => { scene.destroy(); sceneRef.current = null; };
  }, [activeRepoId]);

  const handleIndexRepo = async (repoUrl) => {
    setIndexingStatus('cloning');
    try {
      const res = await api.indexRepo(repoUrl);
      if (res && res.repo_id) {
        const repoId = res.repo_id;
        setActiveRepoId(repoId);
        const poll = setInterval(async () => {
          try {
            const s = await api.getRepoStatus(repoId);
            setIndexingStatus(s.status);
            if (s.status === 'ready' || s.status === 'error') {
              clearInterval(poll);
              if (onRepoIndexed) onRepoIndexed(repoId);
            }
          } catch { clearInterval(poll); setIndexingStatus('ready'); }
        }, 1500);
      }
    } catch { setTimeout(() => setIndexingStatus('ready'), 1000); }
  };

  const handleShowImpact = async (symbol) => {
    setLoadingImpact(true);
    try {
      const impact = await api.getImpact(activeRepoId, symbol);
      if (impact && sceneRef.current) {
        sceneRef.current.setHighlightNodes(
          [selectedNode?.id],
          (impact.upstream || []).map(i => i.id || i),
          (impact.downstream || []).map(i => i.id || i)
        );
      }
    } catch {
      if (sceneRef.current && selectedNode) {
        sceneRef.current.setHighlightNodes([selectedNode.id], ['app/main.py::lifespan'], ['rag/retriever.py::query_vectorstore']);
      }
    } finally { setLoadingImpact(false); }
  };

  const handleCitationClick = (citation) => {
    if (!sceneRef.current) return;
    let targetNode = null;
    sceneRef.current.nodeMeshes.forEach((mesh) => {
      if (mesh.userData.path === citation.path || mesh.userData.id.includes(citation.path)) targetNode = mesh.userData;
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
      if (nodeIds.length > 0) sceneRef.current.focusOnNode(nodeIds[0]);
    }
  };

  const isIndexing = indexingStages.includes(indexingStatus);
  const mono = { fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' };

  return (
    <section id="explorer" style={{ position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-black)', color: 'var(--ivory-50)', overflow: 'hidden' }}>

      {/* Top bar: RepoBar + indexing strip */}
      <div style={{ position: 'relative', zIndex: 20, paddingTop: 96, paddingBottom: 16, paddingLeft: 24, paddingRight: 24, background: 'linear-gradient(to bottom, var(--surface-black) 60%, transparent)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <RepoBar onIndexRepo={handleIndexRepo} indexingStatus={indexingStatus} />

          {/* Indexing strip */}
          {isIndexing && (
            <div style={{ width: '100%', maxWidth: 720, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--surface-dark)', border: '1px solid var(--accent)', ...mono }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 12 }}>PIPELINE:</span>
              {indexingStages.map((stage, idx) => {
                const isCurrent = indexingStatus === stage;
                const isPast = indexingStages.indexOf(indexingStatus) > idx;
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: isCurrent ? 'var(--accent)' : isPast ? 'var(--ivory-50)' : 'rgba(195,209,181,0.3)' }} />
                    <span style={{ color: isCurrent ? 'var(--ivory-50)' : isPast ? 'var(--pale-sage-200)' : 'rgba(195,209,181,0.3)', fontWeight: isCurrent ? 700 : 400 }}>
                      {stage.toUpperCase()}
                    </span>
                    {idx < indexingStages.length - 1 && <span style={{ color: 'rgba(195,209,181,0.3)', margin: '0 2px' }}>→</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3D Graph canvas — absolute fill */}
      <div
        ref={canvasContainerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, cursor: 'grab' }}
        aria-label="3D Code Knowledge Graph Viewport"
      />

      {/* Hovered node tooltip */}
      {hoveredNode && !selectedNode && (
        <div style={{ position: 'fixed', bottom: 48, left: 32, zIndex: 30, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'rgba(31,44,35,0.92)', border: '1px solid var(--accent)', backdropFilter: 'blur(8px)', ...mono }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          <span style={{ color: 'var(--pale-sage-300)' }}>[{hoveredNode.type}]</span>
          <span style={{ fontWeight: 700, color: 'var(--ivory-50)' }}>{hoveredNode.label}</span>
          <span style={{ color: 'var(--pale-sage-400)' }}>{hoveredNode.path}</span>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ position: 'fixed', top: 80, left: 24, zIndex: 30, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(31,44,35,0.92)', padding: 4, border: '1px solid rgba(195,209,181,0.3)' }}>
        {[{ id: 'chat', label: 'AGENT DOCK' }, { id: 'node', label: `NODE INSPECTOR${selectedNode ? ` (${selectedNode.label})` : ''}` }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '4px 12px', ...mono, fontSize: 10, background: activeTab === tab.id ? 'var(--accent)' : 'none', color: activeTab === tab.id ? 'var(--ivory-50)' : 'var(--pale-sage-300)', border: 'none', cursor: 'pointer', fontWeight: activeTab === tab.id ? 700 : 400, transition: 'all 0.2s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Node panel */}
      {activeTab === 'node' && selectedNode && (
        <NodePanel
          node={selectedNode}
          onClose={() => { setSelectedNode(null); setActiveTab('chat'); if (sceneRef.current) sceneRef.current.setHighlightNodes(); }}
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

      {/* Chat dock */}
      {activeTab === 'chat' && (
        <ChatDock repoId={activeRepoId} onCitationClick={handleCitationClick} onHighlightNodes={handleHighlightNodes} />
      )}

      {/* Controls legend */}
      <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px', background: 'rgba(44,62,49,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(195,209,181,0.2)', ...mono, fontSize: 10, color: 'var(--pale-sage-300)' }}>
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
