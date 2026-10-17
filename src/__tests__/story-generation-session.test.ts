import { describe, it, expect, beforeEach } from "vitest";
import {
  startGenerationSession,
  getActiveGenerationSession,
  clearGenerationSession,
  decideArrival,
  shouldDeferAutoReload,
  SESSION_TTL_MS,
} from "@/lib/story-generation-session";

const form = { childName: "נועה", childPhoto: "https://x/photo.jpg" };

describe("story generation session", () => {
  beforeEach(() => localStorage.clear());

  it("resuming with a story already saved on the server never re-sends creation", () => {
    const s = startGenerationSession("u1", form);
    expect(decideArrival(s, { id: "st1", slug: "abc", generation_status: "generating" }).kind).toBe("still_generating");
    expect(decideArrival(s, { id: "st1", slug: "abc", generation_status: "generating_illustrations" }).kind).toBe("ready");
    expect(decideArrival(s, { id: "st1", slug: "abc", generation_status: "ready" }).kind).toBe("ready");
  });

  it("resume re-uses the same request ID", () => {
    const s = startGenerationSession("u1", form);
    expect(getActiveGenerationSession("u1")?.requestId).toBe(s.requestId);
  });

  it("safety net only with a valid mark: none after 15 minutes", () => {
    const t0 = 1_000_000;
    const s = startGenerationSession("u1", form, t0);
    expect(getActiveGenerationSession("u1", t0 + SESSION_TTL_MS + 1)).toBeNull();
    expect(decideArrival(s, { id: "st1", slug: null, generation_status: "ready" }, t0 + SESSION_TTL_MS + 1).kind).toBe("form");
    expect(decideArrival(null, { id: "st1", slug: null, generation_status: "ready" }).kind).toBe("form");
  });

  it("clearing (success or new story) removes the mark and the legacy saved form", () => {
    startGenerationSession("u1", form);
    localStorage.setItem("pending_story_formData", "{}");
    clearGenerationSession("u1");
    expect(getActiveGenerationSession("u1")).toBeNull();
    expect(localStorage.getItem("pending_story_formData")).toBeNull();
  });

  it("automatic reloads wait during creation", () => {
    expect(shouldDeferAutoReload("/library")).toBe(false);
    expect(shouldDeferAutoReload("/create")).toBe(true);
    startGenerationSession("u1", form);
    expect(shouldDeferAutoReload("/library")).toBe(true);
  });
});
