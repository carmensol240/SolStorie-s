import { describe, it, expect } from 'vitest';
import { redrawAllowed, MAX_REDRAWS_PER_PAGE, MAX_REDRAWS_PER_STORY } from '../../supabase/functions/_shared/redraw-limit';

describe('parent redraw limits', () => {
  it('allows at most 2 redraws per page', () => {
    expect(MAX_REDRAWS_PER_PAGE).toBe(2);
    expect(redrawAllowed({ perPage: { 3: 1 }, total: 1 }, [3])).toBe(true);
    expect(redrawAllowed({ perPage: { 3: 2 }, total: 2 }, [3])).toBe(false);
  });

  it('allows at most 6 redraws per story', () => {
    expect(MAX_REDRAWS_PER_STORY).toBe(6);
    expect(redrawAllowed({ perPage: { 1: 2, 2: 2, 3: 1 }, total: 5 }, [4])).toBe(true);
    expect(redrawAllowed({ perPage: { 1: 2, 2: 2, 3: 2 }, total: 6 }, [4])).toBe(false);
  });
});
