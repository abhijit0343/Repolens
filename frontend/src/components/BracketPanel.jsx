import React from 'react';

/**
 * RepoLens — Technical HUD Bracket Panel
 * Renders chamfered / bracket-corner panels inspired by technical telemetry displays.
 */
export function BracketPanel({
  title,
  badge,
  tag = 'SYS_01',
  children,
  className = '',
  variant = 'dark', // 'dark' | 'glass' | 'muted'
}) {
  const bgStyles = {
    dark: 'bg-[var(--surface-dark)] text-[var(--foreground-on-dark)] border-[var(--border-muted)]',
    glass: 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--foreground)] border-[var(--glass-border)]',
    muted: 'bg-[var(--surface-muted)] text-[var(--foreground)] border-[var(--border-muted)]',
  }[variant];

  return (
    <div
      className={`relative p-5 border transition-all duration-300 ${bgStyles} ${className}`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}
    >
      {/* Corner Brackets */}
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[var(--accent)] pointer-events-none" />
      <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[var(--accent)] pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[var(--accent)] pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--accent)] pointer-events-none" />

      {/* Header bar */}
      {(title || badge) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-muted)] border-opacity-30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest font-mono text-[var(--accent)] uppercase font-semibold">
              [{tag}]
            </span>
            {title && (
              <h4 className="text-xs font-semibold tracking-wider uppercase font-mono">
                {title}
              </h4>
            )}
          </div>
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-black)] text-[var(--pale-sage-200)] border border-[var(--border-muted)] border-opacity-40 tracking-wider">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-sm">
        {children}
      </div>
    </div>
  );
}

export default BracketPanel;
