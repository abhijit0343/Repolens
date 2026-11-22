import React from 'react';
import { BracketPanel } from './BracketPanel.jsx';

/**
 * RepoLens — Stats Plate HUD
 * Telemetry HUD displaying architectural density, Louvain communities,
 * traversal execution metrics, and real-time graph health.
 */
export function StatsPlate({
  density = 'HIGH (0.84)',
  modularity = '5 CLUSTERS',
  traversalTime = '6.0s LOOP',
  citationsRatio = '100% CITED',
  className = '',
}) {
  return (
    <BracketPanel
      tag="METRICS_02"
      title="TOPOLOGY STATUS"
      badge="LIVE_STREAM"
      variant="dark"
      className={`max-w-md w-full shadow-2xl border-[var(--border-muted)]/50 ${className}`}
    >
      <div className="grid grid-cols-2 gap-4 my-1">
        <div>
          <span className="text-[10px] font-mono text-[var(--pale-sage-300)] uppercase block">
            CALL PATH DENSITY
          </span>
          <span className="font-display text-xl font-bold text-[var(--ivory-50)]">
            {density}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-[var(--pale-sage-300)] uppercase block">
            LOUVAIN PARTITIONS
          </span>
          <span className="font-display text-xl font-bold text-[var(--pale-sage-200)]">
            {modularity}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-[var(--pale-sage-300)] uppercase block">
            ACTIVE TRACE
          </span>
          <span className="font-display text-xl font-bold text-[var(--accent)]">
            {traversalTime}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-[var(--pale-sage-300)] uppercase block">
            VERIFICATION RATE
          </span>
          <span className="font-display text-xl font-bold text-[var(--ivory-50)]">
            {citationsRatio}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border-muted)]/30 flex items-center justify-between text-[10px] font-mono text-[var(--pale-sage-300)]">
        <span>STATUS: 60 NODES // 120 CALLS</span>
        <span className="text-[var(--accent)] font-semibold">● SYNCHRONIZED</span>
      </div>
    </BracketPanel>
  );
}

export default StatsPlate;
