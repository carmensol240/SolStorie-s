# NLP in stories: what exists today, and a proposal

Nothing has been changed. Sections 1-3 answer your questions; section 4 is the proposal for approval.

## 1. The instructions today (text sent to the AI on every story)

**Main instruction (Hebrew):** "מערכת סיפורי ילדים טיפוליים" — the writer specializes in NLP and social stories, writing empowering, emotional, age-appropriate prose.

**Advanced NLP principles (marked critical):**
1. Growth mindset — praise effort and learning, never failure
2. Emotional reflection in sensory language
3. Positive phrasing — what to do, not what not to do
4. Positive framing of challenges
5. Presuppositions of success ("כשתצליח..." rather than "אם")
6. Diverse families — "המבוגרים שאוהבים אותו" unless the parent specified
7. Emotional anchoring in the body
8. Normalization of hard feelings ("גם גיבורים מרגישים פחד לפעמים")
9. Simple, concrete metaphors
10. The child feels seen, understood and capable

**Adaptation for children on the spectrum (mandatory):** short clear sentences, no double meanings, no abstract metaphors, always explain why a character feels something, calming repetition, a clear predictable ending, no sudden surprises, clear order between pages.

**Age adaptation:** per exact age — page count, words per page (e.g. age 10-12: 12 pages, 50-60 words per page), sentence complexity, how deep the emotions and social situations go. Ages 0-2 get very short sentences, sensory words and repetition.

**Polishing step after writing (Hebrew stories only):** a second AI pass rewrites the text for language quality and repeats the same NLP and spectrum rules, with sentence-length limits by age (2-3: up to 4 words; 4-5: up to 7; 6-8: up to 10).

**English stories:** a much shorter instruction — only "positive, growth-mindset language" and "gentle educational messages". No NLP list, no spectrum rules, no polishing step.

## 2. Techniques by topic type

The same 10 techniques are requested for **every** topic. Nothing changes between fear, transitions, habits or friendship. The only thing that varies by topic is its own description (for example "פחד מהחושך"), plus a special set of rules for Bible stories (no fear, a time-travel frame). So a fear story isn't specifically asked for, say, a calming body anchor, and a habit story isn't asked for small achievable steps.

## 3. Is there a check after the story is written?

No. Nothing checks whether the techniques actually show up in the text, and nothing records which ones were used. The polishing step only asks for them again; it doesn't verify. The only checks after writing are clothing consistency between pages and niqqud.

## 4. Proposal

**A. A fixed list of techniques** (one shared list with a code, a Hebrew name and an example for each): growth language, emotion naming, body anchor, normalization, positive phrasing, success presupposition, reframing, concrete metaphor, coping strategy (breathing, counting, a safe object), positive reinforcement, a secure ending.

**B. Instructions by topic type.** Each of the 147 topics gets one of 5 types, and each type has 3-4 required techniques (shown here by name):
- **Fears** (dark, doctor, separation): emotion naming, normalization, body anchor, coping strategy, a secure ending
- **Transitions** (new preschool, a new sibling, moving house): predictability (what will happen, step by step), normalization, success presupposition, an anchor object
- **Habits** (sleep, potty, brushing teeth): small steps, positive reinforcement, positive phrasing, growth language
- **Friendship and social** (sharing, anger, new friends): emotion naming in others, reframing, a social strategy, positive reinforcement
- **General / adventure / Bible**: growth language, success presupposition, a secure ending (Bible keeps its own rules)

The general rules and the spectrum rules stay as they are for every story.

**C. An automatic check after writing.** A short AI step reads the finished story and returns, for each required technique: present or missing, plus the sentence where it appears. If a required technique is missing, a single targeted rewrite of the relevant pages adds it, keeping the same word limits, the same plot and the same niqqud rules. Then one quick re-check. If something is still missing, the story is saved anyway (the parent is never blocked) and it's marked for the admin.

**D. Saving.** Each story stores its topic type, the techniques that were found (with the example sentence), whether it needed a fix, and the check's version. A small panel in the admin dashboard shows the coverage rate by technique and topic type, plus the stories that were marked.

**E. English stories** get the same list and the same check (today they get almost nothing).

**What the parent sees:** no change, and story creation takes about 3-6 seconds longer when a fix is needed.

## Estimated cost per story (Gemini 2.5 Flash, the model already in use)

| Step | When it runs | Cost |
|---|---|---|
| Check | every story | about 0.01₪ |
| Targeted fix | only when a technique is missing (estimate 30-50% of stories) | about 0.02₪ |
| Re-check after a fix | only after a fix | about 0.01₪ |
| **Average per story** | | **about 0.02-0.03₪** |
| **Maximum per story** | | **about 0.04₪** |

For comparison, a story's illustrations cost several shekels, so the added cost is under 1%.

## Technical details

- New shared file `supabase/functions/_shared/nlp-techniques.ts`: technique list, mapping each topic to a type (fallback by category in topic-data), required techniques per type, and functions that build the instruction text.
- generate-story: inject the instructions for the topic type into the Hebrew and English instructions; after the existing polishing step, run the check (JSON mode, low temperature), then a rewrite only of the pages that need it, then a re-check. A timeout or error skips the step and never fails the story or affects credits.
- Migration: a new column `nlp_report jsonb` on stories (type, techniques[{code, page, quote}], fixed, version), with no change to RLS.
- Admin: a coverage card in AdminDashboard.
- Tests: mapping topic to type, the required techniques per type, and parsing the check report (missing → triggers a fix; an error → the story is saved without blocking).
- Publishing is needed for this to reach soulstory.co.il.
