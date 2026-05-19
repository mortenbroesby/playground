import { useState } from 'react';
import { addAnecdote, listAnecdotes } from '../lib/storage';
import type { AnecdoteRecord } from '../lib/types';

type AnecdotesSectionProps = {
  displayName: string;
};

export function AnecdotesSection({ displayName }: AnecdotesSectionProps) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<AnecdoteRecord[]>(() => listAnecdotes());

  function handleSubmit() {
    const nextText = text.trim();

    if (!nextText || !displayName) {
      return;
    }

    addAnecdote({
      authorName: displayName,
      text: nextText,
    });
    setItems(listAnecdotes());
    setText('');
  }

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Anecdotes</p>
        <h2 className="section-title">Keep the good little stories</h2>
      </div>
      <label className="field">
        <span>New anecdote</span>
        <textarea
          aria-label="New anecdote"
          rows={5}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />
      </label>
      <button className="primary-button" type="button" onClick={handleSubmit}>
        Share anecdote
      </button>
      <div className="feed">
        {items.length === 0 ? (
          <p className="empty-state">No anecdotes yet in this browser. Add the first one.</p>
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="feed-card">
            <div className="feed-card-header">
              <strong>{item.authorName}</strong>
              <span>{formatTimestamp(item.createdAt)}</span>
            </div>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
