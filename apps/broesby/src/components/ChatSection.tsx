import { useState } from 'react';
import { addChatMessage, listChatMessages } from '../lib/storage';
import type { ChatMessageRecord } from '../lib/types';

type ChatSectionProps = {
  displayName: string;
};

export function ChatSection({ displayName }: ChatSectionProps) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<ChatMessageRecord[]>(() => listChatMessages());

  function handleSubmit() {
    const nextText = text.trim();

    if (!nextText || !displayName) {
      return;
    }

    addChatMessage({
      authorName: displayName,
      text: nextText,
    });
    setItems(listChatMessages());
    setText('');
  }

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Chat</p>
        <h2 className="section-title">Leave a note for later</h2>
      </div>
      <label className="field">
        <span>Message</span>
        <textarea
          aria-label="Message"
          rows={4}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />
      </label>
      <button className="primary-button" type="button" onClick={handleSubmit}>
        Send message
      </button>
      <div className="feed">
        {items.length === 0 ? (
          <p className="empty-state">No messages yet in this browser. Start the conversation.</p>
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
