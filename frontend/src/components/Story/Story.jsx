import React, { useState } from 'react';
import './Story.css';
import VocabularyText from '../Vocabulary/VocabularyText';
import { childSessionHeaders, hasChildSession } from '../../childSession';

const STORY_RETRY_MESSAGE = 'I couldn’t make your story just now. Please try again in a little bit.';

async function readJsonResponse(response) {
  const body = await response.text();
  if (!body.trim()) {
    console.error('Story API returned an empty response.', { status: response.status });
    throw new Error(STORY_RETRY_MESSAGE);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    console.error('Story API returned invalid JSON.', { status: response.status, error });
    throw new Error(STORY_RETRY_MESSAGE);
  }
}

export default function Story({ objectName, language = 'english', childProfileId = '' }) {
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createStory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        credentials: 'include',
        headers: childSessionHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          object_name: objectName,
          language,
          ...(!hasChildSession() && childProfileId ? { child_profile_id: childProfileId } : {}),
        }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) {
        console.error('Story request failed.', { status: response.status, message: data.message });
        throw new Error(STORY_RETRY_MESSAGE);
      }
      if (!data.available) {
        console.warn('Story is unavailable.', { message: data.message });
        throw new Error(STORY_RETRY_MESSAGE);
      }
      setStory(data);
    } catch (storyError) {
      console.error('Could not generate story.', storyError);
      setError(STORY_RETRY_MESSAGE);
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
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph}>
              <VocabularyText text={paragraph} vocabulary={story.vocabulary} />
            </p>
          ))}
          <small>📖 Facts verified via {story.grounding?.source_title}</small>
        </article>
      )}
    </section>
  );
}
