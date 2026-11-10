// Reads the response body of a failed server-function call (supabase-js puts the Response in error.context).
export async function readFunctionErrorText(error: unknown): Promise<string> {
  const ctx = (error as { context?: unknown })?.context as
    | { clone?: () => Response; text?: () => Promise<string>; body?: unknown }
    | undefined;
  try {
    if (ctx && typeof ctx.clone === 'function') return await ctx.clone().text();
    if (ctx && typeof ctx.text === 'function') return await ctx.text();
    if (typeof ctx?.body === 'string') return ctx.body;
  } catch {
    /* body already read or unavailable */
  }
  return String((error as { message?: string })?.message ?? '');
}

export const REDRAW_LIMIT_MESSAGE = 'הגעת למספר הציורים מחדש בסיפור הזה. לעזרה, כתבו לנו בוואטסאפ 053-5577007';
