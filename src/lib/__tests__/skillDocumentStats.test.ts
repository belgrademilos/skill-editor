import { describe, it, expect } from 'vitest';
import { getTokenCount } from '../skillDocumentStats';

describe('getTokenCount', () => {
  it('returns 0 for empty string', () => {
    expect(getTokenCount('')).toBe(0);
  });

  it('estimates from character length', () => {
    expect(getTokenCount('abcd')).toBe(1);
    expect(getTokenCount('abcde')).toBe(2);
  });
});
