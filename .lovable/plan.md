

## Plan: Add Gender-Appropriate Religious Symbols Restriction

### Overview
Add a restriction to the negative prompts in `style-config.ts` to prevent AI models from placing kippahs or male religious items on female characters.

### Changes — `supabase/functions/_shared/style-config.ts`

Append the following to `NEGATIVE_PROMPT_FULL` (which feeds into `CAST_NEGATIVE_PROMPT`, `TOPIC_IMAGE_STYLE_SUFFIX`, and `buildIllustrationPrompt`):

```
no kippah on girls, no yarmulke on female characters, no male religious clothing on female characters, no gender-inappropriate religious symbols
```

Also add a new exported constant `GENDER_SYMBOL_RESTRICTION` with a positive instruction to include in illustration prompts:

```
CRITICAL — GENDER-APPROPRIATE SYMBOLS: Never place a kippah (yarmulke) on a girl character. Never add male religious symbols or clothing on female characters. Use gender-appropriate religious symbols only, or avoid religious symbols altogether unless specifically requested in the story.
```

Inject this constant into `buildIllustrationPrompt()` alongside the existing `CHARACTER_CONSISTENCY_PROMPT`.

### Files modified
1. `supabase/functions/_shared/style-config.ts`

