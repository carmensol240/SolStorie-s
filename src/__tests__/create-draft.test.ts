import { describe, it, expect, beforeEach } from "vitest";
import { saveCreateDraft, loadCreateDraft, clearCreateDraft, clearAllCreateDrafts } from "@/lib/create-draft";

describe("create form draft", () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });

  it("never stores uploaded image data", () => {
    saveCreateDraft("u1", { childName: "סול", childPhoto: "data:image/jpeg;base64,AAAA", childAvatarUrl: "https://x/a.png" }, null);
    const d = loadCreateDraft("u1")!;
    expect(d.data.childName).toBe("סול");
    expect(d.data.childPhoto).toBeUndefined();
    expect(d.data.childAvatarUrl).toBeUndefined();
    expect(sessionStorage.getItem("create_draft_u1")).not.toContain("base64");
  });

  it("keeps a photo that is already a server address", () => {
    saveCreateDraft("u1", { childPhoto: "https://cdn/child.jpg" }, "c1");
    expect(loadCreateDraft("u1")!.data.childPhoto).toBe("https://cdn/child.jpg");
    expect(loadCreateDraft("u1")!.selectedChildId).toBe("c1");
  });

  it("another user never sees the draft", () => {
    saveCreateDraft("u1", { childName: "סול" }, null);
    expect(loadCreateDraft("u2")).toBeNull();
  });

  it("uses sessionStorage, not localStorage", () => {
    saveCreateDraft("u1", { childName: "סול" }, null);
    expect(localStorage.getItem("create_draft_u1")).toBeNull();
    expect(sessionStorage.getItem("create_draft_u1")).not.toBeNull();
  });

  it("clears for one user, and for all on sign-out", () => {
    saveCreateDraft("u1", { childName: "a" }, null);
    saveCreateDraft("u2", { childName: "b" }, null);
    clearCreateDraft("u1");
    expect(loadCreateDraft("u1")).toBeNull();
    expect(loadCreateDraft("u2")).not.toBeNull();
    clearAllCreateDrafts();
    expect(loadCreateDraft("u2")).toBeNull();
  });
});
