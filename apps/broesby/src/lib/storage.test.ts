import { afterEach, describe, expect, it } from 'vitest';
import {
  addAnecdote,
  addChatMessage,
  listAnecdotes,
  listChatMessages,
  resetStoredContent,
} from './storage';

describe('content storage', () => {
  afterEach(() => {
    resetStoredContent();
  });

  it('stores anecdotes in newest-first order', () => {
    addAnecdote({ authorName: 'Morten', text: 'First story' });
    addAnecdote({ authorName: 'Pernille', text: 'Second story' });

    const items = listAnecdotes();

    expect(items).toHaveLength(2);
    expect(items[0]?.text).toBe('Second story');
    expect(items[1]?.text).toBe('First story');
  });

  it('stores chat messages in chronological order', () => {
    addChatMessage({ authorName: 'Morten', text: 'First' });
    addChatMessage({ authorName: 'Pernille', text: 'Second' });

    const items = listChatMessages();

    expect(items).toHaveLength(2);
    expect(items[0]?.text).toBe('First');
    expect(items[1]?.text).toBe('Second');
  });
});
