import React, { useEffect, useState } from 'react';
import './WonderList.css';

async function readJsonResponse(response, fallbackMessage) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(fallbackMessage);
  }
}

export default function WonderList({ onExplore, language = 'english' }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loadingSlug, setLoadingSlug] = useState('');

  useEffect(() => {
    fetch('/api/wonder-list')
      .then(async (response) => {
        const data = await readJsonResponse(response, 'Discoveries are still loading. Please try again.');
        if (!response.ok) throw new Error(data.message || 'Could not load discoveries.');
        setItems(data.items || []);
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  const explore = async (item) => {
    setLoadingSlug(item.slug);
    setError('');
    try {
      const response = await fetch(`/api/wonder-list/${item.slug}/explore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      const data = await readJsonResponse(
        response,
        'This discovery is still loading. Please restart the backend and try again.'
      );
      if (!response.ok) throw new Error(data.message || 'Could not explore this item.');
      onExplore(data);
    } catch (exploreError) {
      setError(exploreError.message);
    } finally {
      setLoadingSlug('');
    }
  };

  return (
    <section className="wonder-list">
      <div className="wonder-heading">
        <span aria-hidden="true">🌟</span>
        <h2>Wonder List</h2>
        <p>Pick something amazing to learn about.</p>
      </div>
      {error && <p className="wonder-error" role="alert">{error}</p>}
      <div className="wonder-grid">
        {items.map((item) => (
          <button
            type="button"
            className="wonder-item"
            key={item.slug}
            onClick={() => explore(item)}
            disabled={Boolean(loadingSlug)}
          >
            <span className="wonder-emoji" aria-hidden="true">{item.emoji}</span>
            <strong>{item.name}</strong>
            <small>{item.category}</small>
            <span className="wonder-action">
              {loadingSlug === item.slug ? 'Loading...' : 'Explore'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
