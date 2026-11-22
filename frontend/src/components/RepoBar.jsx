import React, { useState } from 'react';

/**
 * RepoLens — RepoBar
 * Repository URL input and indexing trigger. Uses .rl-repobar CSS classes
 * and inline styles — no Tailwind arbitrary CSS-variable classes.
 */
export function RepoBar({ onIndexRepo, indexingStatus = 'idle', activeRepoUrl = '', className = '' }) {
  const [url, setUrl] = useState(activeRepoUrl || 'https://github.com/octocat/Hello-World');
  const [validationError, setValidationError] = useState('');

  const sampleRepos = [
    { label: 'octocat/Hello-World', url: 'https://github.com/octocat/Hello-World' },
    { label: 'pallets/flask', url: 'https://github.com/pallets/flask' },
    { label: 'expressjs/express', url: 'https://github.com/expressjs/express' },
  ];

  const isIndexing = ['cloning', 'scanning', 'parsing', 'graphing', 'summarizing'].includes(indexingStatus);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(cleanUrl)) {
      setValidationError('Must be: https://github.com/<owner>/<repo>');
      return;
    }
    setValidationError('');
    if (onIndexRepo) onIndexRepo(cleanUrl);
  };

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }} className={className}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'stretch',
          background: 'rgba(31,44,35,0.92)', backdropFilter: 'blur(12px)',
          padding: 8, border: '1px solid rgba(195,209,181,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        {/* Input area */}
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'rgba(44,62,49,0.6)', border: '1px solid rgba(195,209,181,0.18)' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>REPO //</span>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (validationError) setValidationError(''); }}
            placeholder="https://github.com/owner/repository"
            disabled={isIndexing}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'monospace', fontSize: 12, color: 'var(--ivory-50)', padding: '10px 0' }}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isIndexing}
          style={{
            padding: '10px 24px', background: isIndexing ? 'var(--forest-sage-700)' : 'var(--accent)',
            color: 'var(--ivory-50)', fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', cursor: isIndexing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', transition: 'background 0.2s',
          }}
        >
          {isIndexing ? (
            <>
              <span style={{ width: 12, height: 12, border: '2px solid var(--ivory-50)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              INDEXING ({indexingStatus.toUpperCase()})…
            </>
          ) : 'INDEX REPOSITORY'}
        </button>
      </form>

      {validationError && (
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', marginTop: 6, paddingLeft: 8 }}>
          ⚠ {validationError}
        </p>
      )}

      {/* Quick sample links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 8, paddingLeft: 4, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>QUICK PICK:</span>
        {sampleRepos.map((s) => (
          <button key={s.url} type="button" onClick={() => { setUrl(s.url); setValidationError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--pale-sage-300)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'monospace', fontSize: 10, transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--ivory-50)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--pale-sage-300)'}
          >
            {s.label}
          </button>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default RepoBar;
