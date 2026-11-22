import React, { useState } from 'react';

/**
 * RepoLens — Repository URL Input & Indexing Bar
 * Controls target repo URL, triggers indexing, displays live pipeline status,
 * and provides quick sample repository buttons.
 */
export function RepoBar({
  onIndexRepo,
  indexingStatus = 'idle',
  activeRepoUrl = '',
  className = '',
}) {
  const [url, setUrl] = useState(activeRepoUrl || 'https://github.com/octocat/Hello-World');
  const [validationError, setValidationError] = useState('');

  const sampleRepos = [
    { label: 'octocat/Hello-World', url: 'https://github.com/octocat/Hello-World' },
    { label: 'pallets/flask', url: 'https://github.com/pallets/flask' },
    { label: 'expressjs/express', url: 'https://github.com/expressjs/express' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const githubRegex = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

    if (!githubRegex.test(cleanUrl)) {
      setValidationError('Must be in format: https://github.com/<owner>/<repo>');
      return;
    }

    setValidationError('');
    if (onIndexRepo) {
      onIndexRepo(cleanUrl);
    }
  };

  const isIndexing = ['cloning', 'scanning', 'parsing', 'graphing', 'summarizing'].includes(indexingStatus);

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch gap-2 bg-[var(--surface-black)]/90 backdrop-blur-md p-2 border border-[var(--border-muted)]/40 shadow-xl"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        <div className="flex-1 flex items-center gap-2 px-3 bg-[var(--surface-dark)]/80 border border-[var(--border-muted)]/20">
          <span className="font-mono text-xs text-[var(--accent)] font-bold">REPO //</span>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="https://github.com/owner/repository"
            className="w-full py-2.5 bg-transparent font-mono text-xs text-[var(--ivory-50)] placeholder-[var(--pale-sage-300)]/40 focus:outline-none"
            disabled={isIndexing}
          />
        </div>

        <button
          type="submit"
          disabled={isIndexing}
          className="px-6 py-2.5 font-mono text-xs uppercase font-bold tracking-wider bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--ivory-50)] transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 shadow"
        >
          {isIndexing ? (
            <>
              <span className="w-3 h-3 border-2 border-[var(--ivory-50)] border-t-transparent rounded-full animate-spin" />
              <span>INDEXING ({indexingStatus.toUpperCase()})...</span>
            </>
          ) : (
            <span>INDEX REPOSITORY</span>
          )}
        </button>
      </form>

      {/* Validation Alert */}
      {validationError && (
        <p className="text-[11px] font-mono text-red-400 mt-1.5 pl-2">
          ⚠ {validationError}
        </p>
      )}

      {/* Quick Sample Links */}
      <div className="flex items-center gap-2 mt-2 px-1 text-[10px] font-mono text-[var(--pale-sage-300)]">
        <span className="text-[var(--accent)]">QUICK PICK:</span>
        {sampleRepos.map((sample) => (
          <button
            key={sample.url}
            type="button"
            onClick={() => {
              setUrl(sample.url);
              setValidationError('');
            }}
            className="hover:text-[var(--ivory-50)] underline underline-offset-2 transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RepoBar;
