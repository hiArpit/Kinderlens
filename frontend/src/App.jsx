import React, { useState } from 'react';
import PhotoCapture from './components/Capture/PhotoCapture';

export default function App() {
  const [result, setResult] = useState(null);

  const handleUploadSuccess = (data) => {
    setResult(data);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e3a8a', margin: 0 }}>🔍 KinderLens</h1>
        <p style={{ fontSize: '1.1rem', color: '#4b5563', margin: '0.25rem 0 0 0' }}>
          Point, snap, and discover!
        </p>
      </header>

      {!result ? (
        <PhotoCapture onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}>
          {result.identified ? (
            <>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>💡</div>
              <h2 style={{ color: '#1e3a8a', margin: '0 0 0.75rem 0', textTransform: 'capitalize' }}>
                {result.objectName}
              </h2>
              <p style={{ color: '#374151', fontSize: '1.1rem', lineHeight: '1.5', textAlign: 'left', background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                {result.rawDescription}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🔍❓</div>
              <h2 style={{ color: '#d97706', margin: '0 0 0.75rem 0' }}>Not Quite Sure!</h2>
              <p style={{ color: '#4b5563', fontSize: '1.05rem', lineHeight: '1.4' }}>
                {result.message}
              </p>
            </>
          )}

          <button
            onClick={handleReset}
            style={{
              marginTop: '1.5rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '0.85rem 1.75rem',
              fontSize: '1.15rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📸 Snap Another
          </button>
        </div>
      )}
    </main>
  );
}