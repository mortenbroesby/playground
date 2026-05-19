import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSession,
  getDisplayName,
  isUnlocked,
  setDisplayName,
  unlockSession,
} from './session';

describe('session helpers', () => {
  afterEach(() => {
    clearSession();
  });

  it('starts locked', () => {
    expect(isUnlocked()).toBe(false);
  });

  it('persists unlocked state and display name', () => {
    unlockSession();
    setDisplayName('Morten');

    expect(isUnlocked()).toBe(true);
    expect(getDisplayName()).toBe('Morten');
  });
});
