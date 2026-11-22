import React from 'react';
import { BracketPanel } from './BracketPanel.jsx';

/**
 * RepoLens — NodePanel (Node Inspector HUD)
 * Uses inline styles for all structural styling — no Tailwind arbitrary CSS-variable classes.
 */
export function NodePanel({ node, onClose, onSelectNode, onShowImpact, loadingImpact = false, className = '' }) {
  if (!node) return null;

  const mono = { fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em' };

  const callerBtn = (c, arrow) => (
    <button key={c} onClick={() => onSelectNode && onSelectNode(c)}
      style={{ ...mono, fontSize: 10, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--pale-sage-200)', background: 'rgba(44,62,49,0.6)', border: 'none', cursor: 'pointer', padding: '2px 6px', transition: 'color 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pale-sage-200)'}
    >
      {arrow} {c}
    </button>
  );

  return (
    <div style={{ position: 'fixed', top: 96, right: 24, width: 384, maxWidth: 'calc(100vw - 48px)', zIndex: 30 }} className={className}>
      <BracketPanel
        tag={`NODE_${node.type?.toUpperCase() || 'SYMBOL'}`}
        title={node.label || 'Node Details'}
        badge={node.type}
        variant="dark"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', background: 'rgba(31,44,35,0.95)' }}
      >
        {/* Close */}
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pale-sage-300)', ...mono }} onMouseEnter={(e) => e.target.style.color = 'var(--ivory-50)'} onMouseLeave={(e) => e.target.style.color = 'var(--pale-sage-300)'}>✕</button>

        {/* Path + lines */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(195,209,181,0.15)', ...mono }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8, color: 'var(--ivory-50)' }}>{node.path || 'unknown.py'}</span>
          <span style={{ flexShrink: 0, color: 'var(--accent)', fontWeight: 600 }}>L{node.start_line ?? 1}:{node.end_line ?? 1}</span>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', ...mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--pale-sage-300)', marginBottom: 6 }}>AST SUMMARY</span>
          <p style={{ fontSize: 12, color: 'var(--pale-sage-200)', lineHeight: 1.6, background: 'rgba(44,62,49,0.5)', padding: '10px 12px', border: '1px solid rgba(195,209,181,0.18)' }}>
            {node.summary || 'Symbol indexed via Tree-Sitter AST parser with internal call resolution.'}
          </p>
        </div>

        {/* Code snippet */}
        {node.code_snippet && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: 'block', ...mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--pale-sage-300)', marginBottom: 6 }}>SOURCE CODE</span>
            <pre style={{ ...mono, fontSize: 11, color: 'var(--ivory-50)', background: 'var(--surface-dark)', padding: '10px 12px', overflowX: 'auto', maxHeight: 144, border: '1px solid rgba(195,209,181,0.2)', margin: 0 }}>
              <code>{node.code_snippet}</code>
            </pre>
          </div>
        )}

        {/* Callers / Callees */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <div>
            <span style={{ display: 'block', ...mono, fontSize: 10, textTransform: 'uppercase', color: 'var(--pale-sage-300)', marginBottom: 4 }}>CALLERS ({node.callers?.length || 0})</span>
            <div style={{ maxHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {node.callers?.length > 0 ? node.callers.map((c) => callerBtn(c, '←')) : <span style={{ fontSize: 10, color: 'rgba(195,209,181,0.4)', fontStyle: 'italic' }}>None</span>}
            </div>
          </div>
          <div>
            <span style={{ display: 'block', ...mono, fontSize: 10, textTransform: 'uppercase', color: 'var(--pale-sage-300)', marginBottom: 4 }}>CALLEES ({node.callees?.length || 0})</span>
            <div style={{ maxHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {node.callees?.length > 0 ? node.callees.map((c) => callerBtn(c, '→')) : <span style={{ fontSize: 10, color: 'rgba(195,209,181,0.4)', fontStyle: 'italic' }}>None</span>}
            </div>
          </div>
        </div>

        {/* Impact button */}
        <button
          onClick={() => onShowImpact && onShowImpact(node.label || node.id)}
          disabled={loadingImpact}
          style={{
            width: '100%', padding: '10px', ...mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            background: loadingImpact ? 'var(--forest-sage-700)' : 'var(--accent)',
            color: 'var(--ivory-50)', border: 'none', cursor: loadingImpact ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        >
          {loadingImpact
            ? <><span style={{ width: 10, height: 10, border: '2px solid var(--ivory-50)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />CALCULATING IMPACT…</>
            : <>⚡ ANALYZE BLAST RADIUS</>
          }
        </button>
      </BracketPanel>
    </div>
  );
}

export default NodePanel;
