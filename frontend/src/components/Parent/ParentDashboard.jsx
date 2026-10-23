import React, { useEffect, useMemo, useState } from 'react';
import './ParentDashboard.css';

const TOKEN_KEY = 'kinderlens_parent_token';

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function ParentDashboard({ onClose }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [pin, setPin] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('highlights');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadHistory = async () => {
      setIsLoading(true);
      setError('');
      setNotice('');
      try {
        const response = await fetch('/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Could not load history.');
        }
        setHistory(data.history || []);
      } catch (loadError) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [token]);

  const identified = useMemo(
    () => history.filter((entry) => entry.outcome === 'identified'),
    [history]
  );
  const unsafe = useMemo(
    () => history.filter((entry) => entry.outcome === 'unsafe'),
    [history]
  );
  const quizzes = useMemo(
    () => history.filter((entry) => entry.activityType === 'quiz' || entry.outcome === 'quiz'),
    [history]
  );

  const unlock = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/parent/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not unlock parent access.');
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPin('');
    } catch (unlockError) {
      setError(unlockError.message);
    }
  };

  const lock = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setHistory([]);
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this learning entry? This cannot be undone.')) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/history/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete this entry.');
      setHistory((current) => current.filter((entry) => entry._id !== entryId));
      setNotice('The learning entry was deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const deleteAllHistory = async () => {
    if (!window.confirm('Delete all learning history? This cannot be undone.')) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete history.');
      setHistory([]);
      setNotice(`${data.deletedCount || 0} learning entries were deleted.`);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const exportHistory = async () => {
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/history/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not export history.');
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'kinderlens-history.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setNotice('Your learning history export is ready.');
    } catch (exportError) {
      setError(exportError.message);
    }
  };

  if (!token) {
    return (
      <section className="parent-card parent-gate">
        <div className="parent-heading">
          <span className="parent-icon" aria-hidden="true">🔒</span>
          <h2>Parent Area</h2>
          <p>Enter the parent PIN to view learning history.</p>
        </div>
        <form onSubmit={unlock} className="pin-form">
          <label htmlFor="parent-pin">Parent PIN</label>
          <input
            id="parent-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            required
            aria-describedby={error ? 'parent-error' : undefined}
          />
          {error && <p id="parent-error" className="parent-error" role="alert">{error}</p>}
          <button type="submit" className="parent-primary-button">Unlock Dashboard</button>
        </form>
        <button type="button" className="parent-link-button" onClick={onClose}>Back to KinderLens</button>
      </section>
    );
  }

  return (
    <section className="parent-card">
      <div className="parent-topbar">
        <div>
          <span className="eyebrow">Parent view</span>
          <h2>Learning Journal</h2>
        </div>
        {error && <p className="parent-error" role="alert">{error}</p>}
        {notice && <p className="parent-notice" role="status">{notice}</p>}
        <div className="parent-actions">
          <button type="button" className="parent-link-button" onClick={lock}>Lock</button>
          <button type="button" className="parent-link-button" onClick={onClose}>Child view</button>
        </div>
      </div>

      <nav className="parent-tabs" aria-label="Parent dashboard sections">
        <button type="button" className={activeTab === 'highlights' ? 'active' : ''} onClick={() => setActiveTab('highlights')}>Weekly Highlights</button>
        <button type="button" className={activeTab === 'journal' ? 'active' : ''} onClick={() => setActiveTab('journal')}>Learning Journal</button>
        <button type="button" className={activeTab === 'safety' ? 'active' : ''} onClick={() => setActiveTab('safety')}>Safety &amp; Controls</button>
      </nav>

      {isLoading ? <p className="parent-muted">Loading learning history...</p> : (
        <>
          {activeTab === 'highlights' && (
            <div className="parent-section">
              <div className="highlight-grid">
                <div><strong>{identified.length}</strong><span>Objects explored</span></div>
                <div><strong>{history.length}</strong><span>Total interactions</span></div>
                <div><strong>{unsafe.length}</strong><span>Safety flags</span></div>
                <div><strong>{quizzes.length}</strong><span>Quizzes started</span></div>
              </div>
              <h3>Recent discoveries</h3>
              {identified.length === 0 ? <p className="parent-muted">No identified discoveries yet.</p> : (
                <ul className="discovery-list">
                  {identified.slice(0, 5).map((entry) => (
                    <li key={entry._id}>
                      <div><strong>{entry.objectName}</strong><span>{formatDate(entry.createdAt)}</span></div>
                      <p>{entry.kidSummary}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'journal' && (
            <div className="parent-section">
              {history.length === 0 ? <p className="parent-muted">The journal is empty.</p> : (
                <ul className="journal-list">
                  {history.map((entry) => (
                    <li key={entry._id}>
                      <div className="journal-title">
                        <strong>{entry.objectName || 'Unidentified capture'}</strong>
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                      <span className={`outcome outcome-${entry.outcome}`}>{entry.outcome}</span>
                      {entry.kidSummary && <p>{entry.kidSummary}</p>}
                      {entry.activityType === 'quiz' && (
                        <p>{entry.quiz?.questionCount || 0} grounded questions generated.</p>
                      )}
                      {entry.grounding?.grounded && (
                        <a href={entry.grounding.sourceUrl} target="_blank" rel="noreferrer">
                          Verified via {entry.grounding.sourceTitle}
                        </a>
                      )}
                      {entry.readability && <small>Reading grade {entry.readability.gradeLevel}</small>}
                      <button
                        type="button"
                        className="parent-danger-button"
                        onClick={() => deleteEntry(entry._id)}
                      >
                        Delete entry
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="parent-section">
              <div className="safety-note">
                <strong>Privacy and safety</strong>
                <p>Only analyzed results are stored. Raw photos are not saved in the history database.</p>
              </div>
              <div className="privacy-actions">
                <h3>Manage history</h3>
                <p className="parent-muted">Export a copy before deleting if you want to keep a record.</p>
                <div className="parent-actions">
                  <button type="button" className="parent-primary-button" onClick={exportHistory}>
                    Export history
                  </button>
                  <button type="button" className="parent-danger-button" onClick={deleteAllHistory}>
                    Delete all history
                  </button>
                </div>
              </div>
              <h3>Flagged interactions</h3>
              {unsafe.length === 0 ? <p className="parent-muted">No safety flags recorded.</p> : (
                <ul className="journal-list">
                  {unsafe.map((entry) => (
                    <li key={entry._id}>
                      <strong>Safety-filtered capture</strong>
                      <span>{formatDate(entry.createdAt)}</span>
                      {entry.confidenceNote && <p>{entry.confidenceNote}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ParentDashboard;
