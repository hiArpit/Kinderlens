import React, { useState } from 'react';
import PhotoCapture from './components/Capture/PhotoCapture';
import ParentDashboard from './components/Parent/ParentDashboard';
import WonderList from './components/WonderList/WonderList';

export default function App() {
  const [result, setResult] = useState(null);
  const [showParentDashboard, setShowParentDashboard] = useState(false);

  const handleUploadSuccess = (data) => {
    setResult(data);
  };

  const handleReset = () => {
    setResult(null);
  };

  if (showParentDashboard) {
    return (
      <main style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <ParentDashboard onClose={() => setShowParentDashboard(false)} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e3a8a', margin: 0 }}>🔍 KinderLens</h1>
        <p style={{ fontSize: '1.1rem', color: '#4b5563', margin: '0.25rem 0 0 0' }}>
          Point, snap, and discover!
        </p>
        <button
          type="button"
          onClick={() => setShowParentDashboard(true)}
          style={{ background: 'none', border: 0, color: '#475569', cursor: 'pointer', marginTop: '0.75rem' }}
        >
          Parent area
        </button>
      </header>

      {!result ? (
        <>
          <WonderList onExplore={handleUploadSuccess} />
          <PhotoCapture onUploadSuccess={handleUploadSuccess} />
        </>
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {result.identified ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', lineHeight: '1' }}>✨</div>
                <h2 style={{ color: '#1e3a8a', margin: '0.5rem 0 0 0', textTransform: 'capitalize', fontSize: '1.8rem' }}>
                  {result.objectName}
                </h2>
              </div>

              {/* Kid-Calibrated Summary */}
              <div style={{ backgroundColor: '#eff6ff', borderRadius: '16px', padding: '1rem' }}>
                <p style={{ color: '#1e40af', fontSize: '1.15rem', margin: 0, lineHeight: '1.5', fontWeight: 500 }}>
                  {result.kidSummary}
                </p>
              </div>

              {/* Fun Fact Badge */}
              {result.funFact && (
                <div style={{ backgroundColor: '#fef3c7', borderRadius: '16px', padding: '1rem' }}>
                  <span style={{ fontWeight: 700, color: '#92400e', display: 'block', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                    🌟 Fun Fact:
                  </span>
                  <p style={{ color: '#78350f', fontSize: '1.05rem', margin: 0, lineHeight: '1.4' }}>
                    {result.funFact}
                  </p>
                </div>
              )}

              {/* Action Prompt */}
              {result.actionPrompt && (
                <div style={{ backgroundColor: '#ecfdf5', borderRadius: '16px', padding: '1rem' }}>
                  <span style={{ fontWeight: 700, color: '#065f46', display: 'block', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                    👀 Try This:
                  </span>
                  <p style={{ color: '#047857', fontSize: '1.05rem', margin: 0, lineHeight: '1.4' }}>
                    {result.actionPrompt}
                  </p>
                </div>
              )}

              {/* Grounding Source & Reading Level Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.8rem', color: '#6b7280' }}>
                {result.grounding?.grounded ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    📖 Verified via {result.grounding.source_title}
                  </span>
                ) : (
                  <span>🔍 Direct observation</span>
                )}

                {result.readability && (
                  <span>Reading: Grade {result.readability.grade_level}</span>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem' }}>{result.isSafe === false ? '🛡️' : '🔍❓'}</div>
              <h2 style={{ color: result.isSafe === false ? '#dc2626' : '#d97706', margin: '0.5rem 0' }}>
                {result.isSafe === false ? 'Adult Item' : 'Not Quite Sure!'}
              </h2>
              <p style={{ color: '#4b5563', fontSize: '1.05rem', lineHeight: '1.4', margin: '0 0 1rem 0' }}>
                {result.message}
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '0.85rem 1.75rem',
              fontSize: '1.15rem',
              fontWeight: 700,
              cursor: 'pointer',
              alignSelf: 'center'
            }}
          >
            📸 Snap Another
          </button>
        </div>
      )}
    </main>
  );
}