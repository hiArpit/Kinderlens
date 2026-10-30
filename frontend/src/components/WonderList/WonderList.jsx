import React, { useEffect, useState } from 'react';
import './WonderList.css';
import { childSessionHeaders, hasChildSession } from '../../childSession';

const LOAD_WONDERS_MESSAGE = 'I couldn’t load the Wonder List just now. Please try again soon.';
const EXPLORE_WONDER_MESSAGE = 'I couldn’t explore that just now. Please try again in a little bit.';

async function readJsonResponse(response, fallbackMessage) {
  const body = await response.text();
  if (!body.trim()) {
    console.error('Wonder List API returned an empty response.', { status: response.status });
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    console.error('Wonder List API returned invalid JSON.', { status: response.status, error });
    throw new Error(fallbackMessage);
  }
}

export default function WonderList({ onExplore, language = 'english', childProfileId = '' }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loadingSlug, setLoadingSlug] = useState('');

  useEffect(() => {
    fetch('/api/wonder-list')
      .then(async (response) => {
        const data = await readJsonResponse(response, LOAD_WONDERS_MESSAGE);
        if (!response.ok) {
          console.error('Wonder List request failed.', { status: response.status, message: data.message });
          throw new Error(LOAD_WONDERS_MESSAGE);
        }
        setItems(data.items || []);
      })
      .catch((loadError) => {
        console.error('Could not load Wonder List.', loadError);
        setError(LOAD_WONDERS_MESSAGE);
      });
  }, []);

  const explore = async (item) => {
    setLoadingSlug(item.slug);
    setError('');
    try {
      const response = await fetch(`/api/wonder-list/${item.slug}/explore`, {
        method: 'POST',
        credentials: 'include',
        headers: childSessionHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          language,
          ...(!hasChildSession() && childProfileId ? { child_profile_id: childProfileId } : {}),
        }),
      });
      const data = await readJsonResponse(response, EXPLORE_WONDER_MESSAGE);
      if (!response.ok || !data.success || data.available === false) {
        console.error('Wonder item exploration failed.', { status: response.status, message: data.message });
        throw new Error(EXPLORE_WONDER_MESSAGE);
      }
      onExplore(data);
    } catch (exploreError) {
      console.error('Could not explore Wonder List item.', exploreError);
      setError(EXPLORE_WONDER_MESSAGE);
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
