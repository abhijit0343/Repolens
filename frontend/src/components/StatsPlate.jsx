import React from 'react';
import { BracketPanel } from './BracketPanel.jsx';

/**
 * RepoLens — StatsPlate HUD
 * Telemetry metrics panel. Uses inline styles for color tokens.
 */
export function StatsPlate({
  density = 'HIGH (0.84)',
  modularity = '5 CLUSTERS',
  traversalTime = '6.0s LOOP',
  citationsRatio = '100% CITED',
  className = '',
}) {
  const cell = (label, value, color = 'var(--ivory-50)') => (
    <div>
      <span style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--pale-sage-300)', marginBottom: 4 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  );

  return (
    <BracketPanel tag="METRICS_02" title="TOPOLOGY STATUS" badge="LIVE_STREAM" variant="dark" className={className}
      style={{ maxWidth: 400, width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '4px 0' }}>
        {cell('Call Path Density', density)}
        {cell('Louvain Partitions', modularity, 'var(--pale-sage-200)')}
        {cell('Active Trace', traversalTime, 'var(--accent)')}
        {cell('Verification Rate', citationsRatio)}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(195,209,181,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10, color: 'var(--pale-sage-300)' }}>
        <span>STATUS: 60 NODES // 120 CALLS</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>● SYNCHRONIZED</span>
      </div>
    </BracketPanel>
  );
}

export default StatsPlate;
