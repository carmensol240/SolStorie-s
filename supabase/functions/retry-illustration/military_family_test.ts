import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { buildMilitaryLock, militaryRoleForStory } from "../_shared/military-family.ts";

const door = "בֹּקֶר אֶחָד, הַדֶּלֶת נִפְתַּחַת לְאַט. אַבָּא שֶׁל סוֹל עוֹמֵד שָׁם. הוּא מְחַבֵּק אוֹתָהּ";

Deno.test("reserves topics and army stories find the family member", () => {
  assertEquals(militaryRoleForStory("dad-in-reserves"), "father");
  assertEquals(militaryRoleForStory("אבא במילואים"), "father");
  assertEquals(militaryRoleForStory("custom", "אמא שלי במילואים כבר שבוע"), "mother");
  assertEquals(militaryRoleForStory("space", "סול טסה לחלל"), null);
});

Deno.test("return at the door is always in IDF uniform, no weapons or helmet", () => {
  const lock = buildMilitaryLock("father", door);
  assert(lock.includes("wearing Israel Defense Forces olive-green uniform (olive drab shirt and trousers, brown military boots), green army duffel bag"));
  assert(lock.includes("NO weapons") && lock.includes("NO helmet"));
});

Deno.test("family meal after the return allows regular clothes", () => {
  assert(buildMilitaryLock("father", "אבא ואמא אוכלים ארוחת ערב עם סול ליד השולחן").includes("regular home clothes are allowed"));
});

Deno.test("no lock when the family member is not on the page", () => {
  assertEquals(buildMilitaryLock("father", "סול סופרת כוכבים בחלון"), "");
});
