import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sanitizeTalkQuestions } from "../_shared/talk-questions.ts";

Deno.test("a question naming the hero is dropped (the child is the hero)", () => {
  const list = [
    "איך הרגשת כשהכדור נעצר ליד הקורה?",
    "באיזה משחק אתה רוצה להשתפר כמו נועם?",
    "מה אמרה לך החבורה בסוף?",
    "מה עוזר לך כשקשה?",
  ];
  const out = sanitizeTalkQuestions(list, false, "נועם");
  assertEquals(out.length, 3);
  assertEquals(out.some((q) => q.includes("נועם")), false);
});
