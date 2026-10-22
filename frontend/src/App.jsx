import React, { useState } from 'react';
import PhotoCapture from './components/Capture/PhotoCapture';

export default function App() {
  const [uploadResult, setUploadResult] = useState(null);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e3a8a', margin: 0 }}>🔍 KinderLens</h1>
        <p style={{ fontSize: '1.1rem', color: '#4b5563', margin: '0.25rem 0 0 0' }}>
          Point, snap, and discover!
        </p>
      </header>

      {!uploadResult ? (
        <PhotoCapture onUploadSuccess={(data) => setUploadResult(data)} />
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ color: '#065f46', margin: '0 0 0.5rem 0' }}>Photo Ready!</h2>
          <p style={{ color: '#374151', fontSize: '1rem' }}>
            Validated: <strong>{uploadResult.fileInfo?.originalName}</strong>
          </p>
          <button
            onClick={() => setUploadResult(null)}
            style={{
              marginTop: '1.5rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '0.75rem 1.5rem',
              fontSize: '1.1rem',
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