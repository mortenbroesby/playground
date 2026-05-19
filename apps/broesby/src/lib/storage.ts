import type { AnecdoteRecord, ChatMessageRecord } from './types';

const anecdotesKey = 'broesby.anecdotes';
const chatMessagesKey = 'broesby.chat-messages';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `broesby-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readCollection<T>(key: string) {
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return [] as T[];
  }

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [] as T[];
  }
}

function writeCollection<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listAnecdotes() {
  return readCollection<AnecdoteRecord>(anecdotesKey);
}

export function addAnecdote(input: { authorName: string; text: string }) {
  const nextRecord: AnecdoteRecord = {
    id: createId(),
    authorName: input.authorName,
    text: input.text,
    createdAt: new Date().toISOString(),
  };

  writeCollection(anecdotesKey, [nextRecord, ...listAnecdotes()]);
  return nextRecord;
}

export function listChatMessages() {
  return readCollection<ChatMessageRecord>(chatMessagesKey);
}

export function addChatMessage(input: { authorName: string; text: string }) {
  const nextRecord: ChatMessageRecord = {
    id: createId(),
    authorName: input.authorName,
    text: input.text,
    createdAt: new Date().toISOString(),
  };

  writeCollection(chatMessagesKey, [...listChatMessages(), nextRecord]);
  return nextRecord;
}

export function resetStoredContent() {
  window.localStorage.removeItem(anecdotesKey);
  window.localStorage.removeItem(chatMessagesKey);
}
