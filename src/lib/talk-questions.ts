import { supabase } from '@/integrations/supabase/client';

/** Saved "let's talk" questions for a story; made once on the server when missing. [] on any failure. */
export async function fetchTalkQuestions(storyId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke('story-talk-questions', { body: { storyId } });
    if (error) return [];
    return Array.isArray(data?.questions) ? data.questions.filter((q: unknown) => typeof q === 'string') : [];
  } catch {
    return [];
  }
}

export const talkTitle = (lang: 'he' | 'en', nikud: boolean) =>
  lang === 'en' ? "Let's talk about the story" : nikud ? 'בּוֹאוּ נְדַבֵּר עַל הַסִּפּוּר' : 'בואו נדבר על הסיפור';
export const NEXT_ADVENTURE_URL = 'https://soulstory.co.il/create?from=book';
export const INSTAGRAM_HANDLE = '@sol.stories.kids';
