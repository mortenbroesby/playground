import { describe, expect, it } from 'vitest';

import { normalizeTitle } from '../src/utils';

describe('todo-input utils', () => {
  it('normalizes user-provided titles', () => {
    expect(normalizeTitle('   hello world   ')).toBe('hello world');
  });
});
