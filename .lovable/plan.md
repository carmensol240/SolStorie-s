

## Plan: Regenerate 10 Biblical Topic Gallery Images

### What changes

Add the 10 biblical story topics to the `generate-topic-images` edge function with the specific scene prompts provided, then update `topic-data.ts` to load these images from the storage bucket instead of local assets.

### Changes

**1. `supabase/functions/generate-topic-images/index.ts`** — Add 10 new entries to `TOPIC_PROMPTS`:

| Topic ID | Scene | Characters |
|---|---|---|
| `moses-basket` | Baby in reed basket on Nile, lotus flowers, golden