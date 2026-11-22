import React from 'react';
import { BracketPanel } from './BracketPanel.jsx';

/**
 * RepoLens — Node Inspector HUD Panel
 * Stepped-corner modal drawer showing node details, AST summary,
 * syntax code snippet, callers/callees list, and Impact Analysis button.
 */
export function NodePanel({
  node,
  onClose,
  onSelectNode,
  onShowImpact,
  loadingImpact = false,
  className = '',
}) {
  if (!node) return null;

  return (
    <div
      className={`fixed top-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-30 animate-in fade-in slide-in-from-right-4 duration-300 ${className}`}
    >
      <BracketPanel
        tag={`NODE_${node.type?.toUpperCase() || 'SYMBOL'}`}
        title={node.label || 'Node Details'}
        badge={node.type}
        variant="dark"
        className="shadow-2xl border-[var(--border-muted)]/60 bg-[var(--surface-black)]/95 backdrop-blur-lg"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--pale-sage-300)] hover:text-[var(--ivory-50)] text-sm font-mono"
          aria-label="Close Inspector"
        >
          ✕
        </button>

        {/* File Path & Line Numbers */}
        <div className="mb-3 text-[11px] font-mono text-[var(--pale-sage-300)] flex items-center justify-between border-b border-[var(--border-muted)]/20 pb-2">
          <span className="truncate mr-2 text-[var(--ivory-50)]">
            {node.path || 'unknown.py'}
          </span>
          <span className="shrink-0 text-[var(--accent)] font-semibold">
            L{node.start_line ?? 1}:{node.end_line ?? 1}
          </span>
        </div>

        {/* Node Summary */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--pale-sage-300)] block mb-1">
            AST SUMMARY
          </span>
          <p className="text-xs text-[var(--pale-sage-200)] leading-relaxed bg-[var(--surface-dark)]/60 p-2.5 border border-[var(--border-muted)]/30">
            {node.summary || 'Symbol indexed via Tree-Sitter AST parser with internal call resolution.'}
          </p>
        </div>

        {/* Code Snippet */}
        {node.code_snippet && (
          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--pale-sage-300)] block mb-1">
              SOURCE CODE
            </span>
            <pre className="text-[11px] font-mono text-[var(--ivory-50)] bg-[var(--surface-dark)] p-2.5 overflow-x-auto max-h-36 border border-[var(--border-muted)]/40 rounded-none">
              <code>{node.code_snippet}</code>
            </pre>
          </div>
        )}

        {/* Callers & Callees */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] font-mono">
          <div>
            <span className="text-[10px] uppercase text-[var(--pale-sage-300)] block mb-1">
              CALLERS ({node.callers?.length || 0})
            </span>
            <div className="max-h-20 overflow-y-auto flex flex-col gap-1 pr-1">
              {node.callers && node.callers.length > 0 ? (
                node.callers.map((c) => (
                  <button
                    key={c}
                    onClick={() => onSelectNode && onSelectNode(c)}
                    className="text-left truncate text-[10px] text-[var(--pale-sage-200)] hover:text-[var(--accent)] bg-[var(--surface-dark)] px-1.5 py-0.5"
                  >
                    ← {c}
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-[var(--pale-sage-300)]/60 italic">None</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase text-[var(--pale-sage-300)] block mb-1">
              CALLEES ({node.callees?.length || 0})
            </span>
            <div className="max-h-20 overflow-y-auto flex flex-col gap-1 pr-1">
              {node.callees && node.callees.length > 0 ? (
                node.callees.map((c) => (
                  <button
                    key={c}
                    onClick={() => onSelectNode && onSelectNode(c)}
                    className="text-left truncate text-[10px] text-[var(--pale-sage-200)] hover:text-[var(--accent)] bg-[var(--surface-dark)] px-1.5 py-0.5"
                  >
                    → {c}
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-[var(--pale-sage-300)]/60 italic">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Impact Analysis Action */}
        <button
          onClick={() => onShowImpact && onShowImpact(node.label || node.id)}
          disabled={loadingImpact}
          className="w-full py-2.5 font-mono text-xs uppercase font-bold tracking-wider bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--ivory-50)] transition-all shadow-md flex items-center justify-center gap-2"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        >
          {loadingImpact ? (
            <>
              <span className="w-2.5 h-2.5 border-2 border-[var(--ivory-50)] border-t-transparent rounded-full animate-spin" />
              <span>CALCULATING IMPACT...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>ANALYZE BLAST RADIUS</span>
            </>
          )}
        </button>
      </BracketPanel>
    </div>
  );
}

export default NodePanel;
