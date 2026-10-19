// Server mirror of the browser's verifyPdfEntitlement (src/hooks/use-pdf-export.ts).
// Takes a service-role client so it can run in edge functions and in tests.
// deno-lint-ignore no-explicit-any
type Client = any;

export async function hasPdfEntitlement(client: Client, userId: string, storyId?: string): Promise<boolean> {
  if (!userId) return false;
  const { data: effAdmin } = await client.rpc('is_effective_admin', { _user_id: userId });
  if (effAdmin) return true;

  const { data: profile } = await client.from('profiles').select('is_subscriber').eq('id', userId).maybeSingle();
  if (profile?.is_subscriber) return true;

  const { data: purchases } = await client
    .from('purchases')
    .select('package_name')
    .eq('user_id', userId)
    .in('status', ['completed', 'test_completed'])
    .limit(50);
  const full = (purchases ?? []).some((row: { package_name?: string | null }) => {
    const name = row?.package_name ?? '';
    return !name.includes('single_story') || name.includes('single_story_full');
  });
  if (full) return true;

  if (storyId) {
    const { data: unlock } = await client
      .from('story_unlocks')
      .select('unlock_type')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .eq('unlock_type', 'single')
      .maybeSingle();
    if (unlock) return true;
  }
  return false;
}
