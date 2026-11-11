import { describe, it, expect } from 'vitest';
import { containFit, isAvatarCoverUrl } from './avatar-cover';

describe('avatar cover', () => {
  it('recognises only the avatar cover copy', () => {
    expect(isAvatarCoverUrl('https://h/story-illustrations/abc/cover-avatar.png?v=1')).toBe(true);
    expect(isAvatarCoverUrl('https://h/story-illustrations/abc/page-1.png?v=1')).toBe(false);
    expect(isAvatarCoverUrl(null)).toBe(false);
  });
  it('fits a portrait avatar whole into the square print cover without stretching', () => {
    const { w, h } = containFit(864, 1184, 2551, 1990);
    expect(h).toBeCloseTo(1990);
    expect(w / h).toBeCloseTo(864 / 1184, 5);
    expect(w).toBeLessThanOrEqual(2551);
  });
});
