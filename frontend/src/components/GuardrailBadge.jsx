import React from 'react';

/**
 * RepoLens — Guardrail Status Badge
 * Visual indicator displaying security and verification status:
 * 'ok', 'blocked_injection', 'refused', 'budget'.
 */
export function GuardrailBadge({ status = 'ok', reason = '', className = '' }) {
  const configs = {
    ok: {
      label: 'SHIELD: VERIFIED',
      bg: 'bg-[var(--surface-dark)]',
      border: 'border-[var(--accent)]',
      text: 'text-[var(--pale-sage-200)]',
      dot: 'bg-[var(--accent)]',
    },
    blocked_injection: {
      label: 'SHIELD: INJECTION BLOCKED',
      bg: 'bg-[#2a0e14]',
      border: 'border-red-500/60',
      text: 'text-red-300',
      dot: 'bg-red-500',
    },
    refused: {
      label: 'SHIELD: REFUSED (UNSAFE)',
      bg: 'bg-[#2a1b0e]',
      border: 'border-amber-500/60',
      text: 'text-amber-300',
      dot: 'bg-amber-500',
    },
    budget: {
      label: 'SHIELD: BUDGET REACHED',
      bg: 'bg-[var(--surface-dark)]',
      border: 'border-yellow-500/60',
      text: 'text-yellow-200',
      dot: 'bg-yellow-400',
    },
  };

  const current = configs[status] || configs.ok;

  return (
    <div
      title={reason || current.label}
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono border tracking-wider uppercase ${current.bg} ${current.border} ${current.text} ${className}`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${status === 'ok' ? 'animate-pulse' : ''}`} />
      <span className="font-semibold">{current.label}</span>
    </div>
  );
}

export default GuardrailBadge;
