import React, { useState } from 'react';
import './Story.css';

export default function Story({ objectName }) {
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createStory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_name: objectName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not make a story.');
      if (!data.available) throw new Error(data.message || 'A story is not available yet.');
      setStory(data);
    } catch (storyError) {
      setError(storyError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="story-card" aria-labelledby="story-heading">
      <div className="story-heading">
        <span aria-hidden="true">📖</span>
        <div>
          <h3 id="story-heading">Learning story</h3>
          <p>A short story inspired by {objectName}.</p>
        </div>
      </div>
      {!story && (
        <button type="button" className="story-primary-button" onClick={createStory} disabled={isLoading}>
          {isLoading ? 'Writing your story...' : 'Read a story'}
        </button>
      )}
      {error && <p className="story-error" role="alert">{error}</p>}
      {story && (
        <article className="story-content">
          <h4>{story.title}</h4>
          {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <small>📖 Facts verified via {story.grounding?.source_title}</small>
        </article>
      )}
    </section>
  );
}
