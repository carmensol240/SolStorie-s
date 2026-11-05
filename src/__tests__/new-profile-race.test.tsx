import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { StoryFormData } from "@/pages/CreateStory";

// A saved profile that arrives LATE (after the user already clicked "new profile").
const SAVED_CHILD = {
  id: "child-saved-1",
  name: "נועם",
  age: 6,
  gender: "male",
  photo_url: "saved-photo",
  avatar_url: "saved-avatar",
  personality_traits: null,
  fixed_details: null,
  clothing_type: "גיבור/ת על",
  clothing_color: "צהוב",
  hair_color: "חום",
  hair_style: "קצר",
  kippah: false,
};

let resolveChildren: (value: { data: unknown[]; error: null }) => void;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "u1", email: "t@t.com" }, loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "children") {
        return {
          select: () => ({
            eq: () =>
              new Promise((resolve) => {
                resolveChildren = resolve;
              }),
          }),
        };
      }
      // profiles and anything else: empty, immediately resolved
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
        }),
      };
    },
  },
}));

import ChildInfoStep from "@/components/wizard/ChildInfoStep";

const cleanForm: StoryFormData = {
  childName: "",
  childGender: "male",
  ageRange: "2-4",
  childAge: 4,
  storyLength: "short",
  childPhoto: null,
  childAvatarUrl: null,
  photoConsent: false,
  nikud: true,
  language: "he",
  topic: "",
  customTopic: "",
  personalityTraits: "",
  className: "",
  fixedDetails: "",
  clothingType: "",
  clothingColor: "",
  kippah: false,
  hairColor: "",
  hairStyle: "",
};

describe("new profile race", () => {
  beforeEach(() => {
    window.matchMedia ||= ((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    })) as any;
  });

  it("clicking 'פרופיל חדש +' before saved profiles load keeps the form clean", async () => {
    const updates: Partial<StoryFormData>[] = [];
    const updateFormData = (u: Partial<StoryFormData>) => updates.push(u);
    const selected: (string | null)[] = [];

    render(
      <ChildInfoStep
        formData={cleanForm}
        updateFormData={updateFormData}
        onSelectedChildChange={(id) => selected.push(id)}
      />
    );

    // Click "new profile" while the saved-profiles fetch is still in flight.
    const btn = await screen.findByText(/פרופיל חדש/);
    fireEvent.click(btn);

    // The click itself must clear every field, including consent.
    const clearCall = updates.find(
      (u) => u.childName === "" && u.childPhoto === null && u.childAvatarUrl === null
    );
    expect(clearCall).toBeDefined();
    expect(clearCall!.photoConsent).toBe(false);
    expect(clearCall!.clothingType).toBe("");
    expect(clearCall!.hairColor).toBe("");

    // Now the saved profiles arrive late.
    await act(async () => {
      resolveChildren({ data: [SAVED_CHILD], error: null });
    });

    // The late load must never fill the new profile with the saved child.
    const leaked = updates.find(
      (u) =>
        u.childName === SAVED_CHILD.name ||
        u.childAvatarUrl === SAVED_CHILD.avatar_url ||
        u.childPhoto === SAVED_CHILD.photo_url ||
        (u as Record<string, unknown>).childId === SAVED_CHILD.id
    );
    expect(leaked).toBeUndefined();
    expect(selected).not.toContain(SAVED_CHILD.id);
    expect(selected[selected.length - 1]).toBeNull();
  });
});
