import { CHARACTER_SECTIONS } from "@/components/wizard/topic-data";

// Build a lookup map: topicId → categoryId
const topicToCategoryMap = new Map<string, string>();
// Also map Hebrew labels to categoryId for DB stories that store Hebrew topic names
const hebrewLabelToCategoryMap = new Map<string, string>();

CHARACTER_SECTIONS.forEach((section) => {
  section.topics.forEach((topic) => {
    topicToCategoryMap.set(topic.id, section.id);
    topicToCategoryMap.set(topic.id.toLowerCase(), section.id);
    hebrewLabelToCategoryMap.set(topic.label, section.id);
  });
});

/**
 * Maps a story's topic field to a category ID.
 * The topic can be an English ID (e.g. "superheroes") or a Hebrew label (e.g. "אנחנו גיבורי על").
 */
export function getStoryCategoryId(topic: string): string | null {
  // Try direct English ID match
  const byId = topicToCategoryMap.get(topic) || topicToCategoryMap.get(topic.toLowerCase());
  if (byId) return byId;

  // Try Hebrew label match
  const byLabel = hebrewLabelToCategoryMap.get(topic);
  if (byLabel) return byLabel;

  return null;
}
