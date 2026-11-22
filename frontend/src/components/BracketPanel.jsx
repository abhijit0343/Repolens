import React from 'react';

/**
 * RepoLens — BracketPanel
 * Technical HUD panel with chamfered corners. Uses .rl-bracket CSS classes
 * from layout.css — no Tailwind arbitrary CSS-variable classes.
 */
export function BracketPanel({
  title,
  badge,
  tag = 'SYS_01',
  children,
  className = '',
  style = {},
  variant = 'dark', // 'dark' | 'glass' | 'muted'
}) {
  return (
    <div
      className={`rl-bracket rl-bracket--${variant} ${className}`}
      style={style}
    >
      {/* Corner ticks */}
      <span className="rl-bracket__corner rl-bracket__corner--tl" />
      <span className="rl-bracket__corner rl-bracket__corner--tr" />
      <span className="rl-bracket__corner rl-bracket__corner--bl" />
      <span className="rl-bracket__corner rl-bracket__corner--br" />

      {/* Header */}
      {(title || badge || tag) && (
        <div className="rl-bracket__header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="rl-bracket__tag">[{tag}]</span>
            {title && (
              <span className="rl-bracket__title">{title}</span>
            )}
          </div>
          {badge && (
            <span className="rl-bracket__badge">{badge}</span>
          )}
        </div>
      )}

      <div className="rl-bracket__content">
        {children}
      </div>
    </div>
  );
}

export default BracketPanel;
