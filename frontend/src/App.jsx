import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import PhotoCapture from './components/Capture/PhotoCapture';
import ParentDashboard from './components/Parent/ParentDashboard';
import WonderList from './components/WonderList/WonderList';
import Quiz from './components/Quiz/Quiz';
import Story from './components/Story/Story';
import VocabularyText from './components/Vocabulary/VocabularyText';
import DiscoveryMap from './components/DiscoveryMap/DiscoveryMap';

export default function App() {
  const [result, setResult] = useState(null);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [language, setLanguage] = useState('english');
  const [profiles, setProfiles] = useState([]);
  const [childProfileId, setChildProfileId] = useState(
    () => localStorage.getItem('kinderlens_child_profile') || ''
  );
  const [childSessionActive, setChildSessionActive] = useState(
    () => Boolean(sessionStorage.getItem('kinderlens_child_session'))
  );
  const [childSessionName, setChildSessionName] = useState(
    () => sessionStorage.getItem('kinderlens_child_session_name') || ''
  );
  const lastChildActivity = useRef(Date.now());

  useEffect(() => {
    fetch('/api/account/profiles', { credentials: 'include' })
      .then((response) => {
        if (response.ok) return response.json();
        if ([401, 403].includes(response.status) && !sessionStorage.getItem('kinderlens_child_session')) {
          setProfiles([]);
          localStorage.removeItem('kinderlens_child_profile');
          setChildProfileId('');
        }
        return null;
      })
      .then((data) => {
        if (!data?.profiles) return;
        setProfiles(data.profiles);
        if (!data.profiles.some((profile) => profile._id === childProfileId)) {
          setChildProfileId(data.profiles[0]?._id || '');
        }
      })
      .catch(() => {});
  }, [childProfileId, showParentDashboard]);

  useEffect(() => {
    setChildSessionActive(Boolean(sessionStorage.getItem('kinderlens_child_session')));
    setChildSessionName(sessionStorage.getItem('kinderlens_child_session_name') || '');
  }, [showParentDashboard]);

  const endChildSession = () => {
    sessionStorage.removeItem('kinderlens_child_session');
    sessionStorage.removeItem('kinderlens_child_session_name');
    localStorage.removeItem('kinderlens_child_profile');
    setChildSessionActive(false);
    setChildSessionName('');
    setChildProfileId('');
    setProfiles([]);
  };

  useEffect(() => {
    if (!childSessionActive) return undefined;
    lastChildActivity.current = Date.now();
    let refreshing = false;
    const markActive = () => { lastChildActivity.current = Date.now(); };
    const markVisible = () => {
      if (document.visibilityState === 'visible') markActive();
    };
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'click'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
    document.addEventListener('visibilitychange', markVisible);

    const refreshTimer = window.setInterval(async () => {
      const recentlyActive = Date.now() - lastChildActivity.current < 2 * 60 * 1000;
      const token = sessionStorage.getItem('kinderlens_child_session');
      if (!recentlyActive || !token || refreshing) return;
      refreshing = true;
      try {
        const response = await fetch('/api/account/child-session/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.token) sessionStorage.setItem('kinderlens_child_session', data.token);
        else if (response.status === 401) {
          sessionStorage.removeItem('kinderlens_child_session');
          sessionStorage.removeItem('kinderlens_child_session_name');
          setChildSessionActive(false);
          setChildSessionName('');
          localStorage.removeItem('kinderlens_child_profile');
          setChildProfileId('');
          setProfiles([]);
        }
      } catch {
        // Keep the current token; the next active heartbeat can retry.
      } finally {
        refreshing = false;
      }
    }, 60 * 1000);

    return () => {
      window.clearInterval(refreshTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive));
      document.removeEventListener('visibilitychange', markVisible);
    };
  }, [childSessionActive]);

  const handleProfileChange = (event) => {
    const nextId = event.target.value;
    setChildProfileId(nextId);
    if (nextId) localStorage.setItem('kinderlens_child_profile', nextId);
    else localStorage.removeItem('kinderlens_child_profile');
  };

  const goHome = () => {
    setResult(null);
    setShowParentDashboard(false);
  };

  if (showParentDashboard) {
    return (
      <main className="app-shell">
        <div className="app-content">
          <ParentDashboard childProfileId={childProfileId} onClose={() => setShowParentDashboard(false)} />
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button type="button" className="brand brand-home" aria-label="Go to KinderLens home" onClick={goHome}>
          <span className="brand-mark" aria-hidden="true">🔍</span>
          <div>
            <h1>KinderLens</h1>
            <p>Small questions. Big discoveries.</p>
          </div>
        </button>
        <button type="button" className="parent-link" aria-label="Parent area" onClick={() => setShowParentDashboard(true)}>
          Parent area
        </button>
      </header>

      <div className="app-content">
        {!result ? (
          <>
            <section className="hero">
              <h2>What will we discover today?</h2>
              <p>Take a picture or choose a wonder. We&apos;ll turn curiosity into a learning adventure.</p>
            </section>

            <div className="toolbar">
              <label htmlFor="language-select">
                Learning language
                <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="english">English</option>
                  <option value="hindi">हिंदी</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </label>
              {childSessionActive ? (
                <>
                  <span className="profile-note">
                    Learning for {childSessionName || 'your saved discoveries'}
                  </span>
                  <button type="button" className="end-child-session" onClick={endChildSession}>
                    End learning session
                  </button>
                </>
              ) : profiles.length > 0 ? (
                <label htmlFor="child-profile-select">
                  Learning for
                  <select id="child-profile-select" value={childProfileId} onChange={handleProfileChange} disabled={childSessionActive}>
                    {profiles.map((profile) => (
                      <option key={profile._id} value={profile._id}>{profile.name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="profile-note">Ask a grown-up to save your discoveries</span>
              )}
            </div>

            {profiles.length === 0 && (
              <div className="setup-banner">
                <strong>Ready to start your learning trail?</strong>
                <p>A grown-up can set up a profile so your discoveries and quiz scores stay together.</p>
                <button type="button" onClick={() => setShowParentDashboard(true)}>Set up a profile</button>
              </div>
            )}

            <div className="discovery-workspace">
              <section className="capture-card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Best way to begin</span>
                    <h2>Look through your lens</h2>
                    <p>Point at one interesting thing and let&apos;s explore it together.</p>
                  </div>
                  <span className="section-icon" aria-hidden="true">📸</span>
                </div>
                <PhotoCapture onUploadSuccess={setResult} language={language} childProfileId={childProfileId} />
              </section>
              <DiscoveryMap />
            </div>
            <div className="learning-section">
              <WonderList onExplore={setResult} language={language} childProfileId={childProfileId} />
              <Quiz review language={language} childProfileId={childProfileId} />
            </div>
          </>
        ) : (
          <DiscoveryResult
            result={result}
            language={language}
            childProfileId={childProfileId}
            onReset={() => setResult(null)}
          />
        )}
      </div>
    </main>
  );
}

function DiscoveryResult({ result, language, childProfileId, onReset }) {
  if (!result.identified) {
    return (
      <div className="result-card">
        <div className="result-heading">
          <div className="result-heading-icon">{result.isSafe === false ? '🛡️' : '🔍❓'}</div>
          <h2>{result.isSafe === false ? 'Adult item' : 'Not quite sure!'}</h2>
          <p>{result.message}</p>
        </div>
        <button type="button" className="snap-another" onClick={onReset}>📸 Try another</button>
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="result-heading">
        <div className="result-heading-icon">✨</div>
        <h2>{result.objectName}</h2>
      </div>
      <div className="result-panel summary">
        <strong>What is it?</strong>
        <p><VocabularyText text={result.kidSummary} vocabulary={result.vocabulary} /></p>
      </div>
      {result.funFact && (
        <div className="result-panel fact">
          <strong>🌟 Fun fact</strong>
          <p><VocabularyText text={result.funFact} vocabulary={result.vocabulary} /></p>
        </div>
      )}
      {result.actionPrompt && (
        <div className="result-panel action">
          <strong>👀 Try this</strong>
          <p>{result.actionPrompt}</p>
        </div>
      )}
      <div className="result-meta">
        <span>{result.grounding?.grounded ? `📖 ${result.grounding.source_title}` : '🔍 Direct observation'}</span>
        {result.readability && <span>Grade {result.readability.grade_level}</span>}
      </div>
      <DiscoveryMap objectName={result.objectName} onReset={onReset} />
      <Quiz objectName={result.objectName} language={result.language || language} childProfileId={childProfileId} />
      <Story objectName={result.objectName} language={result.language || language} childProfileId={childProfileId} />
      <button type="button" className="snap-another" onClick={onReset}>📸 Snap another</button>
    </div>
  );
}
