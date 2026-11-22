import React from 'react';

/**
 * RepoLens — GuardrailBadge
 * Security status chip. Uses inline styles — no Tailwind arbitrary values.
 */
export function GuardrailBadge({ status = 'ok', reason = '', className = '' }) {
  const configs = {
    ok:               { label: 'SHIELD: VERIFIED',          bg: 'rgba(44,62,49,0.9)',   border: 'var(--accent)',          color: 'var(--pale-sage-200)', dot: 'var(--accent)' },
    blocked_injection:{ label: 'SHIELD: INJECTION BLOCKED', bg: 'rgba(42,14,20,0.9)',   border: 'rgba(239,68,68,0.6)',   color: '#fca5a5',              dot: '#ef4444' },
    refused:          { label: 'SHIELD: REFUSED',           bg: 'rgba(42,27,14,0.9)',   border: 'rgba(245,158,11,0.6)',  color: '#fcd34d',              dot: '#f59e0b' },
    budget:           { label: 'SHIELD: BUDGET REACHED',    bg: 'rgba(44,62,49,0.9)',   border: 'rgba(234,179,8,0.6)',   color: '#fef08a',              dot: '#eab308' },
  };

  const c = configs[status] || configs.ok;

  return (
    <div
      title={reason || c.label}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px',
        fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
        background: c.bg, border: `1px solid ${c.border}`, color: c.color,
        clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontWeight: 600 }}>{c.label}</span>
    </div>
  );
}

export default GuardrailBadge;
