import React, { useMemo, useState } from 'react';
import './VocabularyText.css';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function VocabularyText({ text, vocabulary = [] }) {
  const [selectedTerm, setSelectedTerm] = useState(null);
  const terms = useMemo(
    () => vocabulary.filter((entry) => entry?.term && entry?.meaning),
    [vocabulary]
  );

  const parts = useMemo(() => {
    if (!text || terms.length === 0) return [{ value: text, term: null }];
    const pattern = terms.map((entry) => escapeRegExp(entry.term)).join('|');
    const matcher = new RegExp(`(${pattern})`, 'gi');
    return text.split(matcher).map((value) => {
      const match = terms.find((entry) => entry.term.toLowerCase() === value.toLowerCase());
      return { value, term: match || null };
    });
  }, [text, terms]);

  return (
    <>
      <span className="vocabulary-text">
        {parts.map((part, index) => (
          part.term ? (
            <button
              type="button"
              className="vocabulary-term"
              key={`${part.value}-${index}`}
              onClick={() => setSelectedTerm(part.term)}
              aria-label={`Explain ${part.value}`}
            >
              {part.value}
            </button>
          ) : <React.Fragment key={`${part.value}-${index}`}>{part.value}</React.Fragment>
        ))}
      </span>
      {selectedTerm && (
        <aside className="vocabulary-popover" role="status">
          <strong>{selectedTerm.term}</strong>
          <p>{selectedTerm.meaning}</p>
          <button type="button" onClick={() => setSelectedTerm(null)}>Got it</button>
        </aside>
      )}
    </>
  );
}
